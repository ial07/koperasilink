# PHASE 3: Village + Commodity CRUD

**Duration:** Week 2 (Days 3-5)  
**Dependencies:** Phase 2 (Auth + DB running)  
**Review After:** Bisa create, read, update, delete desa & komoditas

---

## Goal

Village CRUD (dengan koordinat GPS), Commodity CRUD, halaman frontend list/detail village.

## Task 3.1: Prisma Seed Data — 20 Desa Rejang Lebong + 10 Komoditas

**File: `apps/api/prisma/seed.ts`**
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const villages = [
  { name: "Desa Air Muring", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4572, longitude: 102.5338, mainCommodities: ["Cabai Merah", "Kopi"], population: 2450 },
  { name: "Desa Talang Rimbo", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4621, longitude: 102.5402, mainCommodities: ["Cabai Merah", "Bawang Merah"], population: 1890 },
  { name: "Desa Kepala Curup", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4702, longitude: 102.5201, mainCommodities: ["Sayur Bayam", "Ikan Nila"], population: 3100 },
  { name: "Desa Batu Galing", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4508, longitude: 102.5456, mainCommodities: ["Kopi Robusta", "Jahe"], population: 1780 },
  { name: "Desa Sukaraja", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4655, longitude: 102.5289, mainCommodities: ["Beras", "Telur Ayam"], population: 2200 },
  { name: "Desa Taba Anyar", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4589, longitude: 102.5381, mainCommodities: ["Cabai Merah", "Kunyit"], population: 1650 },
  { name: "Desa Kampung Baru", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4550, longitude: 102.5350, mainCommodities: ["Bawang Merah", "Ubi Kayu"], population: 2900 },
  { name: "Desa Rimbo Kecik", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4680, longitude: 102.5420, mainCommodities: ["Telur Ayam", "Ikan Nila"], population: 1400 },
  { name: "Desa Karang Anyar", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4600, longitude: 102.5250, mainCommodities: ["Kopi Robusta", "Jahe", "Kunyit"], population: 3100 },
  { name: "Desa Curup Utara", subdistrict: "Curup Utara", district: "Rejang Lebong", latitude: -3.4450, longitude: 102.5300, mainCommodities: ["Beras", "Cabai Merah"], population: 4200 },
  { name: "Desa Air Lanang", subdistrict: "Curup Utara", district: "Rejang Lebong", latitude: -3.4400, longitude: 102.5380, mainCommodities: ["Sayur Bayam", "Ubi Kayu"], population: 1350 },
  { name: "Desa Pahlawan", subdistrict: "Curup Utara", district: "Rejang Lebong", latitude: -3.4480, longitude: 102.5350, mainCommodities: ["Cabai Merah", "Bawang Merah", "Kopi Robusta"], population: 2800 },
  { name: "Desa Perbo", subdistrict: "Curup Utara", district: "Rejang Lebong", latitude: -3.4420, longitude: 102.5280, mainCommodities: ["Jahe", "Kunyit"], population: 1100 },
  { name: "Desa Batu Dewa", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.4550, longitude: 102.5500, mainCommodities: ["Telur Ayam", "Beras"], population: 1950 },
  { name: "Desa Duku Ilir", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.4605, longitude: 102.5550, mainCommodities: ["Ikan Nila", "Sayur Bayam"], population: 1650 },
  { name: "Desa Karang Pandan", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.4530, longitude: 102.5480, mainCommodities: ["Cabai Merah", "Bawang Merah"], population: 2300 },
  { name: "Desa Selangit", subdistrict: "Selangit", district: "Rejang Lebong", latitude: -3.4100, longitude: 102.4700, mainCommodities: ["Kopi Robusta", "Jahe"], population: 1800 },
  { name: "Desa Taba Lagan", subdistrict: "Selangit", district: "Rejang Lebong", latitude: -3.4180, longitude: 102.4650, mainCommodities: ["Ubi Kayu", "Beras"], population: 1400 },
  { name: "Desa Sumberurip", subdistrict: "Bermani Ulu", district: "Rejang Lebong", latitude: -3.3900, longitude: 102.4900, mainCommodities: ["Cabai Merah", "Telur Ayam"], population: 2100 },
  { name: "Desa Tebat Tenong", subdistrict: "Bermani Ulu", district: "Rejang Lebong", latitude: -3.3950, longitude: 102.4850, mainCommodities: ["Sayur Bayam", "Ikan Nila", "Bawang Merah"], population: 1750 },
];

