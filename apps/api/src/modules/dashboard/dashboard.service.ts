import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface VillageCondition {
  id: string;
  name: string;
  subdistrict: string;
  condition: 'surplus' | 'shortage' | 'balanced';
  commodities: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    capacity: number | null;
    status: 'surplus' | 'shortage' | 'normal';
  }[];
}

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  // ── KPI (cached 5 min) ──

  async getKpi() {
    const cacheKey = 'dashboard:kpi';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [villages, inventoryRows, completedTxns, recomms] = await Promise.all(
      [
        this.prisma.village.findMany(),
        this.prisma.inventory.findMany({
          include: {
            village: true,
            commodity: { include: { unitRelation: true } },
          },
        }),
        this.prisma.transaction.count({ where: { status: 'completed' } }),
        this.prisma.aiRecommendation.findMany(),
      ],
    );

    // ── Village conditions ──
    const villageMap = new Map<string, VillageCondition>();
    for (const v of villages) {
      villageMap.set(v.id, {
        id: v.id,
        name: v.name,
        subdistrict: v.subdistrict,
        condition: 'balanced',
        commodities: [],
      });
    }

    let totalStock = 0;
    const villagesWithSurplus = new Set<string>();
    const villagesWithShortage = new Set<string>();

    for (const inv of inventoryRows) {
      totalStock += Number(inv.currentStock);
      const stock = Number(inv.currentStock);
      const capacity = inv.capacity ? Number(inv.capacity) : null;
      const monthlyDemand = inv.monthlyDemand
        ? Number(inv.monthlyDemand)
        : null;
      const minStock = inv.minStock ? Number(inv.minStock) : 0;
      const surplusThreshold = inv.surplusThreshold
        ? Number(inv.surplusThreshold)
        : (capacity ?? stock * 2) * 0.7;

      let status: 'surplus' | 'shortage' | 'normal';
      if (monthlyDemand && monthlyDemand > 0) {
        // Prioritaskan monthlyDemand
        if (stock >= monthlyDemand * 1.5) {
          status = 'surplus';
          villagesWithSurplus.add(inv.villageId);
        } else if (stock <= monthlyDemand * 0.5) {
          status = 'shortage';
          villagesWithShortage.add(inv.villageId);
        } else {
          status = 'normal';
        }
      } else if (capacity && stock > surplusThreshold) {
        status = 'surplus';
        villagesWithSurplus.add(inv.villageId);
      } else if (stock < minStock) {
        status = 'shortage';
        villagesWithShortage.add(inv.villageId);
      } else {
        status = 'normal';
      }

      const vc = villageMap.get(inv.villageId);
      if (vc) {
        vc.commodities.push({
          id: inv.commodityId,
          name: inv.commodity.name,
          unit: inv.commodity.unitRelation?.symbol || '-',
          currentStock: stock,
          capacity,
          status,
        });
      }
    }

    // Determine per-village overall condition
    let surplusVillages = 0;
    let shortageVillages = 0;
    let balancedVillages = 0;

    for (const [, vc] of villageMap) {
      if (vc.commodities.length === 0) {
        vc.condition = 'balanced';
        balancedVillages++;
        continue;
      }
      const hasShortage = vc.commodities.some((c) => c.status === 'shortage');
      const allSurplus = vc.commodities.every((c) => c.status === 'surplus');
      if (hasShortage) {
        vc.condition = 'shortage';
        shortageVillages++;
      } else if (allSurplus) {
        vc.condition = 'surplus';
        surplusVillages++;
      } else {
        vc.condition = 'balanced';
        balancedVillages++;
      }
    }

    const totalRecs = recomms.length;
    const acceptedRecs = recomms.filter((r) => r.status === 'accepted').length;

    const result = {
      totalVillages: villages.length,
      activeVillages: villages.length,
      totalStock,
      completedTransactions: completedTxns,
      surplusVillages,
      shortageVillages,
      balancedVillages,
      recommendationRate:
        totalRecs > 0 ? Math.round((acceptedRecs / totalRecs) * 100) : 0,
    };

    await this.cache.set(cacheKey, result, 300_000);
    return result;
  }

  // ── Village conditions detail ──

  async getVillageConditions() {
    const villages = await this.prisma.village.findMany();
    const inventory = await this.prisma.inventory.findMany({
      include: { commodity: { include: { unitRelation: true } } },
    });

    const map = new Map<string, VillageCondition>();
    for (const v of villages) {
      map.set(v.id, {
        id: v.id,
        name: v.name,
        subdistrict: v.subdistrict,
        condition: 'balanced',
        commodities: [],
      });
    }

    for (const inv of inventory) {
      const stock = Number(inv.currentStock);
      const capacity = inv.capacity ? Number(inv.capacity) : null;
      const monthlyDemand = inv.monthlyDemand
        ? Number(inv.monthlyDemand)
        : null;
      const minStock = inv.minStock ? Number(inv.minStock) : 0;
      const surplusThreshold = inv.surplusThreshold
        ? Number(inv.surplusThreshold)
        : capacity
          ? capacity * 0.7
          : stock * 2 * 0.7;

      let status: 'surplus' | 'shortage' | 'normal';
      if (monthlyDemand && monthlyDemand > 0) {
        if (stock >= monthlyDemand * 1.5) status = 'surplus';
        else if (stock <= monthlyDemand * 0.5) status = 'shortage';
        else status = 'normal';
      } else if (capacity && stock > surplusThreshold) status = 'surplus';
      else if (stock < minStock) status = 'shortage';
      else status = 'normal';

      const vc = map.get(inv.villageId);
      if (vc) {
        vc.commodities.push({
          id: inv.commodityId,
          name: inv.commodity.name,
          unit: inv.commodity.unitRelation?.symbol || '-',
          currentStock: stock,
          capacity,
          status,
        });
      }
    }

    for (const [, vc] of map) {
      if (vc.commodities.length === 0) {
        vc.condition = 'balanced';
        continue;
      }
      const hasShortage = vc.commodities.some((c) => c.status === 'shortage');
      const allSurplus = vc.commodities.every((c) => c.status === 'surplus');
      if (hasShortage) vc.condition = 'shortage';
      else if (allSurplus) vc.condition = 'surplus';
      else vc.condition = 'balanced';
    }

    return Array.from(map.values());
  }

  // ── Recent activity ──

  async getRecentActivity() {
    const [recentTxns, recentRecomms] = await Promise.all([
      this.prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          fromVillage: { select: { name: true } },
          toVillage: { select: { name: true } },
          commodity: { select: { name: true } },
        },
      }),
      this.prisma.aiRecommendation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { transactions: recentTxns, recommendations: recentRecomms };
  }

  // ── Price trends (cached 10 min) ──

  async getPriceTrends(commodityId?: string, days = 7) {
    const cacheKey = `dashboard:prices:${commodityId || 'all'}:${days}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: Prisma.TransactionWhereInput = { createdAt: { gte: since } };
    if (commodityId) where.commodityId = commodityId;

    const [transactions, currentPrices] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        select: {
          id: true,
          commodityId: true,
          quantity: true,
          unitPrice: true,
          totalAmount: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      }),
      this.prisma.inventory.findMany({
        where: { unitPrice: { not: null } },
        select: {
          unitPrice: true,
          village: { select: { id: true, name: true } },
          commodity: { select: { id: true, name: true, unitRelation: true } },
        },
        orderBy: { lastUpdated: 'desc' },
        take: 50,
      }),
    ]);

    const result = { transactions, currentPrices };
    await this.cache.set(cacheKey, result, 600_000);
    return result;
  }
}
