# KoperasiLink — AI Architecture & Evolution Strategy

**Version:** 1.0 | **Date:** 2026-05-07

---

## 1. Why AI Should Initially Be Rule-Based

### Technical Rationale
1. **Cold-start problem** — ML models require minimum 6 months of transaction data across 20+ villages. At launch, we have zero real transactions.
2. **Interpretability** — Rural cooperative managers need to understand *why* a recommendation was made. "Send chili from A to B because A has surplus and B has shortage within 50km" is immediately comprehensible. An ML confidence score is not.
3. **Debuggability** — Rule-based logic can be traced step-by-step. ML prediction failures require specialized tooling.
4. **Configurability** — Each cooperative may have different distance limits, surplus thresholds, and commodity priorities. Rules stored in DB allow per-cooperative customization without retraining.
5. **Correctness guarantee** — Rules are deterministic. Given the same inputs, they produce the same output. This builds trust during pilot phase.
6. **Zero infrastructure overhead** — No model training pipeline, no GPU, no MLflow. Just Python conditional logic.

### When to Transition to ML
| Signal | Threshold | Action |
|--------|-----------|--------|
| Transaction volume | > 500 transactions | Begin feature engineering |
| Active villages | > 20 villages with weekly updates | Start data pipeline |
| Data history | > 6 months continuous | Train first XGBoost model |
| Rule engine accuracy plateau | < 60% acceptance rate | A/B test ML vs rules |

---

## 2. Data Collection Evolution

### Phase 1: Structured Collection (MVP)
```
Data Sources:
├── Manual stock input (cooperative operators)
├── Transaction records (every distribution)
├── Village metadata (location, population, commodities)
├── Commodity metadata (perishability, category, unit)
└── Recommendation feedback (accept/reject with reason)
```

### Phase 2: Enriched Collection (Post-MVP)
```
Data Sources (additions):
├── Price history (daily snapshots from inventory)
├── Seasonal calendars (planting/harvest dates)
├── Weather data (BMKG API integration)
├── Holiday calendar (national + regional)
├── Demand requests (villages posting what they need)
└── User behavior (dashboard usage patterns)
```

### Phase 3: Automated Collection (Scale)
```
Data Sources (additions):
├── IoT sensors (warehouse weight scales)
├── Market price feeds (national price board API)
├── Road condition updates (community reports)
├── Satellite imagery (crop health — long term)
└── WhatsApp interaction logs (demand signals)
```

### Data Quality Strategy
| Dimension | Rule | Implementation |
|-----------|------|---------------|
| Completeness | No null required fields | DB constraints + API validation |
| Accuracy | Stock within capacity bounds | `CHECK (current_stock <= capacity AND current_stock >= 0)` |
| Freshness | Flag stale inventory (> 7 days) | `last_updated` comparison, UI warning |
| Consistency | Cross-validate with transactions | Audit job: `stock_after_tx = stock_before - quantity` |
| Deduplication | Unique constraints | `UNIQUE(village_id, commodity_id)` on inventory |

---

## 3. ML Pipeline Evolution

### Architecture

```
┌─────────────────────────────────────────────────┐
│                ML PIPELINE                       │
│                                                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Feature  │──▶│ Training │──▶│ Evaluation   │ │
│  │ Store    │   │ Pipeline │   │              │ │
│  └──────────┘   └──────────┘   └──────┬───────┘ │
│       ▲                               │          │
│       │                        passes threshold? │
│       │                               │          │
│  ┌────┴─────┐              ┌──────────▼───────┐ │
│  │ Raw Data │              │ Model Registry   │ │
│  │ (PG)     │              │ (versioned)      │ │
│  └──────────┘              └──────────┬───────┘ │
│                                       │          │
│                            ┌──────────▼───────┐ │
│                            │ Serving Layer    │ │
│                            │ (FastAPI)        │ │
│                            └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Model Specifications

| Model | Type | Input Features | Output | Training Frequency |
|-------|------|---------------|--------|-------------------|
| **Demand Predictor** | XGBoost | historical_demand, season, holiday, weather, population, day_of_week | quantity_needed (float) | Weekly |
| **Seasonal Analyzer** | Prophet | time_series(commodity_price, date) | trend + seasonal_component | Monthly |
| **Price Predictor** | Random Forest | stock_level, demand, season, regional_avg_price, transport_cost | optimal_price (float) | Weekly |
| **Shortage Classifier** | Logistic Regression | current_stock, consumption_rate, days_to_harvest, population | shortage_risk (0-1) | Weekly |

---

## 4. Feature Engineering Strategy

### Feature Categories

```python
# Static features (computed once, updated on change)
village_features = {
    'population': int,
    'num_commodities': int,
    'avg_capacity': float,
    'district_code': str,  # one-hot encoded
    'has_cold_storage': bool,
}

