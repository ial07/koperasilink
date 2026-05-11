import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async generateRecommendations(maxResults: number = 10, radiusKm: number = 50.0) {
    try {
      // Call Python FastAPI service
      const internalToken = process.env.AI_SERVICE_TOKEN || 'super-secret-internal-token-123';
      const response = await axios.get(`http://localhost:8000/api/v1/recommendations/generate`, {
        params: { max_results: maxResults, radius_km: radiusKm },
        headers: {
          'x-internal-token': internalToken
        }
      });

      const data = response.data;

      // Persist recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        for (const rec of data.recommendations) {
          // Idempotent upsert based on source, target, commodity, and status='pending'
          const existing = await this.prisma.aiRecommendation.findFirst({
            where: {
              sourceVillageId: rec.from_village_id,
              targetVillageId: rec.to_village_id,
              commodityId: rec.commodity_id,
              status: 'pending'
            }
          });

          if (!existing) {
            await this.prisma.aiRecommendation.create({
              data: {
                sourceVillageId: rec.from_village_id,
                targetVillageId: rec.to_village_id,
                commodityId: rec.commodity_id,
                recommendedQuantity: rec.match_qty,
                estimatedProfit: rec.estimated_profit,
                estimatedShippingCost: rec.estimated_shipping_cost,
                priorityScore: rec.priority_score,
                distanceKm: rec.distance_km,
                sourcePrice: rec.unit_price,
                status: 'pending',
                triggeredBy: 'manual_api',
                explanation: rec.explanation
              }
            });
          }
        }
      }

      return data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to generate AI recommendations',
        error.response?.status || 500,
      );
    }
  }

  async getPendingRecommendations(user?: any) {
    const whereClause: any = { status: 'pending' };

    if (user && user.role === 'bumdes_operator' && user.villageId) {
      whereClause.OR = [
        { sourceVillageId: user.villageId },
        { targetVillageId: user.villageId },
      ];
    }

    return this.prisma.aiRecommendation.findMany({
      where: whereClause,
      include: {
        commodity: { include: { unitRelation: true } },
        sourceVillage: true,
        targetVillage: true,
      },
      orderBy: { priorityScore: 'desc' }
    });
  }

  async acceptRecommendation(id: string) {
    const rec = await this.prisma.aiRecommendation.findUnique({ where: { id } });
    if (!rec) throw new HttpException('Recommendation not found', 404);

    await this.prisma.aiRecommendation.update({
      where: { id },
      data: { status: 'accepted' }
    });

    // Create a transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        fromVillageId: rec.sourceVillageId,
        toVillageId: rec.targetVillageId,
        commodityId: rec.commodityId,
        quantity: rec.recommendedQuantity,
        unitPrice: rec.sourcePrice || 0,
        totalAmount: Number(rec.recommendedQuantity) * Number(rec.sourcePrice || 0),
        shippingCost: rec.estimatedShippingCost || 0,
        status: 'pending',
        aiRecommended: true,
        notes: 'Generated from AI Recommendation'
      }
    });

    return { success: true, transaction };
  }

  async rejectRecommendation(id: string, reason?: string) {
    await this.prisma.aiRecommendation.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason || null }
    });
    return { success: true };
  }
}
