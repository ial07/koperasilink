"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Lightbulb,
  Check,
  X,
  RefreshCw,
  Navigation,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", statusFilter],
    queryFn: () =>
      apiClient
        .get("/recommendations", { params: { status: statusFilter } })
        .then((r) => r.data),
    refetchInterval: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => apiClient.post("/recommendations/generate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Recommendations generated");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Generation failed"),
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
          <p className="text-muted-foreground">
            AI-suggested supply-demand matches
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`}
          />
          Generate
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => setStatusFilter(v)}>
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
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                No recommendations yet. Click &quot;Generate&quot; to create AI
                matches.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data?.data?.map((rec: any) => {
                const unit = rec.commodity?.unitRelation?.symbol || 'kg';
                return (
                  <Card
                    key={rec.id}
                    className={rec.status !== "pending" ? "opacity-70" : ""}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {rec.commodity?.name}
                        </CardTitle>
                        <Badge
                          variant={
                            rec.status === "accepted"
                              ? "default"
                              : rec.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {rec.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {rec.sourceVillage?.name} → {rec.targetVillage?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-muted-foreground" />
                          {rec.distanceKm
                            ? `${Number(rec.distanceKm).toFixed(1)} km`
                            : "—"}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {rec.recommendedQuantity
                            ? `${Number(rec.recommendedQuantity).toLocaleString()} ${unit}`
                            : "—"}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          Score:{" "}
                          {rec.priorityScore
                            ? Number(rec.priorityScore).toFixed(1)
                            : "—"}
                        </div>
                      </div>
                      {rec.estimatedProfit > 0 && (
                        <div className="mt-1 text-sm text-green-600">
                          💰 Est. profit: Rp{" "}
                          {Number(rec.estimatedProfit).toLocaleString()}
                        </div>
                      )}
                    </CardContent>
                    {rec.status === "pending" && (
                      <CardFooter className="flex gap-2 pt-0">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => acceptMutation.mutate(rec.id)}
                        >
                          <Check className="mr-1 h-4 w-4" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => rejectMutation.mutate(rec.id)}
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
