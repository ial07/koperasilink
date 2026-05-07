# KoperasiLink — Engineering Phase Planning

**Version:** 1.0 | **Date:** 2026-05-07

---

## Phase 0: Project Foundation & Architecture

| Attribute | Value |
|-----------|-------|
| **Goal** | Establish monorepo, CI/CD, database schema, seed data, dev environment |
| **Duration** | Week 1–2 |
| **Complexity** | Medium |
| **Dependencies** | None (root phase) |

### Scope
- Monorepo initialization (Turborepo)
- Next.js app scaffold (App Router, TypeScript, TailwindCSS, ShadCN)
- NestJS API scaffold (modular architecture, Prisma)
- FastAPI AI service scaffold
- PostgreSQL + PostGIS schema design & migrations
- Docker Compose for local dev
- GitHub Actions CI pipeline (lint, type-check, test)
- Seed data: 20+ Rejang Lebong villages, 10 commodities

### Deliverables
1. Working monorepo with `apps/web`, `apps/api`, `services/ai`
2. `packages/shared-types` — shared TypeScript interfaces
3. `packages/database` — Prisma schema + migrations
4. Docker Compose: postgres, redis, api, web, ai
5. CI pipeline: lint → type-check → test → build
6. Seed script with real village GPS coordinates
7. README with local setup instructions

### Technical Tasks
- [ ] `npx create-turbo@latest` monorepo setup
- [ ] Next.js 14 scaffold with App Router
- [ ] NestJS scaffold with module structure
- [ ] FastAPI scaffold with project layout
- [ ] Prisma schema: villages, users, commodities, inventory, transactions, ai_recommendations, village_routes
- [ ] PostGIS extension setup in migration
- [ ] Docker Compose with health checks
- [ ] GitHub Actions: `.github/workflows/ci.yml`
- [ ] `.env.example` for all services
- [ ] Seed script: `packages/database/seed.ts`

### Risks
| Risk | Mitigation |
|------|-----------|
| PostGIS Docker image compatibility | Use `postgis/postgis:16-3.4` official image |
| Turborepo cache invalidation | Pin dependency versions, configure `turbo.json` carefully |
| Prisma + PostGIS type mismatch | Use raw SQL for geospatial, Prisma for relational |

### Success Criteria
- [ ] `docker compose up` boots all services
- [ ] `pnpm dev` runs all apps in parallel
- [ ] Prisma migrations apply cleanly
- [ ] Seed data loads 20+ villages with valid coordinates
- [ ] CI pipeline passes on push to `main`

---

## Phase 1: Core Cooperative Platform

| Attribute | Value |
|-----------|-------|
| **Goal** | Authentication, RBAC, Village/Commodity/Inventory CRUD |
| **Duration** | Week 3–4 |
| **Complexity** | Medium |
| **Dependencies** | Phase 0 complete |

### Scope
- JWT authentication with OTP fallback
- Role-based access control (5 roles)
- Village CRUD with map-based location picker
- Commodity management
- Inventory CRUD with stock validation
- PostGIS geospatial queries (nearby villages, radius search)

### Deliverables
1. Auth module: register, login, OTP request/verify, JWT refresh
2. RBAC guard middleware
3. Village API: CRUD + geospatial endpoints
4. Commodity API: CRUD
5. Inventory API: CRUD with validation rules
6. Frontend: Login/Register pages, Village list + detail, Inventory forms
7. Unit tests for auth and inventory validation

### Technical Tasks
- [ ] NestJS Auth module: Passport JWT + OTP strategy
- [ ] RBAC decorator + guard (`@Roles('koperasi_admin')`)
- [ ] Village controller/service/repository with PostGIS
- [ ] `ST_DWithin`, `ST_Distance` query wrappers in geospatial service
- [ ] Commodity controller/service
- [ ] Inventory controller/service with stock bounds validation
- [ ] Frontend auth pages (login, register) with React Hook Form + Zod
- [ ] Village list page with search/filter
- [ ] Village detail page with map pin
- [ ] Inventory form with commodity selector
- [ ] API client setup (axios instance with JWT interceptor)
- [ ] TanStack Query hooks for all endpoints

### Risks
| Risk | Mitigation |
|------|-----------|
| OTP delivery in rural areas | Support multiple OTP channels (SMS, WhatsApp) |
| PostGIS raw SQL complexity | Wrap in repository layer, test with known coordinates |

### Success Criteria
- [ ] User can register, login, receive JWT
- [ ] RBAC blocks unauthorized actions (tested)
- [ ] Village CRUD works with map coordinates
- [ ] Inventory updates persist and validate correctly
- [ ] Geospatial query returns villages within radius

---

## Phase 2: Supply-Demand Intelligence

| Attribute | Value |
|-----------|-------|
| **Goal** | Interactive map, surplus/shortage indicators, dashboard |
| **Duration** | Week 5–6 |
| **Complexity** | Medium-High |
| **Dependencies** | Phase 1 (Village + Inventory data) |

