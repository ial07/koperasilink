"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, RefreshCw, MapPin, Package, TrendingUp, AlertCircle,
} from "lucide-react";

interface Recommendation {
  from_village: string;
  to_village: string;
  commodity: string;
  match_qty: number;
  distance_km: number;
  estimated_profit: number;
  priority_score: number;
  perishability: string;
  explanation: { reasoning: string };
}

export default function RecommendationsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () =>
      fetch("http://localhost:8000/api/v1/recommendations/generate?max_results=10&radius_km=50")
        .then((r) => r.json()),
    retry: 1,
    staleTime: 60_000,
  });

  const recommendations: Recommendation[] = data?.recommendations ?? [];

  const perishabilityColor: Record<string, string> = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-green-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Rule-based surplus ↔ shortage matching engine
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.total ?? 0}</div>
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
                : (recommendations.reduce((s, r) => s + r.priority_score, 0) / recommendations.length).toFixed(1)}
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
            <p className="text-sm">Could not reach the AI service at localhost:8000.</p>
            <p className="text-xs">
              Run: <code className="bg-muted px-1 rounded">uvicorn app.main:app --port 8000</code>
            </p>
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
            <p className="text-sm font-medium">No recommendations available</p>
            <p className="text-xs text-center max-w-xs">
              Seed inventory data with surplus and shortage villages to generate matches.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-green-600">{rec.from_village}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-red-600">{rec.to_village}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {rec.commodity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {rec.match_qty.toFixed(1)} units
                      </span>
                      <span className={`text-xs font-medium ${perishabilityColor[rec.perishability]}`}>
                        ● {rec.perishability}
                      </span>
                    </div>
                    {rec.explanation?.reasoning && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                        {rec.explanation.reasoning}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                    <div className="text-xl font-bold text-primary">
                      {rec.priority_score.toFixed(1)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">score</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <MapPin className="inline h-3 w-3 mr-0.5" />
                      {rec.distance_km.toFixed(1)} km
                    </div>
                    {rec.estimated_profit > 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        +Rp {rec.estimated_profit.toLocaleString()}
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
