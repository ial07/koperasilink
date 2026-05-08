import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';

type InventoryStatus = 'surplus' | 'shortage' | 'balanced';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute inventory status based on stock vs monthly demand.
   * - Surplus: currentStock > monthlyDemand * 1.5 (stock mencukupi >1.5 bulan)
   * - Shortage: currentStock < monthlyDemand * 0.5 (stock kurang dari 0.5 bulan)
   * - Balanced: di antaranya
   * Fallback ke capacity-based logic jika monthlyDemand tidak tersedia.
   */
  getStatus(
    currentStock: number,
    capacity: number,
    minStock?: number,
    surplusThreshold?: number,
    monthlyDemand?: number,
  ): InventoryStatus {
    // Prioritaskan monthlyDemand untuk menentukan status
    if (monthlyDemand && monthlyDemand > 0) {
      if (currentStock >= monthlyDemand * 1.5) return 'surplus';
      if (currentStock <= monthlyDemand * 0.5) return 'shortage';
      return 'balanced';
    }

    // Fallback: capacity-based
    const min = (minStock && minStock > 0) ? minStock : Math.floor(capacity * 0.2);
    const surplus = (surplusThreshold && surplusThreshold > 0) ? surplusThreshold : Math.floor(capacity * 0.7);

    if (currentStock >= surplus) return 'surplus';
    if (currentStock <= min) return 'shortage';
    return 'balanced';
  }

  async findAll(user?: any, query?: QueryInventoryDto) {
    const { search, villageId, commodityId, status, limit, page } = query ?? {};
    const limitNum = Number(limit) || 50;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (user && user.role === 'bumdes_operator' && user.villageId) {
      where.villageId = user.villageId;
    } else if (villageId) {
      where.villageId = villageId;
    }

    if (commodityId) where.commodityId = commodityId;
    if (search) {
      where.OR = [
        { village: { name: { contains: search, mode: 'insensitive' } } },
        { commodity: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let raw = await this.prisma.inventory.findMany({
      where,
      include: { village: true, commodity: true },
      orderBy: { lastUpdated: 'desc' },
      skip,
      take: limitNum,
    });

    const total = await this.prisma.inventory.count({ where });

    const data = raw.map((item) => {
      const capacityNum = item.capacity ? Number(item.capacity) : 0;
      const currentNum = Number(item.currentStock);
      const computedStatus =
        capacityNum > 0
          ? this.getStatus(
              currentNum,
              capacityNum,
              item.minStock ? Number(item.minStock) : undefined,
              item.surplusThreshold ? Number(item.surplusThreshold) : undefined,
              item.monthlyDemand ? Number(item.monthlyDemand) : undefined,
            )
          : 'unknown';

      return {
        ...item,
        currentStock: Number(item.currentStock),
        capacity: item.capacity ? Number(item.capacity) : null,
        minStock: item.minStock ? Number(item.minStock) : null,
        surplusThreshold: item.surplusThreshold ? Number(item.surplusThreshold) : null,
        monthlyDemand: item.monthlyDemand ? Number(item.monthlyDemand) : null,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        computedStatus,
      };
    });

    const filtered = status ? data.filter((d) => d.computedStatus === status) : data;

    return {
      data: filtered,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findByVillage(villageId: string) {
    const items = await this.prisma.inventory.findMany({
      where: { villageId },
      include: { commodity: true, village: true },
      orderBy: { lastUpdated: 'desc' },
    });

    return items.map((item) => {
      const capacityNum = item.capacity ? Number(item.capacity) : 0;
      const currentNum = Number(item.currentStock);
      return {
        ...item,
        currentStock: currentNum,
        capacity: item.capacity ? Number(item.capacity) : null,
        monthlyDemand: item.monthlyDemand ? Number(item.monthlyDemand) : null,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        computedStatus:
          capacityNum > 0
            ? this.getStatus(
                currentNum,
                capacityNum,
                item.minStock ? Number(item.minStock) : undefined,
                item.surplusThreshold ? Number(item.surplusThreshold) : undefined,
                item.monthlyDemand ? Number(item.monthlyDemand) : undefined,
              )
            : 'unknown',
      };
    });
  }

  async getSummaryByVillage() {
    const items = await this.prisma.inventory.findMany({
      include: { commodity: true, village: true },
    });

    const grouped: Record<
      string,
      {
        villageInfo: { name: string; subdistrict: string };
        commodities: Array<{
          id: string;
          name: string;
          unit: string;
          currentStock: number;
          capacity: number | null;
          status: string;
          unitPrice: number | null;
          perishability: string;
        }>;
        totalStock: number;
        commodityCount: number;
      }
    > = {};

    for (const item of items) {
      if (!item.village || !item.commodity) continue;

      const villageId = item.villageId;
      const capacityNum = item.capacity ? Number(item.capacity) : 0;
      const currentNum = Number(item.currentStock);
      const computedStatus =
        capacityNum > 0
          ? this.getStatus(
              currentNum,
              capacityNum,
              item.minStock ? Number(item.minStock) : undefined,
              item.surplusThreshold ? Number(item.surplusThreshold) : undefined,
              item.monthlyDemand ? Number(item.monthlyDemand) : undefined,
            )
          : 'unknown';

      if (!grouped[villageId]) {
        grouped[villageId] = {
          villageInfo: {
            name: item.village.name,
            subdistrict: item.village.subdistrict,
          },
          commodities: [],
          totalStock: 0,
          commodityCount: 0,
        };
      }

      grouped[villageId].commodities.push({
        id: item.commodity.id,
        name: item.commodity.name,
        unit: item.commodity.unit,
        currentStock: currentNum,
        capacity: item.capacity ? Number(item.capacity) : null,
        status: computedStatus,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        perishability: item.commodity.perishability ?? 'medium',
      });
      grouped[villageId].totalStock += currentNum;
      grouped[villageId].commodityCount += 1;
    }

    const result: Record<string, any> = {};

    for (const [villageId, group] of Object.entries(grouped)) {
      const hasShortage = group.commodities.some((c) => c.status === 'shortage');
      const allSurplus = group.commodities.every((c) => c.status === 'surplus');

      let villageStatus: string;
      if (hasShortage) {
        villageStatus = 'shortage';
      } else if (allSurplus) {
        villageStatus = 'surplus';
      } else {
        villageStatus = 'balanced';
      }

      result[villageId] = {
        totalStock: group.totalStock,
        commodityCount: group.commodityCount,
        status: villageStatus,
        commodities: group.commodities,
      };
    }

    return result;
  }

  async findSurplusForCommodity(commodityId: string) {
    const items = await this.prisma.$queryRaw`
      SELECT i.*, v.name as village_name, v.district, v.subdistrict, v.latitude, v.longitude
      FROM inventory i
      JOIN villages v ON i.village_id = v.id
      WHERE i.commodity_id = ${commodityId}::uuid
      AND v.status = 'active'
      AND i.current_stock >= COALESCE(i.surplus_threshold, COALESCE(i.capacity, 0) * 0.7)
      AND COALESCE(i.capacity, 0) > 0
      ORDER BY i.current_stock DESC;
    `;
    return items;
  }

  async create(dto: CreateInventoryDto) {
    if (dto.capacity !== undefined && dto.currentStock > dto.capacity) {
      throw new BadRequestException('Stock cannot exceed capacity');
    }

    return this.prisma.inventory.upsert({
      where: {
        villageId_commodityId: {
          villageId: dto.villageId,
          commodityId: dto.commodityId,
        },
      },
      update: {
        currentStock: dto.currentStock,
        capacity: dto.capacity,
        monthlyDemand: dto.monthlyDemand,
        unitPrice: dto.unitPrice,
        lastUpdated: new Date(),
      },
      create: {
        villageId: dto.villageId,
        commodityId: dto.commodityId,
        currentStock: dto.currentStock,
        capacity: dto.capacity,
        monthlyDemand: dto.monthlyDemand,
        unitPrice: dto.unitPrice,
        minStock: dto.capacity ? Math.floor(dto.capacity * 0.2) : undefined,
        surplusThreshold: dto.capacity ? Math.floor(dto.capacity * 0.7) : undefined,
      },
      include: { village: true, commodity: true },
    });
  }

  async update(id: string, dto: UpdateInventoryDto) {
    const existing = await this.prisma.inventory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Inventory not found');

    const newStock = dto.currentStock ?? Number(existing.currentStock);
    const effectiveCapacity = dto.capacity ?? (existing.capacity ? Number(existing.capacity) : undefined);
    if (effectiveCapacity !== undefined && newStock > effectiveCapacity) {
      throw new BadRequestException('Stock cannot exceed capacity');
    }

    return this.prisma.inventory.update({
      where: { id },
      data: {
        ...dto,
        lastUpdated: new Date(),
      },
      include: { village: true, commodity: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.inventory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Inventory not found');
    return this.prisma.inventory.delete({ where: { id } });
  }
}
