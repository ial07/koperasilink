"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Lightbulb, RefreshCw, MapPin, Package, TrendingUp, AlertCircle, Check, X
} from "lucide-react";

interface Recommendation {
  id: string;
  sourceVillageId: string;
  targetVillageId: string;
  commodityId: string;
  commodity: { name: string };
  recommendedQuantity: number;
  distanceKm: number;
  estimatedProfit: number;
  priorityScore: number;
  explanation: any;
}

export default function RecommendationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["recommendations", "pending"],
    queryFn: () =>
      apiClient.get("/ai/recommendations/pending").then((r) => r.data),
    retry: 1,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiClient.get("/ai/recommendations/generate?maxResults=10&radiusKm=50"),
    onSuccess: () => {
      toast.success("Recommendations generated successfully");
      queryClient.invalidateQueries({ queryKey: ["recommendations", "pending"] });
    },
    onError: () => toast.error("Failed to generate recommendations"),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/ai/recommendations/${id}/accept`),
    onSuccess: () => {
      toast.success("Recommendation accepted. Transaction created.");
      queryClient.invalidateQueries({ queryKey: ["recommendations", "pending"] });
    },
    onError: () => toast.error("Failed to accept recommendation"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/ai/recommendations/${id}/reject`, { reason: "User rejected" }),
    onSuccess: () => {
      toast.success("Recommendation rejected.");
      queryClient.invalidateQueries({ queryKey: ["recommendations", "pending"] });
    },
    onError: () => toast.error("Failed to reject recommendation"),
  });

  const recommendations: Recommendation[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Review and accept pending supply-demand matches
          </p>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? "animate-spin" : ""}`} />
          Generate New
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Matches</CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : recommendations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Priority Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || recommendations.length === 0
                ? "—"
                : (recommendations.reduce((s, r) => s + Number(r.priorityScore), 0) / recommendations.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Radius</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50 km</div>
          </CardContent>
        </Card>
      </div>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive opacity-60" />
            <p className="text-sm">Failed to load recommendations.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <Package className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">No pending recommendations</p>
            <p className="text-xs text-center max-w-xs">
              Click Generate New to trigger the AI matching engine.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-green-600 text-xs">Source Village {rec.sourceVillageId.substring(0,6)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-red-600 text-xs">Target Village {rec.targetVillageId.substring(0,6)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {rec.commodity?.name || "Unknown"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {Number(rec.recommendedQuantity).toFixed(1)} units
                      </span>
                    </div>
                    {rec.explanation?.reasoning && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                        {rec.explanation.reasoning}
                      </p>
                    )}
                    <div className="pt-2 flex gap-2">
                      <Button size="sm" variant="default" onClick={() => acceptMutation.mutate(rec.id)} disabled={acceptMutation.isPending || rejectMutation.isPending}>
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(rec.id)} disabled={acceptMutation.isPending || rejectMutation.isPending}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                    <div className="text-xl font-bold text-primary">
                      {Number(rec.priorityScore).toFixed(1)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">score</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <MapPin className="inline h-3 w-3 mr-0.5" />
                      {Number(rec.distanceKm).toFixed(1)} km
                    </div>
                    {Number(rec.estimatedProfit) > 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        +Rp {Number(rec.estimatedProfit).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
