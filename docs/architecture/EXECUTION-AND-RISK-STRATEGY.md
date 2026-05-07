# KoperasiLink — MVP Execution & Risk Strategy

**Version:** 1.0 | **Date:** 2026-05-07

---

## 1. MVP Execution Strategy

### 1.1 Sprint Mapping (12-Week MVP)

| Sprint | Week | Phase | Goal | Key Deliverables |
|--------|------|-------|------|-----------------|
| **S1** | 1–2 | Phase 0 | Foundation | Monorepo, DB schema, Docker, CI, seed data |
| **S2** | 3–4 | Phase 1 | Core CRUD | Auth, RBAC, Village CRUD, Commodity CRUD, Inventory CRUD |
| **S3** | 5–6 | Phase 2 | Map + Dashboard | Leaflet map, supply-demand indicators, dashboard metrics |
| **S4** | 7–8 | Phase 3 | AI Engine | FastAPI service, rule engine, recommendations, accept/reject |
| **S5** | 9–10 | Phase 4 | Transactions | Transaction lifecycle, status workflow, stock adjustment |
| **S6** | 11–12 | Launch | MVP Ship | UAT, bug fixes, deployment, documentation |

### 1.2 MVP Definition of Done

Every sprint deliverable must satisfy:
- [ ] Feature works end-to-end (frontend → backend → database)
- [ ] API endpoint documented (request/response examples)
- [ ] Unit tests for business logic (>60% coverage target)
- [ ] Responsive on mobile viewport (360px+)
- [ ] Error states handled (loading, empty, error UI)
- [ ] Code reviewed and merged to `develop`

### 1.3 MVP Launch Checklist

- [ ] All P0 features functional and tested
- [ ] 20+ villages seeded with real Rejang Lebong data
- [ ] 10 commodities configured
- [ ] Rule engine generating valid recommendations
- [ ] SSL configured, HTTPS enforced
- [ ] Backup script running (daily)
- [ ] Monitoring alerts configured
- [ ] Error tracking (Sentry) active
- [ ] UAT completed with 3+ cooperatives
- [ ] Runbook documented (deployment, incident, backup)

---

## 2. Post-MVP Expansion Strategy

### 2.1 Immediate Post-MVP (Month 4–6)

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| **P0** | WhatsApp notifications | 2 weeks | Critical for adoption |
| **P0** | Configurable rule thresholds (admin UI) | 1 week | Cooperative customization |
| **P1** | Village demand request form | 1 week | Demand signal collection |
| **P1** | Enhanced dashboard (trend charts) | 1 week | Better decision-making |
| **P1** | Pilot feedback iteration | Ongoing | Product-market fit |

### 2.2 Growth Phase (Month 6–9)

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|-------------|
| **P0** | ML Phase 2 (XGBoost forecasting) | 4 weeks | 6 months transaction data |
| **P1** | Dynamic pricing recommendations | 2 weeks | ML model operational |
| **P1** | Logistics cost estimation (OSRM) | 2 weeks | Route data |
| **P2** | Role-based analytics & reports | 2 weeks | Government user onboarding |
| **P2** | Export to Excel/PDF | 1 week | Analytics endpoints |

### 2.3 Scale Phase (Month 9–12)

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|-------------|
| **P1** | Multi-kabupaten support | 4 weeks | Tenant isolation design |
| **P1** | Mobile app (React Native) | 8 weeks | Stable API |
| **P2** | Advanced AI (RL routing) | 6 weeks | 1000+ transactions |
| **P2** | BMKG weather integration | 2 weeks | API access |
| **P3** | IoT pilot (warehouse scales) | 4 weeks | Hardware procurement |

---

## 3. Risk & Technical Debt Strategy

### 3.1 Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|-------------|--------|------------|-------|
| R1 | Low user adoption (tech literacy) | High | Critical | WhatsApp-first UX, village ambassador program, simplified forms | Product |
| R2 | Poor data quality (incorrect stock) | High | High | Input validation, bounds checking, audit trail, approval workflow | Backend |
| R3 | Internet connectivity issues | Medium | High | PWA offline mode, service worker caching, SMS fallback | Frontend |
| R4 | AI cold-start (no training data) | High | Medium | Rule-based first, pre-seeded demo data, gradual ML transition | AI |
| R5 | PostGIS query performance | Low | Medium | Spatial indexes, distance matrix pre-computation, caching | Backend |
| R6 | Single VPS failure | Medium | Critical | Automated backups, documented restore procedure, 2-hour RTO | DevOps |
| R7 | Scope creep during MVP | High | High | Strict P0/P1 prioritization, sprint gate reviews | Tech Lead |
| R8 | OTP delivery reliability | Medium | High | Multiple providers (Twilio + local), WhatsApp OTP fallback | Backend |
| R9 | Map tile loading in rural areas | Medium | Medium | Tile caching, offline tile packs for pilot region | Frontend |
| R10 | Team capacity (4.5 people) | Medium | Medium | Ruthless prioritization, shared components, code generation | Tech Lead |

### 3.2 Technical Debt Budget

**Rule:** Maximum 20% of each sprint may be allocated to tech debt. Track debt items explicitly.

