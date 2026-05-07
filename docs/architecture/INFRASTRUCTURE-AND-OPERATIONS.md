# KoperasiLink — Infrastructure, Deployment & Operations

**Version:** 1.0 | **Date:** 2026-05-07

---

## 1. Monorepo Structure

```
koperasilink/
├── apps/
│   ├── web/                          # Next.js 14+ frontend
│   │   ├── app/                      # App Router pages
│   │   ├── components/               # UI components
│   │   ├── hooks/                    # React hooks
│   │   ├── lib/                      # Utilities
│   │   ├── stores/                   # Zustand stores
│   │   ├── public/                   # Static assets
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # NestJS backend
│       ├── src/
│       │   ├── modules/              # Domain modules
│       │   ├── common/               # Shared decorators, guards, pipes
│       │   ├── config/               # App configuration
│       │   ├── queue/                # BullMQ processors
│       │   └── prisma/               # Prisma service
│       ├── test/
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── services/
│   └── ai/                           # Python FastAPI AI service
│       ├── app/
│       │   ├── api/                  # API routes
│       │   ├── engine/               # Rule engine
│       │   ├── ml/                   # ML pipeline (Phase 2+)
│       │   ├── data/                 # Data access
│       │   └── utils/                # Utilities
│       ├── models/                   # Serialized models
│       ├── tests/
│       ├── Dockerfile
│       ├── pyproject.toml
│       └── requirements.txt
│
├── packages/
│   ├── shared-types/                 # Shared TypeScript interfaces
│   │   ├── src/
│   │   │   ├── village.ts
│   │   │   ├── inventory.ts
│   │   │   ├── transaction.ts
│   │   │   ├── recommendation.ts
│   │   │   ├── user.ts
│   │   │   ├── api-response.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── database/                     # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api-client/                   # Generated API client SDK
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── endpoints/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── validation/                   # Shared Zod schemas
│   │   ├── src/
│   │   │   ├── inventory.schema.ts
│   │   │   ├── transaction.schema.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                       # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── prettier/
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml        # Local dev
│   │   ├── docker-compose.prod.yml   # Production
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.ai
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   ├── scripts/
│   │   ├── setup.sh                  # First-time setup
│   │   ├── deploy.sh                 # Deployment script
│   │   ├── backup.sh                 # Database backup
│   │   └── restore.sh               # Database restore
│   └── k8s/                          # Kubernetes (Phase 8)
│       └── .gitkeep
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── ai/
│   ├── database/
│   ├── runbooks/
│   ├── deployment/
│   ├── security/
│   └── sprints/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── turbo.json                        # Turborepo config
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace config
├── .env.example
├── .gitignore
└── README.md
```

---

## 2. Deployment Evolution

### Stage 1: Single VPS MVP

```
┌─────────────────────────────────────────────────┐
│  DigitalOcean Droplet (4 vCPU, 8GB RAM)          │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Docker Compose                              │ │
│  │                                               │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐           │ │
│  │  │ Next.js│ │ NestJS │ │FastAPI │           │ │
│  │  │ :3000  │ │ :4000  │ │ :8000  │           │ │
│  │  └───┬────┘ └───┬────┘ └───┬────┘           │ │
│  │      │          │          │                  │ │
│  │  ┌───▼──────────▼──────────▼───┐             │ │
│  │  │     Nginx (:80, :443)       │  ← SSL     │ │
│  │  └─────────────────────────────┘  (Certbot) │ │
│  │                                               │ │
│  │  ┌──────────────┐ ┌──────────┐               │ │
│  │  │ PostgreSQL   │ │  Redis   │               │ │
│  │  │ + PostGIS    │ │  :6379   │               │ │
│  │  │ :5432        │ │          │               │ │
│  │  └──────────────┘ └──────────┘               │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Spec: 4 vCPU, 8GB RAM, 160GB SSD
Cost: ~$48/mo
Capacity: 50 villages, 200 users
```

### Stage 2: Dockerized Staging + Production Split

```
┌──────────────────┐     ┌──────────────────┐
│  Staging VPS      │     │  Production VPS   │
│  (2 vCPU, 4GB)    │     │  (4 vCPU, 8GB)    │
│                    │     │                    │
│  Same compose      │     │  Same compose      │
│  but separate DB   │     │  with backups      │
│  & test data       │     │  & monitoring      │
└──────────────────┘     └──────────────────┘
Cost: ~$72/mo total
```

