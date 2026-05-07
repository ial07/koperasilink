# PHASE 3.5: Security & Architecture Pivot

**Date Applied:** 2026-05-08  
**Reason:** Technical audit revealed several blockers preventing Phase 4 (Inventory) and Phase 5 (Marketplace) from functioning in a real-world scenario.

---

## 1. PostGIS to Pure SQL Haversine Pivot
The local native PostgreSQL environment did not have PostGIS active. To avoid breaking the application on standard Postgres setups (and avoiding Docker dependencies during dev), all geospatial logic was rewritten to use the Pure SQL Haversine formula.

**Affected Files:**
- `apps/api/src/modules/geospatial/geospatial.service.ts`

## 2. Authentication & RBAC Hardening
The previous implementation defined RBAC but failed to apply it, exposing write operations.

**Changes:**
- Removed OTP flow. Simplified to Phone + Password.
- Added `villageId` directly into the JWT payload during `JwtStrategy.validate()` to allow scoping.
- Applied `@UseGuards(RolesGuard)` and `@Roles('system_admin', 'koperasi_admin')` to all mutating endpoints in:
  - `village.controller.ts`
  - `commodity.controller.ts`
  - `inventory.controller.ts`
- Guarded `POST /api/v1/auth/register` to be accessible ONLY by `system_admin`, fulfilling the "controlled onboarding" requirement.

## 3. Zustand Auth Store
Next.js frontend was losing user context on reload because `localStorage` only held the token, not the user/village identity.

**Changes:**
- Implemented `useAuthStore` in `apps/web/stores/auth.ts` with Zustand and JSON persist middleware.
- Login flow now fetches `/auth/me` and hydrates the store.
- Added client-side route protection in `apps/web/app/dashboard/layout.tsx` using `useAuthStore`.

## 4. Supply Discovery Endpoint
Added the critical missing endpoint that powers the entire cooperative marketplace concept: finding who has surplus.

**Changes:**
- Added `findSurplusForCommodity` in `InventoryService` (using SQL `WHERE` for efficiency).
- Exposed via `GET /api/v1/inventory/supply?commodityId=X`.

## 5. AI Recommendations Proxy & Lifecycle
FastAPI was previously called directly from the browser, violating security boundaries and leaving recommendations unpersisted.

**Changes:**
- Created `AiModule`, `AiController`, and `AiService` in NestJS.
- NestJS now acts as a proxy: `GET /api/v1/ai/recommendations/generate` calls FastAPI on port 8000.
- Recommendations are automatically persisted to the `ai_recommendations` table upon generation.
- Added `POST /api/v1/ai/recommendations/:id/accept` and `/reject` to handle the recommendation lifecycle.
- Accepting a recommendation automatically creates a new `Transaction` in the `pending` state.
- Updated `apps/web/app/dashboard/recommendations/page.tsx` to read from the persisted pending list and interact with the Accept/Reject lifecycle.

---

**Next Step:** Proceed to [Phase 4: Inventory CRUD + PostGIS Geospatial](PHASE-4.md) (noting the PostGIS pivot).
