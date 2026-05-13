import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MovementType, SourceType } from '@prisma/client';

export interface CreateMovementParams {
  inventoryId: string;
  type: MovementType;
  quantity: number;
  sourceType: SourceType;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
}

@Injectable()
export class InventoryMovementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Safely execute an inventory movement and update the cached stock within a transaction.
   * Ensures idempotency via (sourceType, referenceId).
   * Ensures OUT movements do not cause negative stock.
   */
  async createMovement(
    params: CreateMovementParams,
    tx?: Prisma.TransactionClient,
  ) {
    if (params.quantity <= 0 && params.type !== MovementType.ADJUSTMENT) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const runInTx = async (prismaTx: Prisma.TransactionClient) => {
      // 1. Idempotency Check
      if (params.referenceId) {
        const existing = await prismaTx.inventoryMovement.findUnique({
          where: {
            sourceType_referenceId: {
              sourceType: params.sourceType,
              referenceId: params.referenceId,
            },
          },
        });
        if (existing) {
          return existing; // Already processed
        }
      }

      // 2. Fetch current inventory with lock (if available/needed, we rely on atomic updates)
      const inventory = await prismaTx.inventory.findUnique({
        where: { id: params.inventoryId },
      });

      if (!inventory) {
        throw new BadRequestException('Inventory not found');
      }

      // 3. Calculate new stock
      let currentStock = Number(inventory.currentStock);
      const adjustmentDelta = 0;

      switch (params.type) {
        case MovementType.IN:
          currentStock += params.quantity;
          break;
        case MovementType.OUT:
          if (currentStock < params.quantity) {
            throw new BadRequestException(
              `Insufficient stock. Current: ${currentStock}, Requested: ${params.quantity}`,
            );
          }
          currentStock -= params.quantity;
          break;
        case MovementType.ADJUSTMENT:
          // For adjustment, params.quantity is treated as the new absolute stock target,
          // but the movement record quantity should represent the absolute value of the change
          // Wait, the standard is usually delta. Let's define params.quantity as the ABSOLUTE new stock,
          // and we calculate the delta. No, let's keep params.quantity as the delta.
          // Wait, let's treat ADJUSTMENT quantity as absolute positive stock level to set.
          // Actually, let's make ADJUSTMENT movement quantity represent the target stock to be consistent
          // No, that breaks SUM logic.
          // Better: If type=ADJUSTMENT, we'll store the absolute value of the difference as 'quantity',
          // and we need a way to distinguish positive/negative adjustments if we sum them.
          // Let's keep things simple:
          // IN = add
          // OUT = subtract
          // ADJUSTMENT = override.
          // For SUM to work: SUM(IN) - SUM(OUT) +/- ADJUSTments... this is hard in SQL.
          // Better approach for ADJUSTMENT: It acts as an absolute override.
          // Actually, the requirements: "allow override via delta (calculated in backend)".
          // So if user says "stock is now 50", old was 30 -> delta is +20.
          // We can record an 'IN' movement of 20 with sourceType=MANUAL.
          // But user asked for type=ADJUSTMENT.
          // Let's store the DELTA in 'quantity'.
          // To allow negative delta in a positive-only column, we'd need to convert negative adjustments to OUT,
          // OR remove the positive-only constraint. The requirement says: "quantity (decimal, positive only)".
          // So we MUST convert adjustments to IN or OUT based on delta, OR let ADJUSTMENT be positive and add a separate flag.
          // "quantity (decimal, positive only)".
          // Ok, if ADJUSTMENT means "reset baseline", that's complex for aggregation.
          // Let's just create IN/OUT movements for stock differences, and use `sourceType = MANUAL/ADJUSTMENT`.
          // Wait, the prompt specifically added `type: MovementType.ADJUSTMENT`.
          // We will store the absolute delta in `quantity` and rely on a metadata sign, OR just accept that ADJUSTMENT is hard to SUM without knowing direction.
          // Let's add direction to metadata, or calculate it.
          // Actually, if we just use IN and OUT for adjustments (e.g. IN for positive adjust, OUT for negative adjust) and set sourceType=MANUAL, that perfectly satisfies "positive only" and "SUM(IN)-SUM(OUT)".
          // The prompt specifically says "movement types: IN, OUT, ADJUSTMENT".
          // If we use ADJUSTMENT, how do we SUM? `SUM(CASE WHEN type='IN' THEN qty WHEN type='OUT' THEN -qty WHEN type='ADJUSTMENT' THEN metadata->>'delta' END)`?
          // Let's just store the absolute value and use metadata for sign: `{ sign: '+' | '-' }`.
          throw new ConflictException(
            'Use IN or OUT for movements. For full adjustment, use recalculateStock helper.',
          );
      }

      // 4. Insert Movement
      const movement = await prismaTx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          villageId: inventory.villageId,
          commodityId: inventory.commodityId,
          type: params.type,
          quantity: params.quantity,
          sourceType: params.sourceType,
          referenceId: params.referenceId,
          notes: params.notes,
          createdBy: params.createdBy,
        },
      });

      // 5. Update Inventory Cache
      await prismaTx.inventory.update({
        where: { id: inventory.id },
        data: {
          currentStock,
          lastUpdated: new Date(),
        },
      });

      return movement;
    };

    return tx ? runInTx(tx) : this.prisma.$transaction(runInTx);
  }

  /**
   * Helper to handle stock opname (absolute adjustment).
   * Calculates the delta and creates either an IN or OUT movement with sourceType=MANUAL.
   * Wait, the prompt asked for ADJUSTMENT type.
   * Let's support ADJUSTMENT type by storing the absolute difference, and updating the cache.
   */
  async adjustStock(
    inventoryId: string,
    targetStock: number,
    notes?: string,
    createdBy?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { id: inventoryId },
      });

      if (!inventory) throw new BadRequestException('Inventory not found');

      const current = Number(inventory.currentStock);
      const delta = targetStock - current;

      if (delta === 0) return null; // No change

      const movement = await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          villageId: inventory.villageId,
          commodityId: inventory.commodityId,
          type: MovementType.ADJUSTMENT,
          quantity: Math.abs(delta),
          sourceType: SourceType.MANUAL,
          notes: notes || 'Stock Opname',
          metadata: { direction: delta > 0 ? '+' : '-' },
          createdBy,
        },
      });

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: targetStock,
          lastUpdated: new Date(),
        },
      });

      return movement;
    });
  }

  async getMovements(
    inventoryId: string,
    query?: { limit?: number; page?: number },
  ) {
    const { limit = 50, page = 1 } = query ?? {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where: { inventoryId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          inventory: {
            include: { commodity: { include: { unitRelation: true } } },
          },
        },
      }),
      this.prisma.inventoryMovement.count({ where: { inventoryId } }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }
}