### Stage 3: Scalable Production

```
┌──────────────────────────────────────────────────┐
│  Load Balancer (DigitalOcean LB or Nginx)         │
│                                                    │
│  ┌───────────┐  ┌───────────┐                     │
│  │  App VPS 1│  │  App VPS 2│    ← API + Web     │
│  │  (API+Web)│  │  (API+Web)│                     │
│  └─────┬─────┘  └─────┬─────┘                     │
│        │               │                           │
│  ┌─────▼───────────────▼─────┐                     │
│  │  DB VPS (dedicated)        │    ← PostgreSQL   │
│  │  + PgBouncer               │    + Redis        │
│  └────────────────────────────┘                    │
│                                                    │
│  ┌────────────────────────────┐                    │
│  │  AI VPS (dedicated)         │    ← FastAPI     │
│  │  (can scale independently)  │    + ML models   │
│  └────────────────────────────┘                    │
└──────────────────────────────────────────────────┘
```

### Stage 4: Multi-Service Orchestration (K3s/K8s)

```
┌──────────────────────────────────────────────────┐
│  Kubernetes Cluster                                │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ Ingress  │  │ Web Pods │  │ API Pods         ││
│  │ (Nginx)  │  │ (HPA)    │  │ (HPA)            ││
│  └──────────┘  └──────────┘  └──────────────────┘│
│                                                    │
│  ┌──────────────┐  ┌────────────────────────────┐│
│  │ AI Pods      │  │ Managed DB (DO Managed PG) ││
│  │ (HPA + GPU)  │  │ + Redis Cluster            ││
│  └──────────────┘  └────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## 3. Nginx Configuration

```nginx
# /infra/nginx/nginx.conf
upstream web {
    server web:3000;
}
upstream api {
    server api:4000;
}
upstream ai {
    server ai:8000;
}

