# KoperasiLink — Database Architecture & Planning

**Version:** 1.0 | **Date:** 2026-05-07

---

## 1. Domain-Based Schema Planning

### Schema Domains

```
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL 16 + PostGIS 3.4                │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │  IDENTITY   │  │  COMMERCE   │  │  INTELLIGENCE        │  │
│  │             │  │             │  │                      │  │
│  │  users      │  │  inventory  │  │  ai_recommendations  │  │
│  │  sessions   │  │  transactions│ │  ai_rules            │  │
│  │  roles      │  │  pricing_   │  │  prediction_logs     │  │
│  │             │  │  history    │  │  feature_snapshots   │  │
│  └─────────────┘  └─────────────┘  └──────────────────────┘  │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │  GEOGRAPHY  │  │  REFERENCE  │  │  AUDIT               │  │
│  │             │  │             │  │                      │  │
│  │  villages   │  │  commodities│  │  audit_logs          │  │
│  │  village_   │  │  categories │  │  event_store         │  │
│  │  routes     │  │  units      │  │  data_snapshots      │  │
│  │  regions    │  │             │  │                      │  │
│  └─────────────┘  └─────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Schema Definition

### 2.1 Core Tables

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- trigram for fuzzy search

-- ============================================
-- GEOGRAPHY DOMAIN
-- ============================================

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('provinsi', 'kabupaten', 'kecamatan')),
    parent_id UUID REFERENCES regions(id),
    coordinates GEOGRAPHY(POLYGON, 4326),  -- boundary polygon
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,              -- BPS village code
    subdistrict VARCHAR(100) NOT NULL,    -- kecamatan
    district VARCHAR(100) NOT NULL,       -- kabupaten
    province VARCHAR(100) NOT NULL DEFAULT 'Bengkulu',
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    population INTEGER,
    main_commodities TEXT[],
    has_cold_storage BOOLEAN DEFAULT FALSE,
    contact_phone VARCHAR(20),
    region_id UUID REFERENCES regions(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE village_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_a_id UUID NOT NULL REFERENCES villages(id),
    village_b_id UUID NOT NULL REFERENCES villages(id),
    distance_km NUMERIC(8,2) NOT NULL,
    travel_time_min INTEGER,
    road_condition VARCHAR(20) CHECK (road_condition IN ('good', 'fair', 'poor', 'impassable')),
    cost_per_kg NUMERIC(10,2),
    route_geometry GEOGRAPHY(LINESTRING, 4326),  -- actual road path
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(village_a_id, village_b_id)
);

-- ============================================
-- IDENTITY DOMAIN
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(30) NOT NULL CHECK (role IN (
        'koperasi_admin', 'bumdes_operator', 'distributor', 'government', 'farmer', 'system_admin'
    )),
    village_id UUID REFERENCES villages(id),
    auth_provider VARCHAR(20) DEFAULT 'otp' CHECK (auth_provider IN ('otp', 'google', 'password')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFERENCE DOMAIN
-- ============================================

CREATE TABLE commodities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    name_local VARCHAR(100),              -- local name (bahasa daerah)
    category VARCHAR(30) NOT NULL CHECK (category IN (
        'vegetables', 'fruits', 'grains', 'spices', 'livestock', 'fishery', 'processed', 'other'
    )),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('kg', 'ton', 'ikat', 'butir', 'ekor', 'liter')),
    perishability VARCHAR(10) NOT NULL CHECK (perishability IN ('high', 'medium', 'low')),
    shelf_life_days INTEGER,
    icon_url VARCHAR(500),
    min_transport_temp NUMERIC(4,1),      -- for cold chain (future)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMERCE DOMAIN
-- ============================================

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID NOT NULL REFERENCES villages(id),
    commodity_id UUID NOT NULL REFERENCES commodities(id),
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    capacity NUMERIC(12,2) CHECK (capacity >= 0),
    min_stock NUMERIC(12,2) DEFAULT 0,    -- threshold for shortage alert
    surplus_threshold NUMERIC(12,2),      -- threshold for surplus flag
    harvest_date DATE,
    next_harvest_date DATE,
    unit_price NUMERIC(12,2) CHECK (unit_price >= 0),
    quality_grade VARCHAR(10) CHECK (quality_grade IN ('A', 'B', 'C')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(village_id, commodity_id)
);

CREATE TABLE pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID NOT NULL REFERENCES villages(id),
    commodity_id UUID NOT NULL REFERENCES commodities(id),
    price NUMERIC(12,2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'api', 'computed'))
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_village_id UUID NOT NULL REFERENCES villages(id),
    to_village_id UUID NOT NULL REFERENCES villages(id),
    commodity_id UUID NOT NULL REFERENCES commodities(id),
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    shipping_cost NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'in_transit', 'completed', 'cancelled'
    )),
    ai_recommended BOOLEAN DEFAULT FALSE,
    recommendation_id UUID REFERENCES ai_recommendations(id),
    notes TEXT,
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTELLIGENCE DOMAIN
-- ============================================

CREATE TABLE ai_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(30) NOT NULL,       -- 'surplus_match', 'price_alert', 'shortage_warning'
    conditions JSONB NOT NULL,            -- configurable rule conditions
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    village_id UUID REFERENCES villages(id),  -- NULL = global rule
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_village_id UUID NOT NULL REFERENCES villages(id),
    target_village_id UUID NOT NULL REFERENCES villages(id),
    commodity_id UUID NOT NULL REFERENCES commodities(id),
    recommended_quantity NUMERIC(12,2) NOT NULL,
    estimated_profit NUMERIC(12,2),
    estimated_shipping_cost NUMERIC(12,2),
    priority_score NUMERIC(5,3) NOT NULL,  -- 0.000 to 1.000
    distance_km NUMERIC(8,2),
    source_price NUMERIC(12,2),
    target_price NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'accepted', 'rejected', 'expired', 'converted'
    )),
    triggered_by VARCHAR(20) NOT NULL CHECK (triggered_by IN ('rule_engine', 'ml_model', 'manual')),
    model_version VARCHAR(50),
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prediction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(50) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    input_features JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confidence NUMERIC(5,4),
    actual_outcome JSONB,                 -- filled later for evaluation
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT DOMAIN
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,          -- 'inventory.update', 'transaction.create', etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Indexing Strategy

```sql
-- GEOGRAPHY: Geospatial indexes
CREATE INDEX idx_villages_coordinates ON villages USING GIST (coordinates);
CREATE INDEX idx_village_routes_geometry ON village_routes USING GIST (route_geometry);
CREATE INDEX idx_villages_district ON villages (district);
CREATE INDEX idx_villages_status ON villages (status) WHERE status = 'active';

