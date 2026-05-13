# 🌾 KoperasiLink

**AI-powered village supply chain intelligence platform**

KoperasiLink is a distributed supply chain platform designed to connect rural cooperatives (Koperasi Desa / BUMDes) into a unified, data-driven network.
It enables real-time visibility, intelligent distribution, and predictive planning across villages.

---

## 🚀 Overview

KoperasiLink transforms fragmented village-level commodity data into a **coordinated inter-village economy**.

It addresses core rural supply chain challenges:

- Localized oversupply leading to waste and price drops
- Neighboring shortages causing price spikes
- Lack of visibility across villages
- Manual and inefficient distribution
- Absence of predictive insights

KoperasiLink provides a centralized system powered by real-time data and AI.

---

## 🎯 Key Capabilities

- **Real-Time Inventory Tracking**
  Movement-based inventory system with full audit trail

- **Supply-Demand Matching**
  Automatic detection of surplus and shortage across villages

- **AI Recommendation Engine**
  Intelligent matching between supply and demand with prioritization

- **Geospatial Awareness**
  Distance-based logistics calculation using geolocation data

- **Inter-Village Transactions**
  Structured workflow for commodity transfers

- **Master Data Management**
  Standardized commodities, units, and regions

- **Analytics & Forecasting**
  Time-series data for demand prediction and planning

---

## 🧠 Architecture

KoperasiLink follows a modular, service-oriented architecture.

- **Web Application**
  Next.js (React, TypeScript)

- **Backend API**
  NestJS (TypeScript)

- **Database**
  PostgreSQL with PostGIS

- **AI Service**
  FastAPI (Python)

- **Queue & Cache**
  Redis + Bull

---

## 🧱 Monorepo Structure

```bash
koperasilink/
│
├── apps/
│   ├── web/                # Frontend (Next.js)
│   └── api/                # Backend (NestJS)
│
├── services/
│   └── ai/                 # AI Intelligence Service (FastAPI)
│
├── packages/
│   ├── database/           # Prisma schema and migrations
│   ├── shared-types/       # Shared TypeScript interfaces
│   └── validation/         # Shared Zod/Class-Validator schemas
│
├── infra/
│   └── docker/             # Docker configuration (Postgres, Redis)
│
├── docs/
│   ├── architecture/       # Technical design docs
│   └── execution/          # Development phase logs
│
├── turbo.json              # Turborepo config
├── package.json            # Workspace root config
└── .env.example            # Root environment template
```

---

## 🗄️ Data Model (Core Concepts)

KoperasiLink uses a **movement-based inventory system**.

### Key Relationships

```text
Village
  └── Inventory
        └── InventoryMovement

Commodity
  ├── unitId → UnitOfMeasure
  ├── categoryId → CommodityCategory
  └── Inventory

Transaction
  ├── sourceVillageId → Village
  ├── targetVillageId → Village
  └── commodityId → Commodity

User
  └── villageId → Village
```

---

### Core Entities

**Village**

- Represents a cooperative node
- Includes geolocation for logistics

**Commodity (Master Data)**

- Standardized product catalog
- Enforces consistency across system

**Inventory**

- Current stock (derived / cached)
- Linked to village and commodity

**InventoryMovement (Source of Truth)**

- Immutable log of stock changes
- Types: IN, OUT, ADJUSTMENT

**Transaction**

- Inter-village commodity transfer
- Lifecycle-based tracking

**User**

- Scoped to a single village
- Role-based access control

---

## 🔄 Data Flow

1. Operator records stock movement
2. System logs event in InventoryMovement
3. Inventory is recalculated
4. System detects surplus or shortage
5. AI service processes data
6. Recommendations are generated

---

## 🤖 AI Layer

### Current Capabilities

- Shortage detection
- Supply-demand matching

### Planned Enhancements

- Demand forecasting (Prophet, XGBoost)
- Consumption trend modeling
- Predictive redistribution
- Logistics optimization

---

## ⚠️ Design Principles

- **Event-Driven Inventory**
  No direct stock overwrite

- **Strict Master Data**
  No free-text commodity input

- **Multi-Tenant by Village**
  Data scoped per village

- **Data Consistency First**
  AI depends on clean, normalized data

---

## 🛠 Tech Stack

### Frontend

- Next.js
- TypeScript
- TailwindCSS
- ShadCN UI

### Backend

- NestJS
- Prisma ORM

### Database

- PostgreSQL
- PostGIS

### AI Service

