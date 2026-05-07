import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CommodityService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    nameLocal?: string;
    category: string;
    unit: string;
    perishability: string;
    shelfLifeDays?: number;
  }) {
    return this.prisma.commodity.create({ data });
  }

  async findAll() {
    return this.prisma.commodity.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: string) {
    return this.prisma.commodity.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.commodity.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.commodity.delete({ where: { id } });
  }
}
