# KoperasiLink — MVP Execution Plan (10 Phases)

**Version:** 2.0  
**Date:** 2026-05-07  
**Total Duration:** 12 Weeks (3 Months)  
**Target:** MVP Launch — AI-Powered Cooperative Supply Chain  
**Reference Docs:** `/docs/` folder

---

## Cara Pakai

Setiap phase adalah dokumen mandiri. Buka filenya, ikutin task satu-satu. Selesai 1 phase → commit → tag git → lu review → lanjut.

## Phase Map

| Phase | Minggu | Judul | Lines |
|-------|--------|-------|-------|
| **Phase 0** | W1 D1-3 | Monorepo + DB Schema + Docker | 565 |
| **Phase 1** | W1 D4-5 | Next.js Scaffold + ShadCN + Layout | 448 |
| **Phase 2** | W2 D1-2 | Auth (JWT + OTP) + RBAC | 582 |
| **Phase 3** | W2 D3-5 | Village + Commodity CRUD + Seed Data | 283 |
| **Phase 4** | W3 | Inventory CRUD + PostGIS | 262 |
| **Phase 5** | W4 | Map View with Leaflet | 214 |
| **Phase 6** | W5 | Dashboard + Redis Cache | 254 |
| **Phase 7** | W6 | AI Rule Engine (FastAPI) | 437 |
| **Phase 8** | W7 | Recommendation UI + Accept/Reject | 272 |
| **Phase 9** | W8 | Transaction Lifecycle + Stock | 255 |
| **Phase 10** | W9-12 | Analytics + UAT + Deploy + Docs | 327 |

**Total: 3,928 lines across 11 files (140 KB)**

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 14 (App Router) + ShadCN + Tailwind + React Query |
| Backend | NestJS + Prisma + PostgreSQL/PostGIS |
| AI | Python FastAPI + SQLAlchemy + AsyncPG |
| Cache | Redis (via cache-manager-redis-yet) |
| Infra | Docker Compose + Nginx + Certbot |
| CI | GitHub Actions (lint + type-check + build) |
