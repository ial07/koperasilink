import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

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
          commodity: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
