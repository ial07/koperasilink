"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, AlertCircle } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  cancelled: "destructive",
  shipped: "outline",
};

export default function TransactionsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      apiClient.get("/transactions", { params: { limit: 50 } }).then((r) => r.data),
    retry: 1,
  });

  const transactions = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">Village-to-village commodity transfers</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <AlertCircle className="h-6 w-6 text-destructive opacity-60" />
              <p className="text-sm">Failed to load transactions</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <ArrowLeftRight className="h-8 w-8 opacity-40" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total (IDR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{t.fromVillage?.name ?? "—"}</TableCell>
                    <TableCell>{t.toVillage?.name ?? "—"}</TableCell>
                    <TableCell>{t.commodity?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{Number(t.quantity).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">Rp {Number(t.totalAmount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[t.status] ?? "secondary"} className="capitalize">
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(t.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
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
