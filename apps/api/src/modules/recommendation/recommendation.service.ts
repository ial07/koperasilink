import { Injectable, HttpException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RecommendationService {
  private aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

  constructor(private prisma: PrismaService) {}

  async generate() {
    // Call AI service
    const response = await fetch(
      `${this.aiServiceUrl}/api/v1/recommendations/generate?limit=20`,
    );
    if (!response.ok) {
      throw new HttpException(
        `AI service error: ${response.statusText}`,
        response.status,
      );
    }
    const body = await response.json();
    const recs = body.data || [];

    if (recs.length === 0) return [];

    // Save recommendations to DB
    const saved: any[] = [];
    for (const rec of recs) {
      const created = await this.prisma.aiRecommendation.create({
        data: {
          sourceVillageId: rec.source_village_id,
          targetVillageId: rec.target_village_id,
          commodityId: rec.commodity_id,
          recommendedQuantity: rec.matched_quantity,
          distanceKm: rec.distance_km,
          estimatedProfit: rec.estimated_profit,
          priorityScore: rec.priority_score ?? 0,
          status: "pending",
          triggeredBy: "ai_engine",
        },
      });
      saved.push(created);
    }

    return saved;
  }

  async findAll(filters: { status?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (filters.status && filters.status !== "all") where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.aiRecommendation.findMany({
        where,
        include: {
          sourceVillage: { select: { id: true, name: true } },
          targetVillage: { select: { id: true, name: true } },
          commodity: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { priorityScore: "desc" },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
      }),
      this.prisma.aiRecommendation.count({ where }),
    ]);

    return {
      data,
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.aiRecommendation.update({
      where: { id },
      data: { status },
    });
  }
}