# Time-series features (computed per prediction window)
temporal_features = {
    'avg_stock_7d': float,
    'avg_stock_30d': float,
    'stock_volatility_30d': float,
    'transaction_count_7d': int,
    'transaction_count_30d': int,
    'avg_price_7d': float,
    'price_change_pct_7d': float,
    'days_since_last_harvest': int,
    'days_to_next_harvest': int,
}

# External features (from API integrations)
external_features = {
    'rainfall_7d_avg': float,
    'temperature_7d_avg': float,
    'is_holiday': bool,
    'is_ramadan': bool,
    'national_price_index': float,
}

# Interaction features (computed)
interaction_features = {
    'stock_to_capacity_ratio': float,  # current_stock / capacity
    'demand_supply_gap': float,        # demand - supply
    'price_vs_regional_avg': float,    # local_price / regional_avg
    'perishability_urgency': float,    # stock * (1 / shelf_life_days)
}
```

---

## 5. Model Lifecycle Strategy

```
┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐
│ Develop  │───▶│  Validate │───▶│  Deploy    │───▶│ Monitor  │
│          │    │           │    │  (Shadow)  │    │          │
│ - Train  │    │ - Backtest│    │ - A/B test │    │ - Drift  │
│ - Tune   │    │ - Cross-  │    │ - Canary   │    │ - Perf   │
│ - Eval   │    │   validate│    │ - Promote  │    │ - Alerts │
└──────────┘    └───────────┘    └────────────┘    └─────┬────┘
      ▲                                                   │
      │                    Retrain trigger                 │
      └───────────────────────────────────────────────────┘
```

### Retraining Strategy
| Trigger | Condition | Action |
|---------|-----------|--------|
| **Scheduled** | Weekly (Sunday 02:00 WIB) | Full retrain on latest 6 months |
| **Performance** | MAE > baseline × 1.3 | Alert → retrain → evaluate |
| **Data drift** | Feature distribution shift (KS test p < 0.05) | Alert → investigate → retrain |
| **Concept drift** | Prediction accuracy drop > 15% over 7 days | Urgent retrain + model review |

---

## 6. AI Observability Strategy

### Metrics to Track
| Metric | Type | Alert Threshold |
|--------|------|----------------|
| Prediction latency (p95) | Histogram | > 2s |
| Recommendation acceptance rate | Gauge | < 40% (7-day rolling) |
| Rule engine execution count | Counter | — |
| ML model inference count | Counter | — |
| Feature computation errors | Counter | > 5/hour |
| Model prediction confidence | Histogram | — |
| Data staleness (villages not updated) | Gauge | > 30% villages stale > 7d |

### Prediction Logging
```python
# Every prediction is logged for analysis
prediction_log = {
    "prediction_id": "uuid",
    "model_version": "demand_v1.2.3",
    "input_features": {...},
    "prediction": 2.5,
    "confidence": 0.82,
    "actual_outcome": null,  # filled later
    "latency_ms": 45,
    "timestamp": "2026-07-15T10:30:00Z"
}
```

---

## 7. Future AI Evolution (12+ months)

| Capability | Model/Approach | Prerequisites |
|-----------|---------------|--------------|
| **Multi-village routing** | Reinforcement Learning (PPO/SAC) | Route data, cost data, 1000+ transactions |
| **Supply chain topology** | Graph Neural Network | Village relationship graph, 50+ villages |
| **Long-range forecast** | Time-series Transformer | 12+ months data, external data feeds |
| **Anomaly detection** | Isolation Forest / Autoencoder | Baseline behavior established |
| **NLP demand signals** | Fine-tuned LLM | WhatsApp message corpus |
| **Image-based grading** | CNN (MobileNet) | Commodity photo dataset |