### Scope
- Leaflet map with village markers (color-coded by status)
- Surplus/shortage heatmap overlay
- Supply-demand dashboard with key metrics
- Distance & cost estimation between villages
- Real-time supply snapshot (Redis cache)

### Deliverables
1. Interactive Leaflet map component
2. Color-coded markers: green (surplus), yellow (balanced), red (shortage)
3. Heatmap overlay by commodity
4. Dashboard: total surplus, total shortage, top commodities, price trends
5. Village distance matrix (cached)
6. Redis cache layer for supply snapshots

### Technical Tasks
- [ ] `VillageMap` component with React-Leaflet
- [ ] `VillageMarker` with popup (stock summary, link to detail)
- [ ] `HeatmapOverlay` using leaflet-heat plugin
- [ ] Dashboard API: `/api/v1/dashboard/summary`, `/heatmap`, `/trends/:period`
- [ ] Aggregation queries: surplus/shortage by commodity, by region
- [ ] Redis caching for supply-demand snapshots (2 min TTL)
- [ ] `SupplyDemandCard`, `MetricsGrid` dashboard components
- [ ] `PriceTrendChart` with Recharts
- [ ] Commodity filter on map and dashboard
- [ ] Responsive layout for mobile map view

### Risks
| Risk | Mitigation |
|------|-----------|
| Leaflet performance with 500+ markers | Implement marker clustering (`react-leaflet-cluster`) |
| Map tiles in offline areas | Cache OpenStreetMap tiles for pilot region |

### Success Criteria
- [ ] Map renders 50 villages with correct positions
- [ ] Surplus/shortage colors reflect inventory data
- [ ] Dashboard metrics are accurate and load < 2s
- [ ] Heatmap shows commodity density correctly

---

## Phase 3: Rule-Based AI Recommendation Engine

| Attribute | Value |
|-----------|-------|
| **Goal** | AI service generating surplus-to-shortage matches |
| **Duration** | Week 7–8 |
| **Complexity** | High |
| **Dependencies** | Phase 2 (inventory data + geospatial queries) |

### Scope
- FastAPI rule engine implementation
- Surplus-to-shortage matching algorithm
- Priority scoring (distance × perishability × urgency)
- Profit estimation per recommendation
- NestJS ↔ AI Service integration
- Recommendation display + accept/reject workflow

### Deliverables
1. Rule engine with configurable thresholds (stored in DB)
2. Matching algorithm: commodity match → distance filter → priority score
3. Recommendation API: generate, list, accept, reject
4. BullMQ job for async recommendation generation
5. Frontend: recommendation cards with accept/reject actions
6. AI service health check + circuit breaker

### Technical Tasks
- [ ] FastAPI rule engine module (`engine/rule_engine.py`)
- [ ] Surplus match rule: `IF stock > threshold AND nearby_village.stock < min`
- [ ] Priority scorer: `urgency_weight * (1/distance) * perishability_factor * surplus_ratio`
- [ ] Profit estimator: `(target_price - source_price) * quantity - shipping_cost`
- [ ] REST endpoints: `POST /recommendations/generate`, `GET /recommendations`
- [ ] NestJS recommendation module (proxy to AI service)
- [ ] BullMQ processor: `recommendation.processor.ts`
- [ ] Circuit breaker with fallback (cached or empty)
- [ ] `RecommendationCard` component with score badge, accept/reject buttons
- [ ] Recommendation list page with filters (status, commodity, village)

### Risks
| Risk | Mitigation |
|------|-----------|
| AI service latency spikes | Async via BullMQ, < 5s SLA, circuit breaker |
| Cold start with no data | Seed 10 sample transactions, pre-compute recommendations |
| Rule threshold tuning | Make all thresholds DB-configurable, admin UI in Phase 5 |

### Success Criteria
- [ ] Rule engine generates valid recommendations from seed data
- [ ] Priority scoring differentiates high-perishability matches
- [ ] User can accept recommendation → creates transaction draft
- [ ] AI service responds < 5s for 50 villages
- [ ] Circuit breaker activates on AI service failure

---

## Phase 4: Transaction & Logistics Layer

| Attribute | Value |
|-----------|-------|
| **Goal** | Full transaction lifecycle, status tracking, basic logistics |
| **Duration** | Week 9–10 |
| **Complexity** | Medium |
| **Dependencies** | Phase 3 (recommendations feed transactions) |

### Scope
- Transaction CRUD with status workflow
- Transaction from accepted recommendation
- Status transitions: pending → confirmed → in_transit → completed / cancelled
- Transaction history with filters
- Basic cost estimation (distance × rate)
- Stock auto-adjustment on transaction completion

### Deliverables
1. Transaction API: create, update status, list with pagination
2. Status workflow with validation (no skip states)
3. Auto-create transaction from accepted recommendation
4. Stock deduction (source) and addition (target) on completion
5. Transaction history page with filters
6. Transaction detail page with timeline

