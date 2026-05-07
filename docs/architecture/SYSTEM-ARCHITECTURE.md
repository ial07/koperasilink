# KoperasiLink — System Architecture Document

**Version:** 1.0  
**Date:** 2026-05-07  
**Author:** Engineering Architecture Team

---

## 1. Architecture Overview

KoperasiLink follows a **modular monolith with isolated AI service** pattern for MVP, designed for incremental decomposition into bounded microservices.

### 1.1 Architecture Principles

1. **Domain-Driven Boundaries** — Each module encapsulates a business domain (village, inventory, transaction, recommendation).
2. **AI Isolation** — Python AI service runs in a separate container, communicates via HTTP REST (gRPC future path).
3. **Event-Ready** — Internal domain events via in-process event bus (NestJS EventEmitter), evolving to Redis pub/sub, then dedicated event bus.
4. **Cache-First Reads** — Hot data (supply snapshots, dashboard aggregations) served from Redis.
5. **Geospatial-Native** — PostGIS for all location-aware queries; no application-layer distance calculations.
6. **Offline-Aware** — Frontend designed for PWA with service worker support for intermittent connectivity.

---

## 2. Component Architecture

### 2.1 Frontend Architecture (Next.js 14+ App Router)

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Sidebar + TopBar wrapper
│   │   ├── page.tsx                      # Main dashboard
│   │   ├── villages/
│   │   │   ├── page.tsx                  # Village list + map
│   │   │   └── [id]/page.tsx            # Village detail
│   │   ├── inventory/
│   │   │   ├── page.tsx                  # Stock overview
│   │   │   └── [villageId]/page.tsx     # Village inventory
│   │   ├── recommendations/
│   │   │   └── page.tsx                  # AI recommendations list
│   │   ├── transactions/
│   │   │   ├── page.tsx                  # Transaction history
│   │   │   └── new/page.tsx             # Create transaction
│   │   ├── analytics/
│   │   │   └── page.tsx                  # Charts + metrics
│   │   └── settings/
│   │       └── page.tsx                  # User/org settings
│   ├── api/                              # Next.js API routes (BFF)
│   └── layout.tsx                        # Root layout
├── components/
│   ├── ui/                               # ShadCN UI components
│   ├── map/                              # Leaflet map components
│   │   ├── VillageMap.tsx
│   │   ├── HeatmapOverlay.tsx
│   │   └── VillageMarker.tsx
│   ├── dashboard/                        # Dashboard widgets
│   │   ├── SupplyDemandCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── MetricsGrid.tsx
│   ├── forms/                            # Domain forms
│   │   ├── InventoryForm.tsx
│   │   └── TransactionForm.tsx
│   └── charts/                           # Recharts/Nivo wrappers
│       ├── PriceTrendChart.tsx
│       └── SupplyTimelineChart.tsx
├── lib/
│   ├── api-client.ts                     # HTTP client (axios/ky)
│   ├── auth.ts                           # Auth helpers
│   └── utils.ts                          # Shared utilities
├── hooks/
│   ├── useVillages.ts                    # TanStack Query hooks
│   ├── useInventory.ts
│   └── useRecommendations.ts
└── stores/
    ├── auth-store.ts                     # Zustand auth state
    └── map-store.ts                      # Zustand map state
