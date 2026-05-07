# KOPERASILINK — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-07  
**Author:** Arlys Corporation  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision](#3-product-vision)
4. [Target Audience](#4-target-audience)
5. [User Personas](#5-user-personas)
6. [Core Features](#6-core-features)
7. [AI Implementation Strategy](#7-ai-implementation-strategy)
8. [Data Architecture](#8-data-architecture)
9. [Data Model](#9-data-model)
10. [System Architecture](#10-system-architecture)
11. [Tech Stack](#11-tech-stack)
12. [API Design (High-Level)](#12-api-design-high-level)
13. [MVP Scope](#13-mvp-scope)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Key Performance Indicators](#15-key-performance-indicators)
16. [Roadmap & Milestones](#16-roadmap--milestones)
17. [Future Features (Post-MVP)](#17-future-features-post-mvp)
18. [Business Value](#18-business-value)
19. [Risks & Mitigation](#19-risks--mitigation)
20. [Appendix](#20-appendix)

---

## 1. Executive Summary

KoperasiLink is an AI-powered village supply chain and cooperative intelligence platform designed to bridge the gap between surplus-producing villages and deficit-stricken ones. By connecting rural cooperatives (Koperasi Desa) and village-owned enterprises (BUMDes) through real-time data, intelligent demand forecasting, and automated distribution recommendations, KoperasiLink aims to reduce post-harvest losses, stabilize commodity prices, and empower local economies across Indonesia's rural landscape.

The platform leverages a phased AI strategy — starting with rule-based recommendations for rapid MVP delivery, advancing to machine learning predictions, and eventually incorporating reinforcement learning for logistics optimization. KoperasiLink is positioned not merely as a cooperative application, but as the intelligent backbone of inter-village commerce.

---

## 2. Problem Statement

### 2.1 Current Challenges

Rural Indonesia faces recurring structural inefficiencies in agricultural distribution:

| Problem                                                         | Impact                                   |
| --------------------------------------------------------------- | ---------------------------------------- |
| Post-harvest surplus with no buyers                             | Food waste, farmer losses                |
| Price collapse due to localized oversupply                      | Unstable farmer income                   |
| Neighboring villages experience shortages of the same commodity | Price spikes, scarcity                   |
| Manual inter-village distribution coordination                  | Slow, error-prone, no data trail         |
| No real-time supply & demand visibility                         | Reactive decisions, missed opportunities |
| Cooperatives lack predictive tools                              | Inability to anticipate market needs     |
| Distribution decisions based on intuition                       | Suboptimal routing, higher costs         |

### 2.2 Illustrative Scenario

> **Desa A** yields 2 tons of chili surplus.  
> **Desa B** (65 km away) faces a 1-ton chili shortage.  
> No system connects them.  
> Result: Chili prices crash in Desa A, part of the harvest rots. Meanwhile, chili prices in Desa B surge by 300%.  
> A simple recommendation — "Distribute 1 ton from A to B" — would prevent waste, stabilize prices, and generate profit for both cooperatives.

KoperasiLink is built to detect, analyze, and resolve such mismatches automatically.

---

## 3. Product Vision

**"Connecting village economies through intelligent supply chains."**

KoperasiLink aspires to become the operating system for inter-village commerce — a platform where:

- Every village cooperative knows exactly where to send their surplus.
- Every shortage is automatically matched with the nearest available supply.
- Distribution decisions are data-driven, not gut-driven.
- AI proactively predicts shortages before they become crises.
- Farmers earn fair prices, and consumers pay fair prices.

---

## 4. Target Audience

### Primary Users

| User Group                               | Role in Ecosystem                  | Key Need                              |
| ---------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Village Cooperatives (Koperasi Desa)** | Aggregate & distribute commodities | Real-time surplus/shortage visibility |
| **BUMDes**                               | Manage village economic activities | Data-driven distribution decisions    |
| **Local Farmers**                        | Primary commodity producers        | Sell surplus at fair prices           |

### Secondary Users

| User Group              | Role in Ecosystem       | Key Need                            |
| ----------------------- | ----------------------- | ----------------------------------- |
| **Local Distributors**  | Logistics & transport   | Optimal routing, load consolidation |
| **Village SMEs (UMKM)** | Process raw commodities | Predictable raw material supply     |

### Tertiary Users

| User Group                                      | Role in Ecosystem                | Key Need                          |
| ----------------------------------------------- | -------------------------------- | --------------------------------- |
| **Local Government (Dinas Pangan/Perdagangan)** | Policy & food security oversight | Regional supply-demand dashboards |
| **Sub-district & Village Officials**            | Development planning             | Economic insight & reporting      |

---

## 5. User Personas

### Persona 1: Pak Budi — Koperasi Manager, Desa Sumberejo

- **Age:** 45
- **Tech Literacy:** Low (basic smartphone usage)
- **Frustration:** Has 2 tons of chili surplus but doesn't know where to sell. Middlemen offer low prices.
- **Need:** A simple system to report stock and get matched with buyers automatically.
- **Success metric:** Surplus sold within 3 days at fair price.

### Persona 2: Bu Sari — BUMDes Operator, Desa Sukamaju

- **Age:** 32
- **Tech Literacy:** Medium (uses WhatsApp, spreadsheets)
- **Frustration:** Manually tracking supply requests from local warungs and balancing them with village stock.
- **Need:** Dashboard showing incoming requests, outgoing supply, and price trends.
- **Success metric:** 50% reduction in manual coordination time.

### Persona 3: Pak Eko — Dinas Pangan Analyst

- **Age:** 38
- **Tech Literacy:** High (excel, basic data tools)
- **Frustration:** No real-time visibility into regional food supply. Reports are always 2 weeks late.
- **Need:** Regional heatmaps, trend reports, and proactive shortage alerts.
- **Success metric:** Real-time dashboard with < 1-hour data freshness.

---

## 6. Core Features

### F1: Village Commodity Dashboard

| Feature                               | Description                                            |
| ------------------------------------- | ------------------------------------------------------ |
| Stock overview by village & commodity | Real-time inventory levels                             |
| Price tracking                        | Current market price, historical trends                |
| Surplus/Shortage indicators           | Color-coded status (green, yellow, red)                |
| Harvest schedule                      | Upcoming harvest calendar per village                  |
| Distribution history                  | Time-stamped record of all outgoing/incoming shipments |

### F2: Supply & Demand Mapping

| Feature                    | Description                               |
| -------------------------- | ----------------------------------------- |
| Interactive village map    | Leaflet/OpenStreetMap with pin markers    |
| Surplus/shortage heatmap   | Visual density overlay for quick scanning |
| Distance & cost estimation | Between any two villages                  |
| Demand signals             | Incoming requests displayed on the map    |

### F3: AI Recommendation Engine

| Feature                      | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| Surplus-to-shortage matching | Automated matchmaking between villages                           |
| Priority scoring             | Urgency-based ranking (distance, perishability, demand pressure) |
| Profit estimation            | Projected earnings for each distribution route                   |
| Price impact projection      | Expected effect on local prices after distribution               |

### F4: Demand Forecasting

| Feature              | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| Short-term forecast  | 1–2 weeks ahead                                                         |
| Medium-term forecast | 1–3 months ahead                                                        |
| Anomaly detection    | Sudden demand spikes or supply drops                                    |
| Model inputs         | Transaction history, seasonality, weather, holidays, consumption trends |

### F5: Dynamic Pricing Recommendation

| Feature                          | Description                                     |
| -------------------------------- | ----------------------------------------------- |
| Optimal selling price            | Data-backed price suggestion for each commodity |
| Inter-village distribution price | Price for inter-cooperative trade               |
| Cooperative margin calculator    | Automated margin projection                     |

### F6: Logistics Optimization

| Feature                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| Best route calculation | Shortest/time-efficient path between villages  |
| Cost estimation        | Fuel + labor + vehicle type                    |
| Load consolidation     | Combine multiple small shipments into one trip |

---

## 7. AI Implementation Strategy

### Phase 1 — Rule-Based Engine (MVP)

**Goal:** Functional recommendations without massive datasets.

**Logic pattern:**

```
IF:
  - Stok_Desa_A[commodity] > threshold
  - Desa_B[commodity] < min_stok
  - Jarak(Desa_A, Desa_B) < distance_limit
  - Komoditas matches

THEN:
  - Generate recommendation: "Distribute X tons of Y from A to B"
  - Estimated profit: Z
  - Priority score: urgency_weight * distance_weight * surplus_ratio
```

**Rules stored in database** — configurable per cooperative (not hardcoded).

**Decision factors for MVP:**

- Surplus quantity vs shortage quantity
- Physical distance (real road distance, not straight-line)
- Commodity perishability tier (high/medium/low)
- Historical transaction velocity between villages

### Phase 2 — Machine Learning (3–6 months post-MVP)

| Model             | Purpose                                    | Input                                                 |
| ----------------- | ------------------------------------------ | ----------------------------------------------------- |
| **XGBoost**       | Short-term demand prediction               | Historical transactions, season, holiday flags        |
| **Prophet**       | Seasonal trend & anomaly detection         | Multi-year historical data                            |
| **Random Forest** | Price prediction & shortage classification | Stock levels, harvest estimates, external price feeds |

**Training data requirements:**

- Minimum 6 months of transaction data
- At least 20 active villages
- Weather and holiday data cross-referenced

### Phase 3 — Advanced AI (6–12 months post-MVP)

**Exploration areas:**

- **Reinforcement Learning** for multi-village logistics routing
- **Graph Neural Networks** for supply chain topology optimization
- **Time-series transformer** for long-range forecasting
- **Multi-objective optimization** (cost vs time vs fairness vs environmental impact)

---

## 8. Data Architecture

### 8.1 Essential Data Fields

**Village Data**
| Field | Type | Notes |
|-------|------|-------|
| `village_id` | UUID | Primary identifier |
| `name` | string | Official village name |
| `subdistrict` | string | Kecamatan |
| `district` | string | Kabupaten |
| `latitude` | float | GPS coordinate |
| `longitude` | float | GPS coordinate |
| `coordinates` | GEOGRAPHY(Point, 4326) | PostGIS geometry |
| `population` | int | Optional for demand estimation |
| `main_commodities` | string[] | Primary economic products |

**Commodity Data**
| Field | Type | Notes |
|-------|------|-------|
| `commodity_id` | UUID | Primary identifier |
| `name` | string | e.g., "Cabai Merah" |
| `category` | enum | Vegetables, Fruits, Grains, etc. |
| `unit` | enum | kg, ton, bundle |
| `perishability` | enum | high/medium/low |
| `icon_url` | string | For dashboard display |

**Inventory/Stock Data**
| Field | Type | Notes |
|-------|------|-------|
| `inventory_id` | UUID | Primary identifier |
| `village_id` | UUID | FK to villages |
| `commodity_id` | UUID | FK to commodities |
| `current_stock` | float | Current available quantity |
| `capacity` | float | Maximum storage/production capacity |
| `harvest_date` | date | Last/next harvest |
| `unit_price` | float | Current market price (IDR) |
| `last_updated` | timestamp | Data freshness indicator |

**Transaction Data**
| Field | Type | Notes |
|-------|------|-------|
| `transaction_id` | UUID | Primary identifier |
| `from_village` | UUID | Sender FK |
| `to_village` | UUID | Receiver FK |
| `commodity_id` | UUID | FK to commodities |
| `quantity` | float | Amount transferred |
| `unit_price` | float | Price per unit (IDR) |
| `total_amount` | float | Total transaction value |
| `status` | enum | pending, in_transit, completed, cancelled |
| `ai_recommended` | boolean | Was this AI-driven? |
| `shipping_cost` | float | Transport cost (IDR) |
| `created_at` | timestamp | Transaction timestamp |
| `completed_at` | timestamp | Delivery confirmation timestamp |

**User Data**
| Field | Type | Notes |
|-------|------|-------|
| `user_id` | UUID | Primary identifier |
| `name` | string | Full name |
| `role` | enum | koperasi_admin, bumdes_operator, distributor, government, farmer |
| `village_id` | UUID | FK to associated village |
| `phone` | string | WhatsApp-enabled number |
| `email` | string | Optional |
| `auth_provider` | string | OTP / Google / manual |
| `permissions` | JSON | Role-based access rules |

### 8.2 Additional Data Sources (Advanced)

| Source               | Type         | Use Case                      |
| -------------------- | ------------ | ----------------------------- |
| BMKG                 | Weather API  | Forecast model input          |
| National Price Board | Market API   | External price benchmark      |
| OSRM / GraphHopper   | Routing API  | Real distance & travel time   |
| Google Trends        | Search trend | Consumption pattern detection |

---

## 9. Data Model (Relational)

```
villages
  ├── id (UUID, PK)
  ├── name, subdistrict, district
  ├── location (PostGIS GEOGRAPHY POINT)
  └── population, main_commodities

users
  ├── id (UUID, PK)
  ├── village_id (FK → villages)
  ├── name, phone, email, role
  └── permissions (JSONB)

commodities
  ├── id (UUID, PK)
  ├── name, category, unit
  └── perishability, icon_url

inventory
  ├── id (UUID, PK)
  ├── village_id (FK → villages)
  ├── commodity_id (FK → commodities)
  ├── current_stock, capacity
  ├── harvest_date, unit_price
  └── last_updated

transactions
  ├── id (UUID, PK)
  ├── from_village (FK → villages)
  ├── to_village (FK → villages)
  ├── commodity_id (FK → commodities)
  ├── quantity, unit_price, total_amount
  ├── status (ENUM)
  ├── ai_recommended (BOOLEAN)
  └── created_at, completed_at

ai_recommendations
  ├── id (UUID, PK)
  ├── source_village_id (FK → villages)
  ├── target_village_id (FK → villages)
  ├── commodity_id (FK → commodities)
  ├── recommended_quantity, estimated_profit
  ├── priority_score, status (ENUM)
  ├── triggered_by (RULE_ENGINE | ML_MODEL | MANUAL)
  └── created_at

village_routes
  ├── id (UUID, PK)
  ├── village_a_id, village_b_id (FK → villages)
  ├── distance_km, travel_time_min
  ├── road_condition (ENUM)
  └── cost_per_kg
```

---

## 10. System Architecture

### 10.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Application                         │
│  (TailwindCSS + ShadCN UI + Leaflet/OpenStreetMap + Framer)    │
└─────────┬──────────────────────────────────────┬────────────────┘
          │ HTTP/REST                             │ WebSocket
          ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS API Gateway                            │
│  (Authentication │ Rate Limiting │ Request Validation)          │
└─────────┬──────────────────────────────┬────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐     ┌─────────────────────────────────────┐
│   NestJS Service    │     │    Python FastAPI (AI Service)       │
│                     │     │                                      │
│  • User Management  │     │  • Rule Engine (Phase 1)            │
│  • Village Mgmt     │     │  • ML Predictions (Phase 2)         │
│  • Inventory        │     │  • Demand Forecasting               │
│  • Transactions     │     │  • Dynamic Pricing                  │
│  • Analytics        │     │  • Route Optimization               │
│  • Reports          │     │                                      │
│                     │     │  Internal communication: HTTP/gRPC   │
└─────────┬───────────┘     └──────────────────┬──────────────────┘
          │                                     │
          ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL + PostGIS                          │
│                                                                  │
│  • Relational data (users, villages, inventory)                 │
│  • Geospatial queries (nearby villages, radius search)          │
│  • Time-series (transaction history)                            │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│      Redis          │
│  • Session cache    │
│  • Supply-demand    │
│    snapshot cache   │
│  • Queue (Bull)     │
└─────────────────────┘
```

### 10.2 Deployment Architecture (MVP)

```
┌────────────────────────────────┐
│  Docker Compose (Single VPS)   │
│                                │
│  ┌──────┐  ┌──────┐  ┌─────┐ │
│  │ Next │  │NestJS│  │Fast │ │
│  │ .js  │  │ API  │  │ API │ │
│  └──┬───┘  └──┬───┘  └──┬──┘ │
│     │         │         │     │
│  ┌──▼─────────▼─────────▼──┐  │
│  │  Nginx (Reverse Proxy)   │  │
│  └─────────────────────────┘  │
│                                │
│  ┌──────────┐ ┌────────────┐  │
│  │PostgreSQL│ │   Redis    │  │
│  │+ PostGIS │ │            │  │
│  └──────────┘ └────────────┘  │
└────────────────────────────────┘
```

**Why monolith-first (MVP):**

- Single deployable stack → faster iteration
- No network overhead between services
- Easier debugging during early stage
- Convert to microservices when load demands it

**Exception:** AI Service stays separate because:

- Different language (Python) for ML libraries
- Can scale independently under heavy inference load
- Avoid blocking main API when AI computations run long

---

## 11. Tech Stack

### Frontend

| Technology                  | Purpose                      |
| --------------------------- | ---------------------------- |
| **Next.js 14+**             | React framework with SSR/SSG |
| **TypeScript**              | Type safety                  |
| **TailwindCSS**             | Utility-first styling        |
| **ShadCN UI**               | Component library            |
| **Framer Motion**           | UI animations                |
| **Leaflet + React-Leaflet** | Interactive maps             |
| **React Query (TanStack)**  | Server state management      |
| **Zustand**                 | Client state management      |
| **Recharts / Nivo**         | Charts & analytics           |

### Backend

| Technology      | Purpose                                     |
| --------------- | ------------------------------------------- |
| **NestJS**      | Node.js framework with modular architecture |
| **TypeScript**  | Type safety                                 |
| **PostgreSQL**  | Primary database                            |
| **PostGIS**     | Geospatial extension                        |
| **Redis**       | Caching & message queue                     |
| **Prisma ORM**  | Database access with type safety            |
| **Bull**        | Job queue (async AI tasks)                  |
| **Passport.js** | Authentication strategies                   |

### AI Service

| Technology         | Purpose                            |
| ------------------ | ---------------------------------- |
| **Python 3.11+**   | ML ecosystem                       |
| **FastAPI**        | High-performance async API         |
| **Scikit-learn**   | Baseline ML models                 |
| **XGBoost**        | Gradient boosting for tabular data |
| **Prophet (Meta)** | Time-series forecasting            |
| **Pandas**         | Data manipulation                  |
| **Joblib**         | Model persistence                  |

### Infrastructure

| Technology                  | Purpose                               |
| --------------------------- | ------------------------------------- |
| **Docker + Docker Compose** | Containerization                      |
| **Nginx**                   | Reverse proxy                         |
| **GitHub Actions**          | CI/CD                                 |
| **DigitalOcean / Vultr**    | VPS hosting (4GB RAM, 2 vCPU minimum) |

### Why not .NET 8?

- NestJS + TypeScript keeps frontend and backend in the same language ecosystem
- Faster development cycle for MVP
- In-house expertise already MERN-based
- .NET 8 would introduce C# maintenance overhead for marginal benefit at this stage

---

## 12. API Design (High-Level)

### RESTful Endpoints

#### Auth

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/otp/request
POST   /api/v1/auth/otp/verify
```

#### Villages

```
GET    /api/v1/villages                    # List all villages
GET    /api/v1/villages/:id                # Village detail + current inventory
GET    /api/v1/villages/:id/surplus        # What this village has excess of
GET    /api/v1/villages/:id/shortage       # What this village needs
```

#### Inventory

```
GET    /api/v1/inventory                   # All inventory (filterable)
GET    /api/v1/inventory/:villageId        # Inventory by village
POST   /api/v1/inventory                   # Update stock
PUT    /api/v1/inventory/:id
DELETE /api/v1/inventory/:id
```

#### Transactions

```
GET    /api/v1/transactions                # Transaction history
POST   /api/v1/transactions                # Create new transaction
PUT    /api/v1/transactions/:id/status     # Update status
```

#### AI Endpoints

```
GET    /api/v1/ai/recommendations          # All active recommendations
GET    /api/v1/ai/recommendations/:id
POST   /api/v1/ai/recommendations/generate # Trigger AI recommendation run
POST   /api/v1/ai/recommendations/:id/accept  # Accept a recommendation
POST   /api/v1/ai/recommendations/:id/reject  # Decline a recommendation

GET    /api/v1/ai/forecast/:commodityId    # Demand forecast for commodity
GET    /api/v1/ai/pricing/:commodityId     # Optimal price recommendation
```

#### Dashboard / Analytics

```
GET    /api/v1/dashboard/summary           # Key metrics
GET    /api/v1/dashboard/heatmap           # Supply-demand map data
GET    /api/v1/dashboard/trends/:period    # Historical trends
```

---

## 13. MVP Scope

### What's IN for MVP

| Priority | Feature                     | Description                                               |
| -------- | --------------------------- | --------------------------------------------------------- |
| P0       | **Village onboarding**      | Register village, set location (map-based)                |
| P0       | **Stock reporting**         | Input/update inventory per commodity                      |
| P0       | **Supply-demand dashboard** | Table + map view of all villages & their surplus/shortage |
| P0       | **Simple recommendation**   | Rule-based ("Send X from A to B")                         |
| P0       | **Transaction logging**     | Record distribution when it happens                       |
| P1       | **User roles**              | Koperasi admin, BUMDes operator, Government viewer        |
| P1       | **Stock validation**        | Basic sanity check on stock input                         |
| P1       | **Distance calculation**    | Real road distance via routing API                        |
| P1       | **Status indicators**       | Color-coded surplus/shortage badges                       |
| P2       | **Perishability scoring**   | Priority for high-perishability goods                     |

### What's OUT for MVP

| Feature                | Reason                       |
| ---------------------- | ---------------------------- |
| ML predictions         | Needs historical data volume |
| WhatsApp integration   | Post-MVP, but high priority  |
| Mobile app             | Responsive web first         |
| IoT integration        | Long-term                    |
| Marketplace            | Post-MVP                     |
| Smart contracts        | Very long-term               |
| Multi-language         | Indonesian only for MVP      |
| Complex role hierarchy | Simple roles only            |

### MVP Data Seeding

Pre-populate with real data from **Kabupaten Rejang Lebong, Curup**:

- 20+ villages from surrounding area
- 10 commodities relevant to the region (chili, coffee, rice, shallots, etc.)
- 1 cooperative per village (demo-ready)
- 10 sample transactions for dashboard demo

---

## 14. Non-Functional Requirements

### Performance

| Metric                       | Target        |
| ---------------------------- | ------------- |
| Dashboard page load          | < 2s          |
| API response (read)          | < 300ms (p95) |
| Map render (100 pins)        | < 3s          |
| AI recommendation generation | < 5s          |
| Concurrent users (MVP)       | 50            |

### Availability

| Metric             | Target                        |
| ------------------ | ----------------------------- |
| Uptime (MVP)       | 99.5% (≈ 3.5h downtime/month) |
| Maintenance window | 02:00–04:00 WIB               |
| Backup frequency   | Daily (database)              |

### Security

| Requirement        | Implementation                         |
| ------------------ | -------------------------------------- |
| Authentication     | JWT + OTP fallback                     |
| Authorization      | Role-based access control (RBAC)       |
| Data encryption    | HTTPS everywhere                       |
| Secrets management | Environment variables / Docker secrets |
| Rate limiting      | 100 req/min per user                   |

### Scalability

| Aspect             | MVP Target | Future            |
| ------------------ | ---------- | ----------------- |
| Villages           | 50         | 5,000+            |
| Users              | 200        | 50,000+           |
| Daily transactions | 100        | 10,000+           |
| AI inference       | On-demand  | Batch + streaming |

---

## 15. Key Performance Indicators

| KPI                            | Target                                              | Measurement                                                                |
| ------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| Active villages                | 10 (month 1) → 50 (month 6)                         | Registered villages with ≥ 1 stock update/week                             |
| Matched surplus-to-shortage    | 70% of surplus listed gets a recommendation         | AI recommendations generated / total surplus entries                       |
| Recommendation acceptance rate | > 50% of AI recommendations result in a transaction | Transactions with `ai_recommended = true` / total recommendations accepted |
| Average time to match          | < 24 hours from surplus listing to recommendation   | Timestamp delta                                                            |
| User retention (weekly active) | > 60%                                               | Active users in last 7 days / total registered                             |
| Food waste reduction           | 20% reduction in reported waste (post 6 months)     | Self-reported via app                                                      |
| Dashboard load speed           | < 2s for 50 villages                                | Real user monitoring                                                       |

---

## 16. Roadmap & Milestones

```
Q2 2026 (Now — July)
├── Week 1-2:  Foundation
│   ├── Project scaffolding (Next.js + NestJS)
│   ├── Database schema + Prisma models
│   ├── Seed data (Rejang Lebong villages)
│   └── CI/CD pipeline (GitHub Actions)
│
├── Week 3-4:  Core Backend
│   ├── Auth (register/login/OTP)
│   ├── Village CRUD + location
│   ├── Commodity CRUD
│   ├── Inventory CRUD
│   └── PostGIS geospatial queries
│
├── Week 5-6:  Core Frontend
│   ├── Pages: Dashboard, Village Detail, Stock Form
│   ├── Leaflet map integration
│   ├── Surplus/shortage display
│   └── Responsive mobile layout
│
├── Week 7-8:  AI Rule Engine
│   ├── FastAPI service scaffold
│   ├── Rule engine (Phase 1)
│   ├── API integration with NestJS
│   ├── Recommendation display on frontend
│   └── Accept/reject workflow
│
├── Week 9-10: Transactions & Polish
│   ├── Transaction CRUD
│   ├── Transaction history view
│   ├── Dashboard metrics
│   ├── Error handling & loading states
│   └── Basic testing

├── Week 11-12: MVP Launch
│   ├── UAT with pilot cooperatives
│   ├── Bug fixes
│   ├── Documentation
│   └── MVP deployment

Q3 2026 (Post-MVP)
├── WhatsApp notification integration
├── Enhanced rule engine (configurable thresholds)
├── Village demand request form
├── Feedback & iteration from pilot users

Q4 2026
├── ML Phase 2 (XGBoost forecasting)
├── Dynamic pricing recommendations
├── Logistics cost estimation
└── Role-based analytics & reports

2027
├── Advanced AI (RL for routing)
├── Mobile app
├── IoT integration pilot
└── National expansion strategy
```

---

## 17. Future Features (Post-MVP)

| Feature                   | Priority | Description                                                                                             |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 💬 WhatsApp notification  | High     | Real-time stock alerts, recommendations, transaction updates via WA (critical for adoption in villages) |
| 📱 Mobile app             | Medium   | Native mobile experience for farmers                                                                    |
| 🌾 IoT integration        | Low      | Connect weighing scales & sensors for automatic stock reporting                                         |
| 🏪 Marketplace            | Medium   | Peer-to-peer commodity trading between cooperatives                                                     |
| 📊 Smart contract         | Low      | Automated settlement on distribution completion                                                         |
| 🤖 AI chatbot             | Low      | Natural-language query for stock data                                                                   |
| 📡 BMKG integration       | Medium   | Weather-based harvest prediction                                                                        |
| 📈 Multi-region expansion | Medium   | Support for provinces beyond the pilot region                                                           |

---

## 18. Business Value

### Measurable Impact

| Metric                   | Before KoperasiLink | After KoperasiLink (Projected)    |
| ------------------------ | ------------------- | --------------------------------- |
| Post-harvest loss        | 15–25% of yield     | < 10%                             |
| Price volatility         | ± 40% within season | ± 15% (stabilized)                |
| Days to sell surplus     | 7–14 days           | 1–3 days                          |
| Cooperative margin       | 5–10%               | 15–25% (via AI-optimized pricing) |
| Manual coordination time | 4+ hours/week       | < 30 min/week                     |

### Strategic Positioning

**"AI-powered village supply chain and cooperative intelligence platform."**

KoperasiLink is not "just another koperasi app." It sits at the intersection of:

- **Agri-tech** (commodity tracking)
- **Supply chain intelligence** (matching + routing)
- **Gov-tech** (transparent regional food data)
- **AI-for-good** (reducing waste, stabilizing prices)

---

## 19. Risks & Mitigation

| Risk                                   | Likelihood | Impact | Mitigation                                                                    |
| -------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------- |
| Low user adoption (tech literacy)      | High       | High   | WhatsApp-first UX, offline-capable forms, village ambassador training program |
| Data quality (incorrect stock input)   | High       | Medium | Input validation, audit trail, approval workflow for adjustments              |
| Poor internet connectivity             | Medium     | High   | Offline-capable PWA, SMS fallback for critical notifications                  |
| Resistance from middlemen              | Medium     | Medium | Engage BUMDes as allies; position as efficiency tool, not replacement         |
| AI recommendation quality (cold start) | High       | Medium | Start with rule-based; ML only after sufficient data                          |
| Scaling costs (VPS + API calls)        | Low        | Medium | Efficient query design, caching, right-size infrastructure                    |
| Geo-data accuracy                      | Low        | Medium | Use government village boundary data + manual validation pilot                |

---

## 20. Appendix

### A. Glossary

| Term              | Definition                                        |
| ----------------- | ------------------------------------------------- |
| **Koperasi Desa** | Village cooperative, the primary user entity      |
| **BUMDes**        | Badan Usaha Milik Desa (Village-Owned Enterprise) |
| **Surplus**       | Excess stock beyond local demand                  |
| **Shortage**      | Insufficient stock to meet local demand           |
| **PostGIS**       | Geospatial extension for PostgreSQL               |
| **Provinsi**      | Province                                          |
| **Kabupaten**     | District/Regency                                  |
| **Kecamatan**     | Sub-district                                      |
| **Desa**          | Village (lowest administrative level)             |
| **Pangan**        | Food commodities                                  |
| **Dinas**         | Government agency (department)                    |

### B. Commodity Perishability Tiers

| Tier   | Examples                              | Max Distribution Window |
| ------ | ------------------------------------- | ----------------------- |
| High   | Chili, leafy vegetables, fish         | 12–24 hours             |
| Medium | Shallots, garlic, eggs                | 3–5 days                |
| Low    | Rice, coffee beans, dried commodities | 1–3 months              |

### C. References

- **Indonesian Law on Cooperatives:** UU No. 25/1992
- **BPS (Statistics Indonesia):** Agricultural census data
- **BMKG:** Public weather API documentation
- **OSRM Project:** Open Source Routing Machine
- **OSM (OpenStreetMap):** Village boundary & road data in Indonesia

---

_© 2026 Arlys Corporation. This document is confidential and intended for internal use._
