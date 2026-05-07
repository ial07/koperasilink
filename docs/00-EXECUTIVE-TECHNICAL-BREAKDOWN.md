# KoperasiLink — Executive Technical Breakdown

**Version:** 1.0  
**Date:** 2026-05-07  
**Classification:** Internal Engineering — CTO Planning Document  
**Status:** Approved for Execution

---

## 1. Product Classification

| Attribute | Value |
|-----------|-------|
| **Product Type** | B2B2G SaaS + AI Platform |
| **Domain** | Agricultural Supply Chain Intelligence |
| **Primary Vertical** | Cooperative Commerce & Distribution |
| **AI Classification** | Rule-Based → Supervised ML → RL Pipeline |
| **Deployment Model** | Self-hosted VPS → Container Orchestration |
| **Data Sensitivity** | Medium (PII + Agricultural Economic Data) |
| **Regulatory Context** | UU No. 25/1992 (Cooperatives), Indonesian data sovereignty |

---

## 2. System Boundary Definition

```
┌─────────────────────────────────────────────────────────────┐
│                    KOPERASILINK PLATFORM                      │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Frontend    │  │  Backend API │  │  AI Service        │  │
│  │  (Next.js)   │  │  (NestJS)    │  │  (Python FastAPI)  │  │
│  │              │  │              │  │                    │  │
│  │  • Dashboard │  │  • Auth      │  │  • Rule Engine     │  │
│  │  • Map View  │  │  • CRUD      │  │  • ML Pipeline     │  │
│  │  • Forms     │  │  • Queue     │  │  • Forecast        │  │
│  │  • Analytics │  │  • Events    │  │  • Pricing         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────────────┘  │
│         │                 │                  │                 │
│  ┌──────▼─────────────────▼──────────────────▼─────────────┐  │
│  │              DATA LAYER                                  │  │
│  │  PostgreSQL + PostGIS  │  Redis  │  Object Storage       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              INFRASTRUCTURE                               │  │
│  │  Docker │ Nginx │ GitHub Actions │ Monitoring │ Logging   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Decision Register

### 3.1 Architecture Decisions

| Decision | Choice | Rationale | Alternatives Rejected |
|----------|--------|-----------|----------------------|
| **Frontend Framework** | Next.js 14+ (App Router) | SSR for SEO, RSC for performance, ecosystem maturity | Remix (smaller ecosystem), Nuxt (Vue, less team fit) |
| **Backend Framework** | NestJS | TypeScript alignment, modular DI, enterprise patterns | Express (no structure), Fastify (smaller ecosystem) |
| **AI Service Runtime** | Python FastAPI | ML ecosystem (sklearn, xgboost, prophet), async perf | Flask (sync), Django REST (heavyweight) |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Geospatial native, JSONB, mature, proven | MongoDB (no ACID for transactions), CockroachDB (overhead) |
| **ORM** | Prisma | Type-safe queries, migration management, introspection | TypeORM (unstable typing), Drizzle (less mature) |
| **Cache/Queue** | Redis + BullMQ | Session cache, supply snapshots, reliable job queue | RabbitMQ (operational overhead), SQS (vendor lock-in) |
| **Maps** | Leaflet + OpenStreetMap | Free, offline-capable tiles, good Indonesia coverage | Mapbox (cost), Google Maps (cost + vendor lock) |
| **Deployment** | Docker Compose → K8s | MVP simplicity, production scalability path | Serverless (cold starts, cost unpredictability) |

### 3.2 Language Strategy

| Layer | Language | Justification |
|-------|----------|---------------|
| Frontend | TypeScript 5.x | Type safety, shared contracts |
| Backend API | TypeScript 5.x | Same ecosystem, shared types |
| AI Service | Python 3.11+ | ML library ecosystem, scientific computing |
| Infrastructure | YAML + Bash | Docker/CI configuration |
| Database | SQL + PL/pgSQL | Stored procedures for geospatial |

### 3.3 Communication Protocol Strategy

| Path | Protocol | Format |
|------|----------|--------|
| Frontend ↔ Backend | HTTPS REST | JSON |
| Frontend ↔ Backend (real-time) | WebSocket | JSON |
| Backend ↔ AI Service | HTTP REST (internal) | JSON |
| Backend ↔ AI Service (future) | gRPC | Protobuf |
| Backend ↔ Redis | Redis Protocol | Binary |
| Backend ↔ PostgreSQL | PostgreSQL Wire Protocol | Binary |

---

## 4. Complexity Assessment

| Component | Complexity | Risk | Priority |
|-----------|-----------|------|----------|
| Authentication & RBAC | Medium | Low | P0 |
| Village & Commodity CRUD | Low | Low | P0 |
| Inventory Management | Medium | Medium | P0 |
| PostGIS Geospatial Queries | High | Medium | P0 |
| Leaflet Map Integration | Medium | Low | P0 |
| Rule-Based AI Engine | Medium | Medium | P0 |
| Transaction Workflow | Medium | Medium | P0 |
| Dashboard Analytics | Medium | Low | P1 |
| ML Pipeline (XGBoost/Prophet) | High | High | P2 |
| Real-time WebSocket | Medium | Medium | P2 |
| Logistics Optimization | Very High | High | P3 |

---

## 5. Critical Path Analysis

```
Phase 0: Foundation (Week 1-2)
    ├── Monorepo + CI/CD
    ├── Database Schema + Migrations
    └── Seed Data (Rejang Lebong)
         │
Phase 1: Core Platform (Week 3-6)
    ├── Auth + RBAC ──────────┐
    ├── Village CRUD ─────────┤
    ├── Commodity CRUD ───────┤
    ├── Inventory CRUD ───────┤
    └── PostGIS Queries ──────┤
         │                     │
Phase 2: Supply-Demand (Week 5-6)
    ├── Map View ─────────────┤
    ├── Surplus/Shortage ─────┤
    └── Dashboard ────────────┘
         │
Phase 3: AI Engine (Week 7-8) ←── CRITICAL DEPENDENCY: Inventory data must exist
    ├── FastAPI Service
    ├── Rule Engine
    └── Recommendation UI
         │
Phase 4: Transactions (Week 9-10)
    ├── Transaction CRUD
    └── Accept/Reject Workflow
         │
Phase 5: MVP Launch (Week 11-12)
    ├── UAT
    ├── Bug Fixes
    └── Deployment
```

---

## 6. Resource Estimation (MVP)

| Resource | Specification | Monthly Cost (est.) |
|----------|-------------|-------------------|
| VPS (Primary) | 4 vCPU, 8GB RAM, 160GB SSD | $48/mo (DigitalOcean) |
| VPS (Staging) | 2 vCPU, 4GB RAM, 80GB SSD | $24/mo |
| Domain + SSL | koperasilink.id + Let's Encrypt | $12/yr |
| Object Storage | 50GB (backups, exports) | $5/mo |
| Routing API | OSRM self-hosted | $0 (on VPS) |
| GitHub (Team) | 5 seats | $0 (free tier) |
| Monitoring | Grafana Cloud Free | $0 |
| **Total MVP** | | **~$77/mo** |

---

## 7. Success Criteria (MVP)

| Criteria | Measurement | Target |
|----------|-------------|--------|
| Platform functional | All P0 features deployed | 100% |
| Data coverage | Villages registered with inventory | ≥ 20 villages |
| AI operational | Rule engine generating recommendations | ≥ 70% surplus matched |
| Performance | Dashboard load time | < 2s (p95) |
| Uptime | Post-launch availability | ≥ 99.5% |
| Adoption | Weekly active users | ≥ 10 cooperatives |
