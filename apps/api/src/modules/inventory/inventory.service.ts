import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; limit?: number; page?: number }) {
    const { search, limit = 50, page = 1 } = query ?? {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { village: { name: { contains: search, mode: "insensitive" } } },
        { commodity: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          village: true,
          commodity: true,
        },
        orderBy: { lastUpdated: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
