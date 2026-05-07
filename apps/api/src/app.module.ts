import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { VillageModule } from "./modules/village/village.module";
import { CommodityModule } from "./modules/commodity/commodity.module";
import { GeospatialModule } from "./modules/geospatial/geospatial.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { TransactionModule } from "./modules/transaction/transaction.module";
import { AiModule } from "./modules/ai/ai.module";
import { PrismaService } from "./modules/prisma/prisma.service";

@Module({
  imports: [AuthModule, VillageModule, CommodityModule, InventoryModule, TransactionModule, GeospatialModule, AiModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
