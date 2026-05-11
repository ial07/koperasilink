import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommodityService {
  constructor(private prisma: PrismaService) {}

  normalizeCommodityName(name: string): string {
    return name.trim().toLowerCase();
  }

  async getUoms() {
    return this.prisma.unitOfMeasure.findMany({
      where: { isActive: true },
      orderBy: { symbol: 'asc' }
    });
  }

  async create(data: {
    name: string;
    nameLocal?: string;
    category: string;
    unitId: string;
    perishability: string;
    shelfLifeDays?: number;
  }) {
    const normalizedName = this.normalizeCommodityName(data.name);

    // Prevent duplicates
    const existing = await this.prisma.commodity.findUnique({
      where: { name: normalizedName },
    });

    if (existing) {
      throw new ConflictException(`Komoditas dengan nama "${normalizedName}" sudah ada.`);
    }

    return this.prisma.commodity.create({ 
      data: {
        ...data,
        name: normalizedName,
      } 
    });
  }

  async findAll(activeOnly: boolean = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.commodity.findMany({ 
      where,
      include: { unitRelation: true },
      orderBy: { name: "asc" } 
    });
  }

  async findOne(id: string) {
    const commodity = await this.prisma.commodity.findUnique({ where: { id } });
    if (!commodity) throw new NotFoundException('Commodity not found');
    return commodity;
  }

  async update(id: string, data: any) {
    // If name is being updated, normalize it and check for conflicts
    if (data.name) {
      const normalizedName = this.normalizeCommodityName(data.name);
      const existing = await this.prisma.commodity.findUnique({
        where: { name: normalizedName },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Komoditas dengan nama "${normalizedName}" sudah ada.`);
      }
      data.name = normalizedName;
    }

    return this.prisma.commodity.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    return this.prisma.commodity.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async remove(id: string) {
    // We shouldn't physically delete to preserve foreign keys. Let's just use deactivate.
    return this.deactivate(id);
  }
}
