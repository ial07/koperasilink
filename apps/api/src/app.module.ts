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
import { RecommendationModule } from "./modules/recommendation/recommendation.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { HealthModule } from "./modules/health/health.module";
import { RedisModule } from "./redis/redis.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    PrismaModule, 
    RedisModule, 
    AuthModule, 
    VillageModule, 
    CommodityModule, 
    InventoryModule, 
    TransactionModule, 
    GeospatialModule, 
    AiModule, 
    RecommendationModule,
    DashboardModule,
    HealthModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}