```

**State Management Strategy:**
- **Server State:** TanStack Query (React Query) for all API data with stale-while-revalidate.
- **Client State:** Zustand for UI-local state (map viewport, sidebar collapse, filter selections).
- **Form State:** React Hook Form + Zod validation.
- **URL State:** Next.js searchParams for shareable filter/pagination states.

### 2.2 Backend Architecture (NestJS)

```
apps/api/
├── src/
│   ├── main.ts                           # Bootstrap
│   ├── app.module.ts                     # Root module
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── otp.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── village/
│   │   │   ├── village.module.ts
│   │   │   ├── village.controller.ts
│   │   │   ├── village.service.ts
│   │   │   ├── village.repository.ts     # Prisma data access
│   │   │   └── dto/
│   │   │
│   │   ├── commodity/
│   │   │   ├── commodity.module.ts
│   │   │   ├── commodity.controller.ts
│   │   │   ├── commodity.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventory.module.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── inventory.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── transaction/
│   │   │   ├── transaction.module.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── transaction.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── recommendation/
│   │   │   ├── recommendation.module.ts
│   │   │   ├── recommendation.controller.ts
│   │   │   ├── recommendation.service.ts # Proxy to AI service
│   │   │   └── dto/
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   └── geospatial/
│   │       ├── geospatial.module.ts
│   │       ├── geospatial.service.ts     # PostGIS query wrappers
│   │       └── geospatial.repository.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── interfaces/
│   │       ├── paginated.interface.ts
│   │       └── api-response.interface.ts
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── ai-service.config.ts
│   │
│   ├── queue/
│   │   ├── queue.module.ts
│   │   ├── processors/
│   │   │   ├── recommendation.processor.ts
│   │   │   └── analytics.processor.ts
│   │   └── jobs/
│   │       └── job-types.ts
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       ├── prisma.service.ts
│       └── schema.prisma
│
├── test/
│   ├── e2e/
│   └── unit/
└── nest-cli.json
```

**Backend Module Communication:**

```
┌─────────────────────────────────────────────────┐
│                NestJS Application                │
│                                                   │
│  ┌──────────┐     ┌──────────────┐               │
│  │   Auth   │────▶│   Guards     │               │
│  └──────────┘     └──────┬───────┘               │
│                          │ protects               │
│  ┌──────────┐  ┌────────▼──────┐  ┌───────────┐ │
│  │ Village  │──│  Inventory    │──│Transaction│ │
│  └──────────┘  └───────┬───────┘  └─────┬─────┘ │
│                        │                 │        │
│                 ┌──────▼─────────────────▼──────┐ │
│                 │    Recommendation Module       │ │
│                 │  (proxies to AI Service)       │ │
│                 └──────────┬────────────────────┘ │
│                            │ HTTP                  │
│  ┌─────────┐       ┌──────▼───────┐              │
│  │Analytics│◀──────│  Queue/Jobs  │              │
│  └─────────┘       └──────────────┘              │
└──────────────────────────────────────────────────┘
          │
          │ HTTP REST (internal docker network)
          ▼
┌──────────────────────────────────────────────────┐
│              Python FastAPI AI Service            │
│                                                    │
│  ┌──────────────┐  ┌─────────────────┐           │
│  │ Rule Engine  │  │ ML Pipeline     │           │
│  │ (Phase 1)    │  │ (Phase 2-3)     │           │
│  └──────────────┘  └─────────────────┘           │
│                                                    │
│  ┌──────────────┐  ┌─────────────────┐           │
│  │ Pricing      │  │ Forecast        │           │
│  │ Engine       │  │ Service         │           │
│  └──────────────┘  └─────────────────┘           │
└──────────────────────────────────────────────────┘
```

### 2.3 AI Service Architecture (Python FastAPI)

```
services/ai/
├── app/
│   ├── main.py                           # FastAPI app factory
│   ├── config.py                         # Settings via pydantic-settings
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   ├── router.py                # API router aggregation
│   │   │   ├── recommendations.py       # Recommendation endpoints
│   │   │   ├── forecast.py              # Forecast endpoints
│   │   │   ├── pricing.py              # Pricing endpoints
│   │   │   └── health.py               # Health check
│   │   └── deps.py                      # Dependency injection
│   │
│   ├── engine/
│   │   ├── rule_engine.py               # Phase 1: Rule-based matching
│   │   ├── rules/
│   │   │   ├── surplus_match.py         # Surplus-to-shortage matching
│   │   │   ├── priority_scorer.py       # Urgency scoring
│   │   │   ├── profit_estimator.py      # Profit calculation
│   │   │   └── perishability.py         # Perishability weighting
│   │   └── engine_interface.py          # Abstract engine interface
│   │
│   ├── ml/                              # Phase 2+
│   │   ├── pipeline.py                  # Training pipeline
│   │   ├── models/
│   │   │   ├── demand_forecast.py       # XGBoost demand model
│   │   │   ├── price_predictor.py       # Random Forest pricing
│   │   │   └── seasonal_analyzer.py     # Prophet seasonality
│   │   ├── features/
│   │   │   ├── feature_store.py         # Feature engineering
│   │   │   └── transformers.py          # Data transformers
│   │   └── registry/
│   │       └── model_registry.py        # Model versioning
│   │
│   ├── data/
│   │   ├── db.py                        # Database connection (read-only)
│   │   ├── schemas.py                   # Pydantic schemas
│   │   └── repositories.py             # Data access
│   │
│   └── utils/
│       ├── geospatial.py                # Distance calculations
│       ├── logging.py                   # Structured logging
│       └── metrics.py                   # Prometheus metrics
│
├── models/                              # Serialized model artifacts
│   └── .gitkeep
├── tests/
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

