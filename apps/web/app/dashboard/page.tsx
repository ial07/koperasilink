"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Package, TrendingUp, TrendingDown, Minus,
  ArrowLeftRight, Lightbulb, Truck, Clock,
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  // ── KPI ──
  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ["dashboard-kpi"],
    queryFn: () => apiClient.get("/dashboard/kpi").then((r) => r.data),
    refetchInterval: 60_000,
  });

  // ── Village Conditions ──
  const { data: conditions, isLoading: condLoading } = useQuery({
    queryKey: ["dashboard-village-conditions"],
    queryFn: () => apiClient.get("/dashboard/village-conditions").then((r) => r.data),
    refetchInterval: 60_000,
  });

  // ── Recent Activity ──
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: () =>
      apiClient.get("/dashboard/recent-activity").then((r) => r.data),
    refetchInterval: 30_000,
  });

  // ── Price Trends ──
  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ["dashboard-prices"],
    queryFn: () =>
      apiClient.get("/dashboard/trends/prices", { params: { days: 7 } }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const kpiCards = [
    {
      title: "Desa Terdaftar",
      value: kpi?.totalVillages,
      desc: `${kpi?.activeVillages ?? 0} aktif`,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Total Inventory",
      value: kpi?.totalStock?.toLocaleString(),
      suffix: "kg",
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "Surplus Desa",
      value: kpi?.surplusVillages,
      icon: TrendingUp,
      color: "text-green-600",
      badgeVariant: "default" as const,
    },
    {
      title: "Shortage Desa",
      value: kpi?.shortageVillages,
      icon: TrendingDown,
      color: "text-red-600",
      badgeVariant: "destructive" as const,
    },
  ];

  const CONDITION_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    surplus: "default",
    shortage: "destructive",
    balanced: "secondary",
  };

  const CONDITION_VARIANT: Record<string, string> = {
    surplus: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    shortage: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    balanced: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    accepted: "default",
    rejected: "destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Ikhtisar rantai pasok desa se-Rejang Lebong</p>
      </div>

      {/* ── Row 1: KPI Cards ── */}
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
                {kpiLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">
                      {card.value ?? 0}
                      {card.suffix && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {card.suffix}
                        </span>
                      )}
                    </div>
                    {card.desc && (
                      <span className="text-xs text-muted-foreground">{card.desc}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Row 2: Village Conditions Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Kondisi Desa per Komoditas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {condLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !conditions || conditions.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Belum ada data desa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desa</TableHead>
                  <TableHead>Kecamatan</TableHead>
                  <TableHead>Komoditas</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Status Desa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conditions.map((v: any) => {
                  if (v.commodities.length === 0) {
                    return (
                      <TableRow key={v.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>{v.subdistrict}</TableCell>
                        <TableCell colSpan={3} className="text-muted-foreground text-sm">
                          Belum ada data inventory
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">inactive</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return v.commodities.map((c: any, ci: number) => (
                    <TableRow
                      key={`${v.id}-${c.id}`}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/villages/${v.id}`)}
                    >
                      {ci === 0 && (
                        <>
                          <TableCell
                            rowSpan={v.commodities.length}
                            className="font-medium"
                          >
                            {v.name}
                          </TableCell>
                          <TableCell
                            rowSpan={v.commodities.length}
                          >
                            {v.subdistrict}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <span className="text-sm">{c.name}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {c.currentStock.toLocaleString()}
                        <span className="text-xs text-muted-foreground ml-1">
                          {c.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "surplus"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : c.status === "shortage"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {c.status === "surplus" && <TrendingUp className="h-3 w-3" />}
                          {c.status === "shortage" && <TrendingDown className="h-3 w-3" />}
                          {c.status === "normal" && <Minus className="h-3 w-3" />}
                          {c.status}
                        </span>
                      </TableCell>
                      {ci === 0 && (
                        <TableCell rowSpan={v.commodities.length}>
                          <Badge variant={CONDITION_BADGE[v.condition] || "secondary"}>
                            {v.condition}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Row 3: Recent Activity ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Recommendations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Rekomendasi AI Terbaru
            </CardTitle>
            <button
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => router.push("/dashboard/recommendations")}
            >
              Lihat semua →
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {activityLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !activity?.recommendations?.length ? (
              <p className="p-4 text-sm text-muted-foreground">
                Belum ada rekomendasi.
              </p>
            ) : (
              <div className="divide-y">
                {activity.recommendations.map((r: any) => (
                  <div key={r.id} className="px-4 py-3 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">
                        {new Date(r.createdAt).toLocaleDateString("id-ID")}
                      </span>
                      <span className="font-medium">
                        {r.recommendedQuantity?.toLocaleString()} kg
                      </span>
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status] || "secondary"} className="text-xs">
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-500" />
              Transaksi Terbaru
            </CardTitle>
            <button
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => router.push("/dashboard/transactions")}
            >
              Lihat semua →
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {activityLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !activity?.transactions?.length ? (
              <p className="p-4 text-sm text-muted-foreground">
                Belum ada transaksi.
              </p>
            ) : (
              <div className="divide-y">
                {activity.transactions.map((t: any) => (
                  <div
                    key={t.id}
                    className="px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/transactions/${t.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("id-ID")}
                      </span>
                      <span className="font-medium text-xs">
                        {t.fromVillage?.name} → {t.toVillage?.name}
                      </span>
                    </div>
                    <Badge
                      variant={
                        t.status === "completed"
                          ? "default"
                          : t.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {t.status?.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Current Prices ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-500" />
            Harga Komoditas Saat Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pricesLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !prices?.currentPrices?.length ? (
            <p className="p-4 text-sm text-muted-foreground">
              Belum ada data harga.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Komoditas</TableHead>
                  <TableHead>Desa</TableHead>
                  <TableHead className="text-right">Harga (Rp)</TableHead>
                  <TableHead>Satuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.currentPrices.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.commodity?.name ?? "—"}</TableCell>
                    <TableCell>{p.village?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {p.unitPrice ? Number(p.unitPrice).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>{p.commodity?.unit ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
