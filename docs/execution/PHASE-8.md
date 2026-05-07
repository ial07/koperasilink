# PHASE 8: Recommendation UI + Accept/Reject Workflow

**Duration:** Week 7  
**Dependencies:** Phase 7 (AI Rule Engine running)  
**Review After:** User bisa generate recommendation, lihat list, accept/reject

---

## Goal

Frontend halaman recommendation list, accept/reject buttons, integration dengan AI service.

## Task 8.1: Backend — Recommendation Models & API

**File: `apps/api/src/modules/recommendation/recommendation.service.ts`**
```typescript
import { Injectable, HttpService } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RecommendationService {
  private aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

  constructor(private prisma: PrismaService) {}

  async generate() {
    // Call AI service
    const response = await fetch(`${this.aiServiceUrl}/api/v1/recommendations/generate?max_results=20`);
    const data = await response.json();

    // Save recommendations to DB
    const saved = [];
    for (const rec of data.recommendations) {
      const created = await this.prisma.aiRecommendation.create({
        data: {
          fromVillageId: rec.from_village_id,
          toVillageId: rec.to_village_id,
          commodityId: rec.commodity_id,
          matchQty: rec.match_qty,
          distanceKm: rec.distance_km,
          estimatedProfit: rec.estimated_profit,
          priorityScore: rec.priority_score,
          status: "pending",
        },
      });
      saved.push(created);
    }

    return saved;
  }

  async findAll(filters: { status?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (filters.status && filters.status !== "all") where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.aiRecommendation.findMany({
        where,
        include: {
          fromVillage: { select: { id: true, name: true } },
          toVillage: { select: { id: true, name: true } },
          commodity: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { priorityScore: "desc" },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
      }),
      this.prisma.aiRecommendation.count({ where }),
    ]);

    return { data, total, page: filters.page || 1 };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.aiRecommendation.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }
}
```

**Endpoints:**
```
POST   /api/v1/recommendations/generate    → Trigger AI generation
GET    /api/v1/recommendations             → List (filterable by status)
PATCH  /api/v1/recommendations/:id/accept  → Accept recommendation
PATCH  /api/v1/recommendations/:id/reject  → Reject recommendation
```

## Task 8.2: Frontend — Recommendation List Page

**File: `apps/web/app/dashboard/recommendations/page.tsx`**
```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Lightbulb, Check, X, RefreshCw, Navigation, DollarSign, TrendingUp } from "lucide-react";

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", statusFilter],
    queryFn: () => apiClient.get("/recommendations", { params: { status: statusFilter } }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiClient.post("/recommendations/generate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Recommendations generated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Generation failed"),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/recommendations/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Recommendation accepted");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/recommendations/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recommendations</h1>
          <p className="text-muted-foreground">AI-suggested supply-demand matches</p>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
          Generate
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({data?.total || 0})</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
              ))}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No recommendations yet. Click "Generate" to create AI matches.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data?.data?.map((rec: any) => (
                <Card key={rec.id} className={rec.status !== "pending" ? "opacity-70" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{rec.commodity?.name}</CardTitle>
                      <Badge variant={
                        rec.status === "accepted" ? "default" :
                        rec.status === "rejected" ? "destructive" :
                        rec.status === "converted" ? "secondary" : "outline"
                      }>
                        {rec.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {rec.fromVillage?.name} → {rec.toVillage?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-muted-foreground" />
                        {rec.distanceKm?.toFixed(1)} km
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {rec.matchQty} {rec.commodity?.unit || "kg"}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        Score: {rec.priorityScore}
                      </div>
                    </div>
                    {rec.estimatedProfit > 0 && (
                      <div className="mt-1 text-sm text-green-600">
                        💰 Est. profit: Rp {rec.estimatedProfit.toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                  {rec.status === "pending" && (
                    <CardFooter className="flex gap-2 pt-0">
                      <Button size="sm" className="flex-1" onClick={() => acceptMutation.mutate(rec.id)}>
                        <Check className="mr-1 h-4 w-4" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => rejectMutation.mutate(rec.id)}>
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Task 8.3: AI Recommendation Backend Module

**File: `apps/api/src/modules/recommendation/recommendation.module.ts`**
```typescript
@Module({
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
```

## Task 8.4: AppModule Registration

**File: `apps/api/src/app.module.ts`** — add `RecommendationModule` to imports.

## Validation Checklist

- [ ] `POST /api/v1/recommendations/generate` triggers AI service
- [ ] AI recommendations saved to database with status "pending"
- [ ] `GET /api/v1/recommendations` returns paginated list
- [ ] `PATCH /api/v1/recommendations/:id/accept` updates status
- [ ] `PATCH /api/v1/recommendations/:id/reject` updates status
- [ ] Recommendation list renders cards with score, distance, profit
- [ ] Tabs filter by status (all/pending/accepted/rejected)
- [ ] Generate button has loading spinner
- [ ] Accept/Reject buttons show only on pending
- [ ] Empty state when no recommendations
- [ ] Converted/accepted cards are dimmed (opacity-70)

## Git Checkpoint

```bash
git add .
git commit -m "phase-8: recommendation ui with accept/reject workflow"
git tag phase-8
```