---

## 3. Data Flow Architecture

### 3.1 Stock Update Flow

```
User submits stock update
         │
         ▼
┌──────────────────┐
│  Next.js Form    │
│  (React Hook Form│
│   + Zod)         │
└────────┬─────────┘
         │ POST /api/v1/inventory
         ▼
┌──────────────────┐     ┌──────────────┐
│  NestJS API      │────▶│  Validation  │
│  Controller      │     │  Pipe        │
└────────┬─────────┘     └──────────────┘
         │
         ▼
┌──────────────────┐
│  Inventory       │
│  Service         │
│                  │
│  1. Validate     │
│  2. Upsert DB    │
│  3. Emit Event   │
│  4. Invalidate   │
│     cache        │
└────────┬─────────┘
         │
    ┌────┴────────────────────────┐
    │                             │
    ▼                             ▼
┌────────────┐          ┌──────────────────┐
│ PostgreSQL │          │ EventEmitter     │
│ (persist)  │          │ 'inventory.      │
└────────────┘          │  updated'        │
                        └────────┬─────────┘
                                 │
                    ┌────────────┴──────────────┐
                    │                            │
                    ▼                            ▼
          ┌──────────────┐           ┌───────────────────┐
          │ Redis Cache  │           │ BullMQ Job        │
          │ Invalidation │           │ 'check-surplus-   │
          └──────────────┘           │  match'           │
                                     └─────────┬─────────┘
                                               │
                                               ▼
                                     ┌───────────────────┐
                                     │ AI Service        │
                                     │ Rule Engine       │
                                     │ (async via queue) │
                                     └───────────────────┘
```

### 3.2 AI Recommendation Flow

```
BullMQ triggers recommendation job
         │
         ▼
┌──────────────────────┐
│  Recommendation      │
│  Processor           │
│  (NestJS)            │
└────────┬─────────────┘
         │ POST /api/v1/recommendations/generate
         ▼
┌──────────────────────┐
│  AI Service          │
│  (FastAPI)           │
│                      │
│  1. Fetch inventory  │
│     snapshot         │
│  2. Fetch village    │
│     distances        │
│  3. Run rule engine  │
│  4. Score & rank     │
│  5. Return matches   │
└────────┬─────────────┘
         │ JSON response
         ▼
┌──────────────────────┐
│  NestJS              │
│  Recommendation      │
│  Service             │
│                      │
│  1. Persist to DB    │
│  2. Cache results    │
│  3. Emit event       │
│  4. (Future) Notify  │
│     via WebSocket    │
└──────────────────────┘
```

### 3.3 Geospatial Query Flow

```sql
-- Find surplus villages within 100km of a shortage village
SELECT 
  v.id, v.name,
  i.current_stock,
  i.unit_price,
  ST_Distance(
    v.coordinates::geography,
    target.coordinates::geography
  ) / 1000 AS distance_km
FROM villages v
JOIN inventory i ON i.village_id = v.id
CROSS JOIN (
  SELECT coordinates 
  FROM villages 
  WHERE id = :target_village_id
) target
WHERE i.commodity_id = :commodity_id
  AND i.current_stock > :surplus_threshold
  AND ST_DWithin(
    v.coordinates::geography,
    target.coordinates::geography,
    100000  -- 100km in meters
  )
ORDER BY distance_km ASC;
```

---

## 4. Security Architecture

### 4.1 Authentication Flow

```
┌────────┐         ┌──────────┐         ┌─────────┐
│ Client │         │ NestJS   │         │ Redis   │
│        │         │ Auth     │         │ Session │
└───┬────┘         └────┬─────┘         └────┬────┘
    │                   │                    │
    │ POST /auth/login  │                    │
    │──────────────────▶│                    │
    │                   │ Validate creds     │
    │                   │ against PostgreSQL │
    │                   │                    │
    │                   │ Store session ──────▶
    │                   │                    │
    │  JWT (access +    │                    │
    │  refresh token)   │                    │
    │◀──────────────────│                    │
    │                   │                    │
    │ GET /api/v1/...   │                    │
    │ Authorization:    │                    │
    │ Bearer <jwt>      │                    │
    │──────────────────▶│                    │
    │                   │ Verify JWT         │
    │                   │ Check RBAC         │
    │  Response         │                    │
    │◀──────────────────│                    │
```