server {
    listen 80;
    server_name koperasilink.id www.koperasilink.id;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name koperasilink.id;

    ssl_certificate /etc/letsencrypt/live/koperasilink.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/koperasilink.id/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # API routes
    location /api/ {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-ID $request_id;
        client_max_body_size 10M;
    }

    # AI service (internal, proxied through API)
    location /ai-internal/ {
        internal;
        proxy_pass http://ai/;
    }

    # WebSocket
    location /ws {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend
    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
    }

    # Static assets cache
    location /_next/static/ {
        proxy_pass http://web;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 4. CI/CD Pipeline

### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint
      - run: pnpm turbo type-check

  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: koperasilink_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @koperasilink/database db:push
      - run: pnpm --filter @koperasilink/api test

  test-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r services/ai/requirements.txt
      - run: cd services/ai && pytest

  build:
    needs: [lint-and-typecheck, test-api, test-ai]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build
```

### Deploy Staging

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/koperasilink
            git pull origin develop
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --build
            docker compose exec api pnpm --filter @koperasilink/database db:push
```

---

## 5. Environment Strategy

| Environment | Purpose | Branch | URL | DB |
|------------|---------|--------|-----|-----|
| **local** | Development | any | localhost:3000 | Docker PostgreSQL |
| **staging** | Integration testing, UAT | `develop` | staging.koperasilink.id | Staging DB (seeded) |
| **production** | Live users | `main` | koperasilink.id | Production DB |

### Environment Variables

```bash
# .env.example

# ── Database ──
DATABASE_URL=postgresql://user:pass@localhost:5432/koperasilink
REDIS_URL=redis://localhost:6379

# ── Auth ──
JWT_SECRET=change-me
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
OTP_EXPIRY_MINUTES=5

# ── AI Service ──
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT_MS=5000

# ── External APIs ──
OSRM_URL=http://router.project-osrm.org
BMKG_API_KEY=

# ── App ──
NODE_ENV=development
APP_PORT=4000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# ── Monitoring ──
SENTRY_DSN=
LOG_LEVEL=debug
```

---

## 6. Backup & Disaster Recovery

### Backup Strategy

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| **Full DB backup** | Daily 02:00 WIB | 30 days | DigitalOcean Spaces |
| **WAL archiving** | Continuous | 7 days | Local + remote |
| **Config backup** | On change | All versions | Git |
| **Model artifacts** | On training | All versions | Object storage |

### Backup Script

```bash
#!/bin/bash
# infra/scripts/backup.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="s3://koperasilink-backups"

# PostgreSQL dump
docker compose exec -T postgres pg_dump -Fc -U koperasilink koperasilink \
  > "$BACKUP_DIR/db_${TIMESTAMP}.dump"

# Upload to object storage
s3cmd put "$BACKUP_DIR/db_${TIMESTAMP}.dump" "$S3_BUCKET/db/"

# Cleanup local (keep 7 days)
find "$BACKUP_DIR" -name "db_*.dump" -mtime +7 -delete

echo "Backup completed: db_${TIMESTAMP}.dump"
```

### Disaster Recovery Plan

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| VPS failure | 2 hours | 24 hours | Provision new VPS, restore from backup |
| DB corruption | 1 hour | 1 hour | Restore from WAL archive |
| Service crash | 5 min | 0 | Docker auto-restart |
| Full data loss | 4 hours | 24 hours | Provision + restore + verify |

---

## 7. Observability & Monitoring

### Monitoring Stack

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│  App Metrics │───▶│  Prometheus  │───▶│  Grafana       │
│  (custom)    │    │  (scrape)    │    │  (dashboards)  │
└─────────────┘    └──────────────┘    └────────────────┘

┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│  App Logs    │───▶│  Loki        │───▶│  Grafana       │
│  (JSON)      │    │  (aggregate) │    │  (log search)  │
└─────────────┘    └──────────────┘    └────────────────┘

┌─────────────┐    ┌──────────────┐
│  Errors      │───▶│  Sentry      │
│  (exceptions)│    │  (alerting)  │
└─────────────┘    └──────────────┘

┌─────────────┐    ┌──────────────┐
│  Uptime      │───▶│ UptimeRobot  │
│  (health)    │    │  (paging)    │
└─────────────┘    └──────────────┘
```

### Key Dashboards

| Dashboard | Metrics |
|-----------|---------|
| **System Health** | CPU, memory, disk, network per container |
| **API Performance** | Request rate, latency p50/p95/p99, error rate, by endpoint |
| **Business KPIs** | Active villages, transactions/day, AI acceptance rate |
| **AI Service** | Inference latency, recommendation count, rule engine execution time |
| **Database** | Connection pool usage, query latency, cache hit rate |

### Alerting Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| API down | Health check fails 3x | Critical | Telegram + Email |
| API latency | p95 > 1s for 5 min | Warning | Telegram |
| Error rate | > 5% for 5 min | Critical | Telegram + Email |
| DB connections | > 80% pool used | Warning | Telegram |
| Disk space | > 85% used | Warning | Email |
| AI service down | Health check fails 3x | High | Telegram |

---

## 8. Security Foundation

### Authentication
- JWT access tokens (24h expiry) + refresh tokens (7d expiry)
- OTP via SMS/WhatsApp for rural users (5 min expiry)
- bcrypt password hashing (cost factor 12)
- Rate limit: 5 OTP requests per phone per hour

### Authorization
- RBAC via NestJS guards + `@Roles()` decorator
- Permission check at controller level (guard) and service level (validation)
- Village-scoped access: users can only modify their own village data

### API Security
- HTTPS everywhere (Let's Encrypt auto-renewal)
- CORS restricted to known origins
- Rate limiting: 100 req/min per user, 20 req/min for auth endpoints
- Request validation: class-validator DTOs (NestJS), Pydantic models (FastAPI)
- SQL injection: Prisma parameterized queries, raw SQL with `$queryRaw`
- XSS: React auto-escaping, CSP headers
- CSRF: SameSite cookies + token validation

### Secrets Management
- `.env` files (not committed to git)
- Docker secrets for production
- GitHub Actions secrets for CI/CD
- Key rotation schedule: JWT secret every 90 days

---

## 9. Development Workflow

### Git Strategy

```
main ─────────────────────────────────────────────────▶ production
  │                                                    ▲
  └── develop ──────────────────────────────────────── │ ── merge
        │          │          │          │              │
        └── feat/  └── feat/  └── fix/   └── feat/     │
            auth       map       stock       ai-rules   │
            │          │          │          │           │
            └──────────┴──────────┴──────────┘           │
                    merge to develop via PR              │
                                                        │
                    Release branch ─────────────────────┘
                    release/v1.0.0
```

| Branch | Purpose | Merges To | CI |
|--------|---------|-----------|-----|
| `main` | Production release | — | Build + Deploy Prod |
| `develop` | Integration | `main` (via release) | Build + Deploy Staging |
| `feat/*` | Feature work | `develop` (PR) | Lint + Test |
| `fix/*` | Bug fixes | `develop` (PR) | Lint + Test |
| `release/*` | Release prep | `main` + `develop` | Full pipeline |

### PR Requirements
- [ ] Passing CI (lint, type-check, test, build)
- [ ] At least 1 approval
- [ ] No unresolved conversations
- [ ] Updated documentation if API changes
- [ ] Migration tested locally

### Sprint Planning

| Sprint | Duration | Ceremony |
|--------|----------|----------|
| Sprint length | 2 weeks | Monday → Friday (2nd week) |
| Planning | 2 hours | Monday (Week 1) |
| Daily standup | 15 min | Daily |
| Review | 1 hour | Friday (Week 2) |
| Retro | 30 min | Friday (Week 2) |

---

## 10. API Standardization

### Response Format

```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  path: string;
  requestId: string;
}
```

### Pagination

```
GET /api/v1/villages?page=1&limit=20&sort=name&order=asc
GET /api/v1/inventory?village_id=xxx&commodity_id=yyy
```

### Versioning
- URL path versioning: `/api/v1/`, `/api/v2/`
- Major version in URL, minor in response header

### Naming Conventions
- Endpoints: kebab-case (`/api/v1/ai-recommendations`)
- Query params: snake_case (`village_id`, `page_size`)
- JSON body: camelCase (`villageId`, `currentStock`)
- Database columns: snake_case (`village_id`, `current_stock`)

---

## 11. Suggested Team Structure (MVP)

| Role | Count | Responsibility |
|------|-------|---------------|
| **Tech Lead / Fullstack** | 1 | Architecture, code review, backend + frontend |
| **Backend Engineer** | 1 | NestJS API, database, queue, integrations |
| **Frontend Engineer** | 1 | Next.js, Leaflet maps, dashboard |
| **AI Engineer** | 1 | FastAPI, rule engine, ML pipeline (Phase 2) |
| **DevOps / Part-time** | 0.5 | Docker, CI/CD, monitoring, deployment |
| **Total** | 4.5 | — |

---

## 12. Documentation Structure

```
docs/
├── architecture/
│   ├── SYSTEM-ARCHITECTURE.md        # Component architecture
│   ├── ENGINEERING-PHASES.md         # Phase planning
│   └── ADR/                          # Architecture Decision Records
│       ├── 001-monorepo-choice.md
│       ├── 002-ai-isolation.md
│       └── 003-postgis-usage.md
├── api/
│   ├── API-REFERENCE.md              # Endpoint documentation
│   ├── AUTHENTICATION.md             # Auth flow docs
│   └── openapi.yaml                  # OpenAPI 3.0 spec
├── ai/
│   ├── AI-ARCHITECTURE.md            # AI strategy
│   ├── RULE-ENGINE.md                # Rule engine documentation
│   └── ML-PIPELINE.md               # ML pipeline docs (Phase 2)
├── database/
│   ├── DATABASE-ARCHITECTURE.md      # Schema design
│   ├── MIGRATION-GUIDE.md           # Migration procedures
│   └── SEED-DATA.md                 # Seed data documentation
├── runbooks/
│   ├── DEPLOYMENT.md                 # Deployment procedures
│   ├── INCIDENT-RESPONSE.md         # Incident handling
│   ├── BACKUP-RESTORE.md            # Backup procedures
│   └── SCALING.md                   # Scaling procedures
├── deployment/
│   ├── LOCAL-SETUP.md               # Developer onboarding
│   ├── STAGING.md                   # Staging environment
│   └── PRODUCTION.md               # Production environment
├── security/
│   ├── SECURITY-POLICY.md           # Security practices
│   └── RBAC-MATRIX.md              # Access control matrix
└── sprints/
    ├── sprint-001.md                # Sprint 1 planning
    └── sprint-template.md           # Sprint template
```
