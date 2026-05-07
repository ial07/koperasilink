import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VillageService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; subdistrict: string; latitude: number; longitude: number }) {
    return this.prisma.village.create({ data });
  }

  async findAll() {
    return this.prisma.village.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: string) {
    return this.prisma.village.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.village.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.village.update({ where: { id }, data: { status: "inactive" } });
  }
}
