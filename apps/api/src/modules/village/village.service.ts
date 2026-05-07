import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateVillageData {
  name: string;
  subdistrict: string;
  district: string;
  latitude: number;
  longitude: number;
  province?: string;
  population?: number;
  mainCommodities?: string[];
  hasColdStorage?: boolean;
  contactPhone?: string;
  regionId?: string;
}

@Injectable()
export class VillageService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVillageData) {
    return this.prisma.village.create({ data });
  }

  async findAll(query?: { search?: string; status?: string; limit?: number; page?: number }) {
    const { search, status = "active", limit = 20, page = 1 } = query ?? {};
    const skip = (page - 1) * limit;

    const where: any = { status };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { subdistrict: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.village.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.village.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const village = await this.prisma.village.findUnique({
      where: { id },
      include: { inventory: { include: { commodity: true } } },
    });
    if (!village) throw new NotFoundException(`Village ${id} not found`);
    return village;
  }

  async update(id: string, data: Partial<CreateVillageData>) {
    await this.findOne(id); // ensures it exists
    return this.prisma.village.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id); // ensures it exists
    return this.prisma.village.update({ where: { id }, data: { status: "inactive" } });
  }
}