-- COMMERCE: Inventory lookups
CREATE INDEX idx_inventory_village ON inventory (village_id);
CREATE INDEX idx_inventory_commodity ON inventory (commodity_id);
CREATE INDEX idx_inventory_village_commodity ON inventory (village_id, commodity_id);
CREATE INDEX idx_inventory_surplus ON inventory (commodity_id, current_stock) 
    WHERE current_stock > 0;  -- partial index for surplus queries
CREATE INDEX idx_inventory_last_updated ON inventory (last_updated);

-- COMMERCE: Transaction lookups
CREATE INDEX idx_transactions_from_village ON transactions (from_village_id);
CREATE INDEX idx_transactions_to_village ON transactions (to_village_id);
CREATE INDEX idx_transactions_commodity ON transactions (commodity_id);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);
CREATE INDEX idx_transactions_ai ON transactions (ai_recommended) WHERE ai_recommended = TRUE;

-- INTELLIGENCE: Recommendation lookups
CREATE INDEX idx_recommendations_status ON ai_recommendations (status);
CREATE INDEX idx_recommendations_source ON ai_recommendations (source_village_id);
CREATE INDEX idx_recommendations_target ON ai_recommendations (target_village_id);
CREATE INDEX idx_recommendations_commodity ON ai_recommendations (commodity_id);
CREATE INDEX idx_recommendations_created ON ai_recommendations (created_at DESC);

-- ANALYTICS: Time-series indexes
CREATE INDEX idx_pricing_history_time ON pricing_history (commodity_id, recorded_at DESC);
CREATE INDEX idx_prediction_logs_model ON prediction_logs (model_name, created_at DESC);

-- AUDIT: Audit lookups
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);

