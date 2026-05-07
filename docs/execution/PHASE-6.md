# PHASE 6: Dashboard + Redis Cache

**Duration:** Week 5  
**Dependencies:** Phase 3 (Village data), Phase 4 (Inventory data)  
**Review After:** Dashboard nampilin KPI real-time, supply-demand stats, trending prices

---

## Goal

Dashboard dengan KPI cards, charts (transaction volume, price trends), Redis caching untuk performance.

## Task 6.1: Install Redis + Chart Dependencies

```bash
# Backend
cd apps/api
pnpm add @nestjs/cache-manager cache-manager cache-manager-redis-yet ioredis

# Frontend
cd apps/web
pnpm add recharts
```

## Task 6.2: Redis Module Setup (NestJS)

**File: `apps/api/src/redis/redis.module.ts`**
```typescript
import { Module, Global } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-yet";

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        url: process.env.REDIS_URL || "redis://localhost:6379",
        ttl: 300, // 5 min default
        max: 100, // max items
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
```

## Task 6.3: Dashboard API Endpoints

**File: `apps/api/src/modules/dashboard/dashboard.service.ts`**
```typescript
import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async getKpi() {
    const cacheKey = "dashboard:kpi";
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [
      activeVillages,
      inventoryStats,
      transactionCount,
      recommendationStats,
    ] = await Promise.all([
      this.prisma.village.count({ where: { status: "active" } }),
      this.prisma.inventory.aggregate({
        _sum: { currentStock: true },
      }),
      this.prisma.transaction.count({ where: { status: "completed" } }),
      this.prisma.aiRecommendation.aggregate({
        _count: true,
        _sum: { acceptedCount: true },
      }),
    ]);

    const result = {
      activeVillages,
      totalStock: inventoryStats._sum.currentStock || 0,
      completedTransactions: transactionCount,
      recommendationRate: recommendationStats._count > 0
        ? Math.round((recommendationStats._sum.acceptedCount || 0) / recommendationStats._count * 100)
        : 0,
    };

    await this.cache.set(cacheKey, result, 300_000); // 5 min
    return result;
  }

  async getPriceTrends(commodityId?: string, days = 7) {
    const cacheKey = `dashboard:prices:${commodityId || "all"}:${days}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: any = { recordedAt: { gte: since } };
    if (commodityId) where.commodityId = commodityId;

    const data = await this.prisma.pricingHistory.findMany({
      where,
      orderBy: { recordedAt: "asc" },
      take: 100,
    });

    await this.cache.set(cacheKey, data, 600_000); // 10 min
    return data;
  }
}
```

## Task 6.4: Dashboard Controller

**File: `apps/api/src/modules/dashboard/dashboard.controller.ts`**
```typescript
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpi')
  getKpi() {
    return this.dashboardService.getKpi();
  }

  @Get('trends/prices')
  getPriceTrends(
    @Query('commodityId') commodityId?: string,
    @Query('days') days?: number,
  ) {
    return this.dashboardService.getPriceTrends(commodityId, days || 7);
  }
}
```

## Task 6.5: Frontend — Dashboard Page

**File: `apps/web/app/dashboard/recommendations/page.tsx`** (move existing dashboard to proper):

**File: `apps/web/app/dashboard/page.tsx`** — upgrade from placeholder:
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Package, ArrowLeftRight, Lightbulb } from "lucide-react";

export default function DashboardPage() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ["dashboard-kpi"],
    queryFn: () => apiClient.get("/dashboard/kpi").then(r => r.data),
    refetchInterval: 60_000, // auto-refresh every minute
  });

  const kpiCards = [
    { title: "Active Villages", value: kpi?.activeVillages, icon: Building2, color: "text-blue-600" },
    { title: "Total Stock (kg)", value: kpi?.totalStock?.toLocaleString(), icon: Package, color: "text-green-600" },
    { title: "Transactions Completed", value: kpi?.completedTransactions, icon: ArrowLeftRight, color: "text-purple-600" },
    { title: "AI Recommendation Rate", value: `${kpi?.recommendationRate || 0}%`, icon: Lightbulb, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Real-time supply chain overview</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{card.value || 0}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

## Task 6.6: Add Sidebar Link to Dashboard

**File: `apps/web/components/layout/Sidebar.tsx`** — ensure `Dashboard` link points to `/dashboard` (already done in Phase 1).

## Task 6.7: Redis Cache Invalidation

Create a cache invalidation service for when data changes:
```typescript
// apps/api/src/redis/cache-invalidation.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async invalidatePattern(pattern: string) {
    // Redis-only: scan and delete matching keys
    const store = this.cache.store as any;
    if (store.keys) {
      const keys = await store.keys(pattern);
      for (const key of keys) {
        await this.cache.del(key);
      }
    }
  }
}
```

## Validation Checklist

- [ ] `GET /api/v1/dashboard/kpi` returns 4 KPI values (cached in Redis)
- [ ] `GET /api/v1/dashboard/trends/prices` returns price history
- [ ] Dashboard frontend shows 4 KPI cards with icons
- [ ] KPI data auto-refreshes every 60s
- [ ] Loading state: skeleton per card
- [ ] Empty state: "0" displayed when no data
- [ ] Redis cache works (second request faster than first)
- [ ] Cache invalidated when inventory/transaction changes

## Git Checkpoint

```bash
git add .
git commit -m "phase-6: dashboard kpi, redis caching, recharts setup"
git tag phase-6
```