const commodities = [
  { name: "Cabai Merah", category: "vegetables", unit: "kg", perishability: "high", shelfLifeDays: 5, iconUrl: "/icons/chili.png" },
  { name: "Bawang Merah", category: "vegetables", unit: "kg", perishability: "medium", shelfLifeDays: 14, iconUrl: "/icons/shallot.png" },
  { name: "Kopi Robusta", category: "spices", unit: "kg", perishability: "low", shelfLifeDays: 365, iconUrl: "/icons/coffee.png" },
  { name: "Beras", category: "grains", unit: "kg", perishability: "low", shelfLifeDays: 180, iconUrl: "/icons/rice.png" },
  { name: "Sayur Bayam", category: "vegetables", unit: "ikat", perishability: "high", shelfLifeDays: 2, iconUrl: "/icons/spinach.png" },
  { name: "Telur Ayam", category: "livestock", unit: "butir", perishability: "medium", shelfLifeDays: 14, iconUrl: "/icons/eggs.png" },
  { name: "Ikan Nila", category: "fishery", unit: "kg", perishability: "high", shelfLifeDays: 1, iconUrl: "/icons/fish.png" },
  { name: "Jahe", category: "spices", unit: "kg", perishability: "low", shelfLifeDays: 60, iconUrl: "/icons/ginger.png" },
  { name: "Kunyit", category: "spices", unit: "kg", perishability: "low", shelfLifeDays: 60, iconUrl: "/icons/turmeric.png" },
  { name: "Ubi Kayu", category: "grains", unit: "kg", perishability: "low", shelfLifeDays: 30, iconUrl: "/icons/cassava.png" },
];

async function main() {
  console.log("🌱 Seeding...");
  await prisma.predictionLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.pricingHistory.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.villageRoute.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.aiRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.commodity.deleteMany();
  await prisma.village.deleteMany();

  for (const c of commodities) await prisma.commodity.create({ data: c });
  for (const v of villages) await prisma.village.create({ data: v });
  console.log(`✅ ${commodities.length} commodities, ${villages.length} villages`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

**Jalankan:**
```bash
cd apps/api
npx prisma db seed
```

## Task 3.2: Village CRUD (Backend)

**File: `apps/api/src/modules/village/`**
```
village.module.ts
village.controller.ts
village.service.ts
dto/create-village.dto.ts
dto/update-village.dto.ts
dto/query-village.dto.ts
```

### Endpoints:
```
GET    /api/v1/villages          → List (pagination, search by name)
GET    /api/v1/villages/:id      → Detail 
POST   /api/v1/villages          → Create
PUT    /api/v1/villages/:id      → Update
DELETE /api/v1/villages/:id      → Soft delete (status = inactive)
```

### Village Controller snippet:
```typescript
@Controller('villages')
export class VillageController {
  constructor(private villageService: VillageService) {}

  @Get()
  findAll(@Query() query: QueryVillageDto) {
    return this.villageService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.villageService.findOne(id);
  }

  @Post()
  @Roles('system_admin', 'koperasi_admin')
  create(@Body() dto: CreateVillageDto) {
    return this.villageService.create(dto);
  }

  @Put(':id')
  @Roles('system_admin', 'koperasi_admin')
  update(@Param('id') id: string, @Body() dto: UpdateVillageDto) {
    return this.villageService.update(id, dto);
  }

  @Delete(':id')
  @Roles('system_admin')
  remove(@Param('id') id: string) {
    return this.villageService.remove(id);
  }
}
```

## Task 3.3: Commodity CRUD (Backend)

**File: `apps/api/src/modules/commodity/`**
```
commodity.module.ts
commodity.controller.ts
commodity.service.ts
dto/create-commodity.dto.ts
```

### Endpoints:
```
GET    /api/v1/commodities              → List (filter by category)
GET    /api/v1/commodities/:id          → Detail
POST   /api/v1/commodities              → Create (admin only)
PUT    /api/v1/commodities/:id          → Update (admin only)
```

## Task 3.4: Frontend — Village List Page

**File: `apps/web/app/dashboard/villages/page.tsx`**
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function VillagesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["villages", search],
    queryFn: () => apiClient.get("/villages", { params: { search, limit: 50 } }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Villages</h1>
        <Button asChild>
          <Link href="/dashboard/villages/new">
            <Plus className="mr-2 h-4 w-4" /> Add Village
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search villages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Subdistrict</TableHead>
              <TableHead>Population</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.map((v: any) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.district}</TableCell>
                <TableCell>{v.subdistrict}</TableCell>
                <TableCell>{v.population?.toLocaleString() || "-"}</TableCell>
                <TableCell>
                  <Badge variant={v.status === "active" ? "default" : "secondary"}>
                    {v.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/villages/${v.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

## Task 3.5: Frontend — Village Detail Page

**File: `apps/web/app/dashboard/villages/[id]/page.tsx`**
- Village info card (name, location, population)
- List of inventory items for this village
- Map pin showing village location
- Edit button

## Task 3.6: Frontend — Village Create Form

**File: `apps/web/app/dashboard/villages/new/page.tsx`**
- Form: name, subdistrict, district, latitude, longitude, population, main commodities
- Map picker for coordinates (click on map → auto-fill lat/lng)

## Validation Checklist

- [ ] `GET /api/v1/villages` returns paginated list of seeded villages
- [ ] `GET /api/v1/commodities` returns 10 commodities
- [ ] `POST /api/v1/villages` creates a new village (admin only)
- [ ] Search by village name works (partial match)
- [ ] Village detail page shows all info
- [ ] Village list table loads with loading/empty/error states
- [ ] Commodity list page renders with category filter

## Git Checkpoint

```bash
git add .
git commit -m "phase-3: village and commodity crud with seed data"
git tag phase-3
```