-- TEXT SEARCH: Fuzzy search
CREATE INDEX idx_villages_name_trgm ON villages USING GIN (name gin_trgm_ops);
CREATE INDEX idx_commodities_name_trgm ON commodities USING GIN (name gin_trgm_ops);
```

---

## 4. PostGIS Usage Strategy

### Core Queries

```sql
-- 1. Find villages within radius (km)
SELECT id, name, 
    ST_Distance(coordinates::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / 1000 AS distance_km
FROM villages
WHERE ST_DWithin(coordinates::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius_meters)
ORDER BY distance_km;

-- 2. Precompute distance matrix between all village pairs (run on seed/update)
INSERT INTO village_routes (village_a_id, village_b_id, distance_km)
SELECT a.id, b.id, 
    ST_Distance(a.coordinates::geography, b.coordinates::geography) / 1000
FROM villages a
CROSS JOIN villages b
WHERE a.id < b.id  -- avoid duplicates
ON CONFLICT (village_a_id, village_b_id) DO UPDATE SET distance_km = EXCLUDED.distance_km;

-- 3. Heatmap aggregation by grid cells
SELECT 
    ST_SnapToGrid(coordinates::geometry, 0.1) AS grid_cell,  -- ~11km grid
    commodity_id,
    SUM(current_stock) AS total_stock,
    COUNT(*) AS village_count
FROM villages v
JOIN inventory i ON v.id = i.village_id
GROUP BY grid_cell, commodity_id;
```

---

## 5. Partitioning Preparation

```sql
-- Partition transactions by month (enable when volume > 100K rows)
-- Preparation: design table as partitioned from start
CREATE TABLE transactions_partitioned (
    LIKE transactions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Monthly partitions (created by cron job or migration)
-- CREATE TABLE transactions_y2026m07 PARTITION OF transactions_partitioned
--     FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Partition pricing_history by month (high-volume time-series)
-- Partition audit_logs by month (append-only, high volume)
-- Partition prediction_logs by month (ML analytics)
```

---

## 6. Audit Logging Strategy

### Trigger-Based Audit

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (
        current_setting('app.current_user_id', TRUE)::UUID,
        TG_ARGV[0],
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER audit_inventory AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('inventory.change');
    
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func('transaction.change');
```

---

## 7. Analytics Readiness

### Materialized Views for Dashboard

```sql
-- Supply-demand summary (refreshed every 5 minutes via cron)
CREATE MATERIALIZED VIEW mv_supply_demand_summary AS
SELECT 
    v.id AS village_id,
    v.name AS village_name,
    v.district,
    c.id AS commodity_id,
    c.name AS commodity_name,
    c.perishability,
    i.current_stock,
    i.capacity,
    i.min_stock,
    i.unit_price,
    CASE 
        WHEN i.current_stock > COALESCE(i.surplus_threshold, i.capacity * 0.7) THEN 'surplus'
        WHEN i.current_stock < COALESCE(i.min_stock, i.capacity * 0.2) THEN 'shortage'
        ELSE 'balanced'
    END AS status,
    i.last_updated
FROM inventory i
JOIN villages v ON i.village_id = v.id
JOIN commodities c ON i.commodity_id = c.id
WHERE v.status = 'active';

CREATE UNIQUE INDEX ON mv_supply_demand_summary (village_id, commodity_id);

-- Transaction analytics (refreshed hourly)
CREATE MATERIALIZED VIEW mv_transaction_analytics AS
SELECT 
    date_trunc('day', t.created_at) AS day,
    t.commodity_id,
    c.name AS commodity_name,
    COUNT(*) AS transaction_count,
    SUM(t.quantity) AS total_quantity,
    SUM(t.total_amount) AS total_value,
    AVG(t.unit_price) AS avg_price,
    COUNT(*) FILTER (WHERE t.ai_recommended) AS ai_driven_count,
    COUNT(*) FILTER (WHERE t.status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE t.status = 'cancelled') AS cancelled_count
FROM transactions t
JOIN commodities c ON t.commodity_id = c.id
GROUP BY day, t.commodity_id, c.name;
```

---

## 8. Event Sourcing Consideration

For MVP, we use **audit log + materialized views** instead of full event sourcing. Event sourcing is planned for Phase 8 when we need:

| Capability | Current Approach | Event Sourcing (Future) |
|-----------|-----------------|------------------------|
| Audit trail | `audit_logs` table | Event store |
| State reconstruction | Snapshot tables | Event replay |
| Cross-service sync | REST + cache invalidation | Event bus (Kafka/NATS) |
| Analytics | Materialized views | Event stream processing |

### Migration Path
1. **Now:** Audit triggers → audit_logs
2. **Phase 5:** Add `event_store` table alongside audit_logs
3. **Phase 8:** Migrate to dedicated event bus, event_store becomes source of truth