- FastAPI
- Scikit-learn
- XGBoost
- Prophet

### Infrastructure

- Docker
- Redis
- Bull Queue

---

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker
- Python 3.11+

---

### Installation

```bash
git clone <repository-url>
cd koperasilink
pnpm install
```

---

### Environment Setup

```bash
cp .env.example .env
```

Configure:

- DATABASE_URL
- REDIS_URL

---

### Start Infrastructure

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

---

### Database Setup

```bash
pnpm --filter @koperasilink/api prisma db push
pnpm --filter @koperasilink/api prisma db seed
```

---

## 🛠 Database Management Flow

KoperasiLink uses Prisma ORM. Follow this workflow for any schema changes:

### 1. Modify Schema
Update the Prisma schema file at `packages/database/prisma/schema.prisma`.

### 2. Generate SQL Migration
If you need versioned SQL migrations (recommended for production), use the `migrate diff` command:

```bash
# Generate the SQL diff between your current DB and the new schema
pnpm --filter @koperasilink/api prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel packages/database/prisma/schema.prisma \
  --script > packages/database/prisma/migrations/$(date +%Y%m%d%H%M)_<name>/migration.sql
```

### 3. Apply Changes
For local development, you can sync the database quickly:

```bash
pnpm --filter @koperasilink/api prisma db push
```

For production or when using generated SQL files, apply the migration manually or via `psql`:

```bash
# Run specific migration file
psql "$DATABASE_URL" -f packages/database/prisma/migrations/<folder>/migration.sql
```

### 4. Sync Prisma Client
Always regenerate the Prisma Client after schema changes:

```bash
pnpm --filter @koperasilink/api prisma generate
```

---

### Run Development

```bash
pnpm dev
```

Services:

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

---

## 🧪 Testing

- Unit tests for services
- Integration tests for API
- Migration validation
- Data consistency checks

---

## 📈 Scalability

- Service separation (API, AI)
- Queue-based processing
- Horizontal scaling ready
- Multi-region deployment ready

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 🧭 Roadmap

- Mobile app for field operators
- Government dashboard (food security)
- Dynamic pricing engine
- Route optimization
- Integration with logistics providers

---

## 📄 License

MIT License

---

## 🌍 Impact

KoperasiLink aims to:

- reduce food waste
- stabilize commodity prices
- improve rural supply chain efficiency
- empower village economies

---

## 🤖 Recommendation Next Feature

KoperasiLink includes an intelligent recommendation engine that automatically connects surplus villages with those experiencing shortages.

This feature is the core of the platform’s value, enabling **data-driven inter-village distribution**.

---

### 🎯 Objective

- Eliminate manual coordination between villages
- Reduce food waste from surplus
- Prevent shortages before escalation
- Optimize distribution efficiency

---

### ⚙️ How It Works

The engine continuously analyzes:

- Current inventory (derived from movement logs)
- Monthly demand per village
- Surplus vs shortage status
- Distance between villages
- Estimated logistics cost

---

### 🧠 Matching Logic

For each shortage:

1. Identify villages with surplus of the same commodity
2. Rank candidates based on:
   - distance (closer is prioritized)
   - available stock
   - demand urgency

3. Calculate estimated delivery feasibility
4. Generate prioritized recommendations

---

### 📊 Example Output

```json
{
  "commodity": "cabai merah",
  "targetVillage": "Talang Rimbo Baru",
  "recommendedSources": [
    {
      "village": "Sambirejo",
      "availableStock": 450,
      "distanceKm": 8.2,
      "estimatedCost": 45000,
      "score": 0.89
    },
    {
      "village": "Air Meles Bawah",
      "availableStock": 150,
      "distanceKm": 3.5,
      "estimatedCost": 25000,
      "score": 0.85
    }
  ]
}
```

---

### 🚀 Current Capabilities

- Rule-based matching engine
- Real-time surplus vs shortage detection
- Distance-aware recommendation

---

### 🔮 Future Enhancements

- Predictive recommendations (before shortage occurs)
- Profit optimization (margin-based routing)
- Multi-hop distribution planning
- Integration with logistics providers
- AI-based scoring (ML model replacing rule engine)

---

### ⚠️ Dependency

The recommendation engine relies heavily on:

- clean master data
- consistent unit of measure
- movement-based inventory logs
- accurate village geolocation

Any inconsistency will directly impact recommendation quality.

---

**KoperasiLink is building the digital infrastructure for rural supply chain intelligence.**