### Technical Tasks
- [ ] Transaction module: controller, service, repository
- [ ] Status state machine with transition validation
- [ ] `POST /transactions` — manual or from recommendation
- [ ] `PUT /transactions/:id/status` — with transition guard
- [ ] Inventory adjustment on `completed` status (within DB transaction)
- [ ] Event: `transaction.completed` → update analytics cache
- [ ] Transaction list page with status tabs, date range, commodity filter
- [ ] Transaction detail with status timeline component
- [ ] E2E test: recommendation → accept → transaction → complete → stock adjusted

### Success Criteria
- [ ] Full transaction lifecycle works end-to-end
- [ ] Invalid status transitions are rejected
- [ ] Stock adjusts correctly on completion
- [ ] Transaction history is filterable and paginated

---

## Phase 5: Analytics & Monitoring

| Attribute | Value |
|-----------|-------|
| **Goal** | Dashboard analytics, trend charts, monitoring foundation |
| **Duration** | Week 10–11 |
| **Complexity** | Medium |
| **Dependencies** | Phase 4 (transaction data for analytics) |

### Scope
- Analytics dashboard: KPIs, trends, commodity breakdown
- Price trend charts per commodity
- Transaction volume charts
- Recommendation acceptance rate tracking
- Basic application monitoring (health checks, error rates)
- Structured logging

### Deliverables
1. Analytics API with aggregation queries
2. KPI cards: active villages, transactions this week, AI acceptance rate
3. Price trend chart (Recharts)
4. Transaction volume chart (bar chart by week)
5. Health check endpoints for all services
6. Structured JSON logging (pino for NestJS, structlog for Python)

### Success Criteria
- [ ] Dashboard shows accurate real-time KPIs
- [ ] Charts render correctly with seed + test data
- [ ] Health check endpoints respond correctly
- [ ] Logs are structured JSON with request IDs

---

## Phase 6: Machine Learning Forecasting (Post-MVP)

| Attribute | Value |
|-----------|-------|
| **Goal** | XGBoost demand prediction, Prophet seasonality, ML pipeline |
| **Duration** | Month 4–6 post-launch |
| **Complexity** | Very High |
| **Dependencies** | 6+ months of transaction data, 20+ active villages |

### Scope
- Feature engineering pipeline
- XGBoost short-term demand model
- Prophet seasonal trend analysis
- Model training/evaluation pipeline
- Model registry with versioning
- A/B testing: rule-based vs ML recommendations
- ML observability (prediction logging, drift detection)

### Deliverables
1. Feature store with automated feature computation
2. Trained XGBoost model with evaluation metrics
3. Prophet model for seasonal analysis
4. Model registry (MLflow or custom)
5. Prediction API endpoints
6. A/B test framework for recommendation engine
7. Drift detection alerts

### Success Criteria
- [ ] ML model outperforms rule engine on backtested data
- [ ] Feature pipeline runs daily without manual intervention
- [ ] Model retraining triggered on performance degradation
- [ ] Prediction latency < 2s (p95)

---

## Phase 7: Production Hardening

| Attribute | Value |
|-----------|-------|
| **Goal** | Security audit, performance optimization, disaster recovery |
| **Duration** | Month 6–7 |
| **Complexity** | High |
| **Dependencies** | Phase 5+ (production traffic) |

### Scope
- Security audit: OWASP top 10, dependency scanning
- Performance: query optimization, N+1 detection, CDN
- Database: connection pooling (PgBouncer), read replicas
- Backup: automated daily + point-in-time recovery
- Rate limiting hardening
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot / Grafana)

### Deliverables
1. Security audit report + remediations
2. Performance benchmark report
3. PgBouncer configuration
4. Automated backup script + restore runbook
5. Sentry integration for error tracking
6. Grafana dashboards for system metrics

### Success Criteria
- [ ] Zero critical security vulnerabilities
- [ ] API p95 < 300ms under 50 concurrent users
- [ ] Database backup + restore tested successfully
- [ ] Error tracking captures and alerts on failures

---

## Phase 8: Scale & Expansion Preparation

| Attribute | Value |
|-----------|-------|
| **Goal** | Multi-region readiness, API marketplace, mobile app |
| **Duration** | Month 8–12 |
| **Complexity** | Very High |
| **Dependencies** | Phase 7 (production stable) |

### Scope
- Kubernetes migration (K3s → managed K8s)
- Multi-region database (read replicas per region)
- API versioning + public API preparation
- WhatsApp Business API integration
- Mobile app evaluation (React Native)
- Multi-tenant architecture for multiple kabupaten

### Deliverables
1. K8s manifests / Helm charts
2. Multi-region deployment strategy document
3. Public API documentation (OpenAPI 3.0)
4. WhatsApp notification integration
5. Mobile app prototype (React Native)
6. Multi-tenant data isolation design

### Success Criteria
- [ ] Zero-downtime deployment on K8s
- [ ] Multi-region failover tested
- [ ] Public API documented and rate-limited
- [ ] WhatsApp notifications delivered < 30s