| Category | Example Items | Priority |
|----------|--------------|----------|
| **Testing** | Add integration tests for transaction workflow | Sprint 5+ |
| **Performance** | Add database query logging and slow query detection | Sprint 4+ |
| **Security** | Implement rate limiting on all endpoints | Sprint 3 |
| **Documentation** | API reference auto-generation from OpenAPI | Sprint 4 |
| **Refactoring** | Extract geospatial queries into shared repository | Sprint 3 |
| **Observability** | Add request tracing (correlation IDs) | Sprint 4 |

### 3.3 Debt Resolution Strategy

```
Sprint N:
  80% feature work → 20% tech debt
  
Sprint N (release sprint):
  60% bug fixes → 30% tech debt → 10% polish

Quarterly:
  1 sprint fully dedicated to tech debt + performance
```

---

## 4. Scalability Preparation

### 4.1 Scale Triggers & Actions

| Metric | Trigger | Action |
|--------|---------|--------|
| API p95 latency | > 500ms sustained 1 hour | Add API replica, review slow queries |
| DB CPU | > 70% sustained | Separate DB to dedicated VPS, add PgBouncer |
| Redis memory | > 80% | Increase instance, review TTL policies |
| Disk usage | > 80% | Expand volume, archive old audit logs |
| AI inference time | > 5s (p95) | Dedicated AI VPS, batch processing |
| Concurrent users | > 100 | Load balancer + 2 API replicas |
| Villages | > 200 | Partition transactions table, optimize spatial indexes |

### 4.2 Data Growth Projections

| Table | Month 1 | Month 6 | Month 12 | Year 2 |
|-------|---------|---------|----------|--------|
| villages | 25 | 100 | 500 | 2,000 |
| users | 50 | 400 | 2,000 | 10,000 |
| inventory | 250 | 1,000 | 5,000 | 20,000 |
| transactions | 100 | 3,000 | 20,000 | 100,000 |
| recommendations | 200 | 5,000 | 30,000 | 150,000 |
| pricing_history | 500 | 18,000 | 100,000 | 500,000 |
| audit_logs | 1,000 | 30,000 | 200,000 | 1,000,000 |

### 4.3 Performance Benchmarks (MVP Targets)

| Operation | Target | Method |
|-----------|--------|--------|
| Dashboard load | < 2s | SSR + Redis cache |
| Village list (50 villages) | < 300ms | Indexed query + pagination |
| Map render (100 pins) | < 3s | Client-side clustering |
| Inventory update | < 200ms | Direct write + async cache invalidation |
| AI recommendation (50 villages) | < 5s | Async via BullMQ |
| Geospatial radius query | < 100ms | PostGIS GIST index |
| Transaction create | < 300ms | DB transaction with validation |

---

## 5. Future AI Evolution Strategy (12+ months)

### 5.1 AI Capability Roadmap

```
Month 1-3:  Rule-Based Engine ──────────── Deterministic, interpretable
                │
Month 4-6:  XGBoost + Prophet ──────────── Supervised learning, demand forecast
                │
Month 7-9:  Ensemble Models ──────────── Multiple models, weighted voting
                │
Month 10-12: Reinforcement Learning ────── Multi-village routing optimization
                │
Month 13+:  Graph Neural Networks ──────── Supply chain topology learning
            Time-series Transformers ──── Long-range forecasting
            NLP Demand Signals ─────────── WhatsApp message analysis
```

### 5.2 Data Flywheel

```
More Villages ──▶ More Data ──▶ Better Models ──▶ Better Recommendations
     ▲                                                       │
     │                                                       │
     └── Higher Adoption ◀── More Trust ◀── Better Outcomes ─┘
```

### 5.3 Model Governance

| Aspect | Policy |
|--------|--------|
| **Bias detection** | Monthly audit: recommendations distributed fairly across villages |
| **Explainability** | All ML recommendations include feature importance |
| **Human override** | Cooperatives can always reject AI recommendations |
| **Fallback** | If ML model fails, automatically fall back to rule engine |
| **Privacy** | No individual farmer data in model training; aggregate village-level only |

---

## 6. Technical Documentation Standards

### Required for Every Module

1. **README.md** — What this module does, how to run it, key dependencies
2. **API endpoints** — Request/response examples, error codes
3. **Data model** — Tables, relationships, constraints
4. **Architecture decisions** — Why this approach was chosen

### ADR (Architecture Decision Record) Template

```markdown
# ADR-NNN: Title

## Status: Accepted / Deprecated / Superseded

## Context
What is the issue we're facing?

## Decision
What did we decide?

## Consequences
What are the trade-offs?
```

### Code Documentation Standards

| Layer | Standard |
|-------|---------|
| **API Controllers** | JSDoc on every endpoint with `@description`, `@param`, `@returns` |
| **Services** | JSDoc on public methods |
| **DTOs** | Swagger decorators (`@ApiProperty`) |
| **Database** | Column comments in Prisma schema |
| **AI Engine** | Python docstrings (Google style) on all public functions |
| **React Components** | Props interface with JSDoc comments |
