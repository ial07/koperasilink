import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { VillageModule } from "./modules/village/village.module";
import { CommodityModule } from "./modules/commodity/commodity.module";
import { PrismaService } from "./modules/prisma/prisma.service";

@Module({
  imports: [AuthModule, VillageModule, CommodityModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
