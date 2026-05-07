"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, ArrowLeftRight, Lightbulb } from "lucide-react";

export default function DashboardPage() {
  const kpiCards = [
    { title: "Active Villages", value: "0", icon: Building2, color: "text-blue-600" },
    { title: "Total Stock (kg)", value: "0", icon: Package, color: "text-green-600" },
    { title: "Transactions", value: "0", icon: ArrowLeftRight, color: "text-purple-600" },
    { title: "AI Rate", value: "0%", icon: Lightbulb, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to KoperasiLink</p>
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
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
