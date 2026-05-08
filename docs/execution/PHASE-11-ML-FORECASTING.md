# PHASE 11: Machine Learning Demand Forecasting

**Duration:** Weeks 13–15  
**Dependencies:** Phase 9 (Transaction data rolling), Phase 10 (Analytics & Base Metrics)  
**Review After:** XGBoost/Prophet model predicts village shortages 7-14 days in advance with >85% accuracy.

---

## Goal

Transition the AI service from a **Deterministic Rule-Based Engine** (current state) into a true **Predictive Machine Learning Platform**. The system will shift from purely reacting to *current* shortages (e.g., stock <= 20%) to proactively predicting *future* shortages based on historical transaction velocity, seasonality, and consumption rates.

## Task 11.1: Data Pipeline & Feature Store

Build an automated ETL pipeline that extracts raw transactional data and converts it into supervised learning features.

**Features to Engineer:**
- `7_day_moving_avg_consumption`
- `30_day_moving_avg_consumption`
- `days_until_stockout_current_velocity`
- `price_volatility_index` (StdDev of prices over 30 days)
- `seasonality_flags` (e.g., Ramadhan, Harvest season)
- `perishability_risk_score`

## Task 11.2: Baseline Statistical Model

Before training deep models, establish a strong baseline using simple statistical forecasting (e.g., ARIMA or Holt-Winters) to set the benchmark for Mean Absolute Error (MAE) and Root Mean Square Error (RMSE).

## Task 11.3: Machine Learning Model Training (XGBoost)

Implement the training pipeline using XGBoost or LightGBM for tabular time-series data.

**File: `services/ai/app/ml/train.py`**
- Connect to the Feature Store.
- Split data into Train (80%) and Test (20%) using time-series split (no data leakage).
- Train the `XGBRegressor` to predict `consumption_next_7_days`.
- Serialize the model using `joblib` (e.g., `model_v1.joblib`).

## Task 11.4: ML Inference API Integration

Modify the FastAPI service to load the `.joblib` model into RAM during the app startup lifecycle (`@asynccontextmanager`).

**Endpoints to Add:**
- `GET /api/v1/forecast/{village_id}/{commodity_id}` → Returns predicted stock trajectory for the next 14 days with upper/lower confidence bounds.
- `GET /api/v1/forecast/high-risk` → Returns a list of villages predicted to face a shortage within 72 hours, triggering early AI Recommendations.

## Task 11.5: Observability & Data Drift Detection

Implement telemetry for the ML models to ensure prediction quality over time.
- Track distribution of predicted values vs actual transaction values.
- Setup alerts for Data Drift (e.g., consumption behavior changes drastically, requiring a model retrain).

## Task 11.6: Retraining Workflow

Create a scheduled CRON job or Airflow DAG to automatically retrain the model at the end of each month using the latest transaction data, evaluate it against a holdout set, and promote it to production if MAE improves.

## Validation Checklist

- [ ] Data pipeline successfully aggregates daily transaction volume.
- [ ] Training script outputs a `.joblib` model file.
- [ ] Model achieves baseline MAE score acceptable for production.
- [ ] FastAPI loads the model globally without blocking the event loop.
- [ ] Inference endpoint responds in < 100ms.
- [ ] Forecast outputs are integrated into the React Dashboard (Time-series chart).
- [ ] The Recommendation Engine prioritizes "Forecasted Shortage" over "Current Shortage".

## Git Checkpoint

```bash
git add .
git commit -m "phase-11: machine learning demand forecasting pipeline and inference"
git tag phase-11
```
