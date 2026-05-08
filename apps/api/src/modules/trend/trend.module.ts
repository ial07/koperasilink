import { Module } from "@nestjs/common";
import { TrendController } from "./trend.controller";
import { TrendAnalysisService } from "./trend-analysis.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [TrendController],
  providers: [TrendAnalysisService, PrismaService],
  exports: [TrendAnalysisService],
})
export class TrendModule {}
