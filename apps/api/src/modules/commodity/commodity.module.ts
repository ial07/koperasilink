import { Module } from "@nestjs/common";
import { CommodityController } from "./commodity.controller";
import { CommodityService } from "./commodity.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [CommodityController],
  providers: [CommodityService, PrismaService],
  exports: [CommodityService],
})
export class CommodityModule {}