### 4.2 RBAC Matrix

| Resource | koperasi_admin | bumdes_operator | distributor | government | farmer |
|----------|:---:|:---:|:---:|:---:|:---:|
| Villages (own) | RW | RW | R | R | R |
| Villages (all) | R | R | R | R | - |
| Inventory (own) | RW | RW | R | R | R |
| Inventory (all) | R | R | R | R | - |
| Transactions (own) | RW | RW | RW | R | R |
| Recommendations | RW | RW | R | R | R |
| Analytics | R | R | - | R | - |
| User Management | RW* | R | - | R | - |
| System Config | RW* | - | - | - | - |

*R = Read, W = Write, RW = Read+Write, RW* = Admin-scoped*

---

## 5. Scalability Architecture

### 5.1 Scaling Strategy by Phase

| Phase | Architecture | Capacity | Trigger |
|-------|-------------|----------|---------|
| **MVP** | Single VPS, Docker Compose | 50 villages, 200 users | Launch |
| **Growth** | 2-VPS (API + DB separated) | 500 villages, 2K users | DB CPU > 70% sustained |
| **Scale** | Docker Swarm / K3s cluster | 2K villages, 10K users | API p95 > 500ms |
| **Enterprise** | Kubernetes + managed services | 5K+ villages, 50K+ users | Multi-region demand |

### 5.2 Horizontal Scaling Points

```
                     Load Balancer (Nginx / HAProxy)
                            │
               ┌────────────┼────────────┐
               │            │            │
          ┌────▼───┐   ┌────▼───┐   ┌────▼───┐
          │ API-1  │   │ API-2  │   │ API-3  │  ← Stateless, scale freely
          └────┬───┘   └────┬───┘   └────┬───┘
               │            │            │
          ┌────▼────────────▼────────────▼───┐
          │         Redis Cluster             │  ← Session + cache
          └──────────────┬───────────────────┘
                         │
          ┌──────────────▼───────────────────┐
          │    PostgreSQL (Primary-Replica)    │  ← Read replicas for analytics
          └──────────────────────────────────┘
```

### 5.3 Caching Strategy

| Data | Cache Key Pattern | TTL | Invalidation |
|------|-------------------|-----|-------------|
| Village list | `villages:list:{page}:{filter}` | 5 min | On village create/update |
| Inventory snapshot | `inventory:village:{id}` | 2 min | On stock update |
| Supply-demand summary | `supply-demand:summary` | 1 min | On any inventory change |
| Heatmap data | `heatmap:{commodity}:{region}` | 5 min | Scheduled refresh |
| AI recommendations | `recommendations:active` | 5 min | On new generation |
| User session | `session:{userId}` | 24h | On logout |

---

## 6. Error Handling Architecture

### 6.1 Error Taxonomy

```typescript
// Standardized API error response
interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  requestId: string;
}

// Error codes
enum ErrorCode {
  // 400 - Validation
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  STOCK_BELOW_ZERO = 'STOCK_BELOW_ZERO',
  
  // 401/403 - Auth
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 404 - Not Found
  VILLAGE_NOT_FOUND = 'VILLAGE_NOT_FOUND',
  COMMODITY_NOT_FOUND = 'COMMODITY_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  
  // 409 - Conflict
  DUPLICATE_INVENTORY = 'DUPLICATE_INVENTORY',
  TRANSACTION_ALREADY_COMPLETED = 'TRANSACTION_ALREADY_COMPLETED',
  
  // 503 - Service
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
}
```

### 6.2 Retry & Circuit Breaker

```
NestJS → AI Service communication:

Retry Policy:
  - Max retries: 3
  - Backoff: exponential (100ms, 200ms, 400ms)
  - Retry on: 5xx, ECONNREFUSED, ETIMEDOUT

Circuit Breaker:
  - Failure threshold: 5 failures in 30s
  - Open duration: 60s
  - Half-open: 1 test request
  - Fallback: Return cached recommendations or empty set
```
