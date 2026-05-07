# PHASE 10: Analytics, UAT & MVP Launch

**Duration:** Weeks 9–12  
**Dependencies:** Phase 9 (Transaction data rolling)  
**Review After:** Analytics dashboard, UAT passed, deployed to VPS, docs ready

---

## Goal

Analytics dashboard, UAT with cooperatives, production deployment, runbooks.

## Task 10.1: Analytics API

**File: `apps/api/src/modules/analytics/analytics.service.ts`**
```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getKpi() {
    const [
      activeVillages,
      inventoryStats,
      transactions,
      recStats,
    ] = await Promise.all([
      this.prisma.village.count({ where: { status: "active" } }),
      this.prisma.inventory.aggregate({
        _sum: { currentStock: true },
        _count: true,
      }),
      this.prisma.transaction.groupBy({
        by: ["status"],
        _count: true,
      }),
      this.prisma.aiRecommendation.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const totalTransactions = transactions.reduce((sum, t) => sum + t._count, 0);
    const completedTransactions = transactions.find(t => t.status === "completed")?._count || 0;
    const totalRecs = recStats.reduce((sum, r) => sum + r._count, 0);
    const acceptedRecs = recStats.find(r => r.status === "converted")?._count || 0;

    return {
      activeVillages,
      totalStock: inventoryStats._sum.currentStock || 0,
      totalTransactions,
      completedTransactions,
      completionRate: totalTransactions > 0 ? Math.round(completedTransactions / totalTransactions * 100) : 0,
      aiRecommendationRate: totalRecs > 0 ? Math.round(acceptedRecs / totalRecs * 100) : 0,
    };
  }

  async getVolumeTrend(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const daily: Record<string, number> = {};
    for (const t of transactions) {
      const day = t.createdAt.toISOString().split("T")[0];
      daily[day] = (daily[day] || 0) + t.quantity;
    }

    return Object.entries(daily).map(([date, volume]) => ({ date, volume }));
  }

  async getTopCommodities(limit = 5) {
    const result = await this.prisma.transaction.groupBy({
      by: ["commodityId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const commodities = await this.prisma.commodity.findMany({
      where: { id: { in: result.map(r => r.commodityId) } },
    });
    const commodityMap = new Map(commodities.map(c => [c.id, c.name]));

    return result.map(r => ({
      commodityId: r.commodityId,
      commodityName: commodityMap.get(r.commodityId) || "Unknown",
      totalVolume: r._sum.quantity || 0,
    }));
  }
}
```

**Endpoints:**
```
GET /api/v1/analytics/kpi              → Key metrics
GET /api/v1/analytics/trends/volume?days=30  → Daily volume trend
GET /api/v1/analytics/top-commodities?limit=5 → Top traded
```

## Task 10.2: Health Check Endpoints

**File: `apps/api/src/modules/health/health.controller.ts`**
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  @Get()
  async check() {
    const checks = {
      api: "ok",
      database: "unknown",
      redis: "unknown",
      timestamp: new Date().toISOString(),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }

    try {
      await this.cache.set("health:test", "ok", 10);
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }

    return checks;
  }
}
```

## Task 10.3: Deploy Script

**File: `infra/scripts/deploy.sh`**
```bash
#!/bin/bash
set -e

echo "🚀 Deploying KoperasiLink..."
cd /opt/koperasilink

# Pull latest
git pull origin main

# Build & restart
docker compose -f infra/docker/docker-compose.prod.yml build
docker compose -f infra/docker/docker-compose.prod.yml down
docker compose -f infra/docker/docker-compose.prod.yml up -d

# Wait for services
sleep 5

# Run migrations
docker compose exec -T api npx prisma db push

# Health check
curl -f http://localhost:4000/api/v1/health || echo "⚠️ API health check failed"

echo "✅ Deployment complete"
```

## Task 10.4: Backup Script

**File: `infra/scripts/backup.sh`**
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/koperasilink"
DB_NAME="koperasilink"
DB_USER="koperasi"

mkdir -p $BACKUP_DIR

# Database dump
docker compose exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup: db_$TIMESTAMP.sql.gz (size: $(du -h $BACKUP_DIR/db_$TIMESTAMP.sql.gz | cut -f1))"
```

**Cron (daily 03:00 WIB):**
```cron
0 3 * * * /opt/koperasilink/infra/scripts/backup.sh >> /var/log/koperasilink-backup.log 2>&1
```

## Task 10.5: Production Docker Compose

**File: `infra/docker/docker-compose.prod.yml`**
```yaml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - certbot-www:/var/www/certbot
    depends_on: [web, api]
    networks: [koperasilink]

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-www:/var/www/certbot
      - ./nginx/ssl:/etc/letsencrypt

  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: koperasilink
      POSTGRES_USER: koperasi
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks: [koperasilink]

  redis:
    image: redis:7-alpine
    networks: [koperasilink]

  api:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.api
    environment:
      DATABASE_URL: postgresql://koperasi:${DB_PASSWORD}@postgres:5432/koperasilink
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      AI_SERVICE_URL: http://ai:8000
    depends_on: [postgres, redis]
    networks: [koperasilink]

  ai:
    build: ../../services/ai
    environment:
      DATABASE_URL: postgresql+asyncpg://koperasi:${DB_PASSWORD}@postgres:5432/koperasilink
      REDIS_URL: redis://redis:6379
    depends_on: [postgres]
    networks: [koperasilink]

  web:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.web
    environment:
      NEXT_PUBLIC_API_URL: https://koperasilink.id/api/v1
    depends_on: [api]
    networks: [koperasilink]

volumes:
  pgdata:
  certbot-www:

networks:
  koperasilink:
```

## Task 10.6: UAT Checklist

Sebelum launch, jalankan UAT dengan 3 cooperatives:

**UAT Flow per user:**
```
1. User receives login credentials (phone + password)
2. User logs in → see dashboard with empty KPI cards
3. User navigates to Inventory → input stock for their village (3+ commodities)
4. User navigates to Map → see their village marker with status
5. User navigates to Recommendations → click "Generate"
6. AI returns matches → User accepts one recommendation
7. Transaction created → User clicks "Confirm" → "Mark In Transit" → "Complete"
8. User checks Inventory → stock decreased
9. User checks Analytics → see updated charts
```

**UAT Feedback:**
- Was stock input easy? (1-5)
- Did AI recommendation make sense? (Y/N)
- Was the dashboard useful? (1-5)
- Any bugs or confusing parts?
- What feature is most needed?

## Task 10.7: Final Launch Checklist

- [ ] UAT completed with 3+ cooperatives
- [ ] All blocker bugs fixed
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] HTTPS enforced (HTTP → 301 redirect)
- [ ] Database backup running (daily cron)
- [ ] Backup restore tested (working)
- [ ] Health checks passing: `/api/v1/health`
- [ ] Docker Compose production config tested
- [ ] `.env.production` configured with real secrets
- [ ] Sentry error tracking active
- [ ] Analytics dashboard shows correct data
- [ ] Dashboard loads < 3s
- [ ] Mobile responsive (360px+ viewport)
- [ ] All loading/empty/error states handled
- [ ] Postman/curl collection for API reference

## Git Checkpoint

```bash
git add .
git commit -m "phase-10: analytics, uat, deployment, backup, final launch"
git tag phase-10
git tag mvp-v1.0.0
```
