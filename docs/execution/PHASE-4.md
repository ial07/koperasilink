# PHASE 4: Inventory CRUD + PostGIS Geospatial

**Duration:** Week 3  
**Dependencies:** Phase 3 (Village + Commodity data exist)  
**Review After:** Bisa input stok desa, lihat surplus/shortage, query geografis jalan

---

## Goal

Inventory CRUD dengan validasi stock, PostGIS geospatial queries (radius search, distance calculation), UI stock form.

## Task 4.1: Inventory CRUD (Backend)

**File: `apps/api/src/modules/inventory/`**
```
inventory.module.ts
inventory.controller.ts
inventory.service.ts
dto/create-inventory.dto.ts
dto/update-inventory.dto.ts
dto/query-inventory.dto.ts
```

### Endpoints:
```
GET    /api/v1/inventory                      → All (paginated, filterable)
GET    /api/v1/inventory/village/:villageId   → By village
POST   /api/v1/inventory                      → Create / Upsert
PUT    /api/v1/inventory/:id                   → Update stock
```

### CreateInventoryDto:
```typescript
import { IsString, IsNumber, IsOptional, Min } from "class-validator";

export class CreateInventoryDto {
  @IsString()
  villageId: string;

  @IsString()
  commodityId: string;

  @IsNumber()
  @Min(0)
  currentStock: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
```

### Inventory Service — key logic:
```typescript
async create(dto: CreateInventoryDto) {
  // Validate: current_stock <= capacity
  if (dto.capacity && dto.currentStock > dto.capacity) {
    throw new BadRequestException("Stock cannot exceed capacity");
  }

  // Upsert: one inventory per village+commodity combination
  return this.prisma.inventory.upsert({
    where: {
      villageId_commodityId: {
        villageId: dto.villageId,
        commodityId: dto.commodityId,
      },
    },
    update: {
      currentStock: dto.currentStock,
      capacity: dto.capacity,
      unitPrice: dto.unitPrice,
      lastUpdated: new Date(),
    },
    create: {
      villageId: dto.villageId,
      commodityId: dto.commodityId,
      currentStock: dto.currentStock,
      capacity: dto.capacity,
      unitPrice: dto.unitPrice,
      minStock: dto.capacity ? Math.floor(dto.capacity * 0.2) : undefined,
      surplusThreshold: dto.capacity ? Math.floor(dto.capacity * 0.7) : undefined,
    },
  });
}
```

## Task 4.2: Surplus/Shortage Status Logic

Tambah field computed di response inventory:

```typescript
getStatus(currentStock: number, capacity: number, minStock?: number, surplusThreshold?: number): string {
  const min = minStock || capacity * 0.2;
  const surplus = surplusThreshold || capacity * 0.7;

  if (currentStock >= surplus) return "surplus";
  if (currentStock <= min) return "shortage";
  return "balanced";
}
```

## Task 4.3: Geospatial Service (Pure SQL Haversine)

**File: `apps/api/src/modules/geospatial/geospatial.service.ts`**
```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GeospatialService {
  constructor(private prisma: PrismaService) {}

  async findVillagesWithinRadius(lat: number, lng: number, radiusKm: number) {
    return this.prisma.$queryRaw`
      SELECT id, name, subdistrict, district, latitude, longitude,
        main_commodities, population,
        (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )
        ) AS distance_km
      FROM villages
      WHERE status = 'active'
      AND (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )
        ) <= ${radiusKm}
      ORDER BY distance_km;
    `;
  }

  async getDistanceBetweenVillages(villageAId: string, villageBId: string) {
    return this.prisma.$queryRaw`
      SELECT 
        (
          6371 * acos(
            cos(radians(a.latitude)) * cos(radians(b.latitude)) *
            cos(radians(b.longitude) - radians(a.longitude)) +
            sin(radians(a.latitude)) * sin(radians(b.latitude))
          )
        ) AS distance_km
      FROM villages a, villages b
      WHERE a.id = ${villageAId} AND b.id = ${villageBId};
    `;
  }
}
```

### Geospatial Module:
```typescript
@Module({
  controllers: [GeospatialController],
  providers: [GeospatialService],
  exports: [GeospatialService],
})
export class GeospatialModule {}
```

### Geospatial Endpoints:
```
GET /api/v1/geospatial/nearby?lat=-3.46&lng=102.53&radius=50   → Villages within 50km
GET /api/v1/geospatial/distance?villageA=xxx&villageB=yyy       → Distance between 2 villages
```

## Task 4.4: Precompute Village Route Distances

```bash
# Create migration or run raw SQL
INSERT INTO village_routes (village_a_id, village_b_id, distance_km)
SELECT a.id, b.id,
  (
    6371 * acos(
      cos(radians(a.latitude)) * cos(radians(b.latitude)) *
      cos(radians(b.longitude) - radians(a.longitude)) +
      sin(radians(a.latitude)) * sin(radians(b.latitude))
    )
  )
FROM villages a
CROSS JOIN villages b
WHERE a.id < b.id
ON CONFLICT (village_a_id, village_b_id) DO NOTHING;
```

## Task 4.5: Frontend — Stock Input Form

**File: `apps/web/app/dashboard/inventory/page.tsx`**
- Table: Village | Commodity | Stock | Capacity | Status (badge color) | Price | Last Updated
- Filter: by village, by commodity, by status (surplus/shortage/balanced)
- Add stock button → opens dialog/modal

**File: `apps/web/components/forms/InventoryForm.tsx`**
```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";

const inventorySchema = z.object({
  villageId: z.string().min(1, "Select a village"),
  commodityId: z.string().min(1, "Select a commodity"),
  currentStock: z.coerce.number().min(0, "Stock must be >= 0"),
  capacity: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

export function InventoryForm({ villages, commodities, onSuccess }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(inventorySchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await apiClient.post("/inventory", data);
      toast.success("Stock updated");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update stock");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Village selector */}
      {/* Commodity selector */}
      {/* Stock input */}
      {/* Capacity input */}
      {/* Price input */}
      <Button type="submit">Save Stock</Button>
    </form>
  );
}
```

## Task 4.6: Frontend — Village Detail with Inventory

**Update `app/dashboard/villages/[id]/page.tsx`:**
- Village info card (existing)
- Inventory table for that village:
  - Commodity | Stock | Capacity | Status badge | Price
  - Add inventory button (linked to stock form)
- Nearby villages section (using geospatial endpoint)

## Validation Checklist

- [ ] `POST /api/v1/inventory` creates stock with validasi
- [ ] `stock > capacity` returns 400 Bad Request
- [ ] `GET /api/v1/inventory?villageId=xxx` returns filtered results
- [ ] `GET /api/v1/geospatial/nearby?lat=-3.46&lng=102.53&radius=50` returns villages within radius
- [ ] Village detail page shows inventory list with status badges
- [ ] Stock form submits correctly and shows toast
- [ ] Surplus/shortage/balanced colors match status

## Git Checkpoint

```bash
git add .
git commit -m "phase-4: inventory crud, postgis geospatial queries, stock form"
git tag phase-4
```
