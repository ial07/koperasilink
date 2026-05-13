import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isValidTransition, getNextStatus } from './utils/status-machine';
import { InventoryMovementService } from '../inventory/inventory-movement.service';
import { MovementType, SourceType } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private movementService: InventoryMovementService,
  ) {}

  // ── Existing ──

  async findAll(user?: any, query?: { limit?: number; page?: number }) {
    const { limit = 50, page = 1 } = query ?? {};
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (user && user.role === 'bumdes_operator' && user.villageId) {
      whereClause.OR = [
        { fromVillageId: user.villageId },
        { toVillageId: user.villageId },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        include: {
          fromVillage: true,
          toVillage: true,
          commodity: { include: { unitRelation: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Phase 9: Create from recommendation ──

  async createFromRecommendation(recommendationId: string, userId: string) {
    const recommendation = await this.prisma.aiRecommendation.findUnique({
      where: { id: recommendationId },
    });
    if (!recommendation)
      throw new NotFoundException('Recommendation not found');
    if (recommendation.status !== 'accepted') {
      throw new BadRequestException('Recommendation must be accepted first');
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          fromVillageId: recommendation.sourceVillageId,
          toVillageId: recommendation.targetVillageId,
          commodityId: recommendation.commodityId,
          quantity: Number(recommendation.recommendedQuantity),
          unitPrice: Number(recommendation.sourcePrice ?? 0),
          shippingCost: Number(recommendation.estimatedShippingCost ?? 0),
          totalAmount: Number(recommendation.estimatedProfit ?? 0),
          status: 'pending',
          aiRecommended: true,
          notes: `from rec: ${recommendation.id}`,
        },
      });

      await tx.aiRecommendation.update({
        where: { id: recommendationId },
        data: { status: 'converted' },
      });

      return transaction;
    });
  }

  // ── Phase 9: Status transition ──

  async updateStatus(id: string, newStatus: string) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Transaction not found');
    if (!isValidTransition(existing.status, newStatus)) {
      throw new BadRequestException(
        `Invalid transition: ${existing.status} → ${newStatus}. Allowed: ${getNextStatus(existing.status).join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { status: newStatus };
      switch (newStatus) {
        case 'confirmed':
          updateData.confirmedAt = new Date();
          break;
        case 'in_transit':
          updateData.shippedAt = new Date();
          break;
        case 'completed':
          updateData.completedAt = new Date();
          await this.adjustInventory(tx as any, existing);
          break;
        case 'cancelled':
          updateData.cancelledAt = new Date();
          break;
      }

      return tx.transaction.update({ where: { id }, data: updateData });
    });
  }

  // ── Phase 9: Stock adjustment on completion ──

  private async adjustInventory(tx: any, t: any) {
    // Determine target inventory
    let targetInventory = await tx.inventory.findUnique({
      where: {
        villageId_commodityId: {
          villageId: t.toVillageId,
          commodityId: t.commodityId,
        },
      },
    });

    if (!targetInventory) {
      targetInventory = await tx.inventory.create({
        data: {
          villageId: t.toVillageId,
          commodityId: t.commodityId,
          currentStock: 0,
          capacity: Number(t.quantity) * 2, // Default capacity logic
          lastUpdated: new Date(),
        },
      });
    }

    const sourceInventory = await tx.inventory.findUnique({
      where: {
        villageId_commodityId: {
          villageId: t.fromVillageId,
          commodityId: t.commodityId,
        },
      },
    });

    if (!sourceInventory) {
      throw new BadRequestException('Source inventory not found');
    }

    // Emit OUT movement for sender
    await this.movementService.createMovement(
      {
        inventoryId: sourceInventory.id,
        type: MovementType.OUT,
        quantity: Number(t.quantity),
        sourceType: SourceType.TRANSACTION,
        referenceId: `${t.id}_OUT`,
        notes: `Transfer OUT to Village ${t.toVillageId}`,
      },
      tx,
    );

    // Emit IN movement for receiver
    await this.movementService.createMovement(
      {
        inventoryId: targetInventory.id,
        type: MovementType.IN,
        quantity: Number(t.quantity),
        sourceType: SourceType.TRANSACTION,
        referenceId: `${t.id}_IN`,
        notes: `Transfer IN from Village ${t.fromVillageId}`,
      },
      tx,
    );
  }
}
