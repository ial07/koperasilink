"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Package, TrendingUp, TrendingDown, Search } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventory", search],
    queryFn: () =>
      apiClient.get("/inventory", { params: { search, limit: 50 } }).then((r) => r.data),
    retry: 1,
  });

  const items = data?.data ?? [];

  const getStockStatus = (item: any) => {
    if (!item.capacity) return "unknown";
    const ratio = item.currentStock / item.capacity;
    if (ratio >= 0.7) return "surplus";
    if (ratio <= 0.2) return "shortage";
    return "balanced";
  };

  const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
    surplus: "default",
    balanced: "secondary",
    shortage: "destructive",
    unknown: "secondary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground mt-1">Real-time commodity stock across all villages</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surplus Villages</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? "—" : items.filter((i: any) => getStockStatus(i) === "surplus").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortage Villages</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? "—" : items.filter((i: any) => getStockStatus(i) === "shortage").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isError ? (
            <div className="flex items-center justify-center h-40 text-destructive text-sm">
              Failed to load inventory.
            </div>
          ) : isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Package className="h-8 w-8 opacity-40" />
              <p className="text-sm">No inventory records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Village</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Unit Price (IDR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => {
                  const status = getStockStatus(item);
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.village?.name ?? "—"}</TableCell>
                      <TableCell>{item.commodity?.name ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(item.currentStock).toLocaleString()} {item.commodity?.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {item.capacity ? Number(item.capacity).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[status]} className="capitalize">
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.unitPrice ? `Rp ${Number(item.unitPrice).toLocaleString()}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
