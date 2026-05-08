"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Package, ArrowLeftRight, Lightbulb } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function DashboardPage() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ["dashboard-kpi"],
    queryFn: () =>
      apiClient.get("/dashboard/kpi").then((r) => r.data),
    refetchInterval: 60_000,
  });

  const kpiCards = [
    {
      title: "Active Villages",
      value: kpi?.activeVillages,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Total Stock",
      value: kpi?.totalStock?.toLocaleString(),
      suffix: "kg",
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "Completed Transactions",
      value: kpi?.completedTransactions,
      icon: ArrowLeftRight,
      color: "text-purple-600",
    },
    {
      title: "AI Recommendation Rate",
      value: `${kpi?.recommendationRate ?? 0}%`,
      icon: Lightbulb,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Real-time supply chain overview</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {card.value ?? 0}
                    {card.suffix && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {card.suffix}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Price Trends / Activity placeholder — extended in later phases */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Transaction and recommendation activity will appear here.
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Price Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Price history charts will appear here once transaction data is available.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
