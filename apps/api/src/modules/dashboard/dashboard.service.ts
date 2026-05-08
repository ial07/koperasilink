import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async getKpi() {
    const cacheKey = "dashboard:kpi";
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [activeVillages, inventoryStats, transactionCount, recommendations] =
      await Promise.all([
        this.prisma.village.count({ where: { status: "active" } }),
        this.prisma.inventory.aggregate({
          _sum: { currentStock: true },
        }),
        this.prisma.transaction.count({ where: { status: "completed" } }),
        this.prisma.aiRecommendation.findMany(),
      ]);

    const totalRecs = recommendations.length;
    const acceptedRecs = recommendations.filter((r) => r.status === "accepted").length;

    const result = {
      activeVillages,
      totalStock: inventoryStats._sum.currentStock || 0,
      completedTransactions: transactionCount,
      recommendationRate: totalRecs > 0 ? Math.round((acceptedRecs / totalRecs) * 100) : 0,
    };

    await this.cache.set(cacheKey, result, 300_000);
    return result;
  }

  async getPriceTrends(commodityId?: string, days = 7) {
    const cacheKey = `dashboard:prices:${commodityId || "all"}:${days}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: any = { createdAt: { gte: since } };
    if (commodityId) where.commodityId = commodityId;

    const data = await this.prisma.transaction.findMany({
      where,
      select: {
        id: true,
        commodityId: true,
        quantity: true,
        unitPrice: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    await this.cache.set(cacheKey, data, 600_000);
    return data;
  }
}
