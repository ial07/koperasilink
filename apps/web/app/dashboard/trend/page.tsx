'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  surplus: 'secondary',
  shortage: 'destructive',
  balanced: 'default',
};

const statusLabel: Record<string, string> = {
  surplus: 'Surplus',
  shortage: 'Shortage',
  balanced: 'Tercukupi',
};

export default function TrendPage() {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['trend-predictions'],
    queryFn: () =>
      apiClient
        .get('/trend/predict-all')
        .then((r) => r.data)
        .then((data: any[]) =>
          data.map((p: any) => ({
            ...p,
            gap: Number(p.gap),
            predictedDemand: Number(p.predictedDemand),
            currentStock: Number(p.currentStock),
            confidence: Number(p.confidence),
          }))
        ),
    refetchInterval: 60_000,
  });

  const surplusData = predictions?.filter((p) => p.predictedStatus === 'surplus') ?? [];
  const shortageData = predictions?.filter((p) => p.predictedStatus === 'shortage') ?? [];
  const balancedData = predictions?.filter((p) => p.predictedStatus === 'balanced') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prediksi Tren</h1>
          <p className="text-muted-foreground mt-1">
            Analisa data historis 6 bulan terakhir untuk memprediksi kebutuhan bulan depan
          </p>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diprediksi Surplus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-emerald-600">{surplusData.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diprediksi Shortage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-red-600">{shortageData.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tercukupi / Stable
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-amber-600">{balancedData.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabel */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Prediksi per Desa & Komoditas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Semua ({predictions?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="surplus" className="text-emerald-600">
                Surplus ({surplusData.length})
              </TabsTrigger>
              <TabsTrigger value="shortage" className="text-red-600">
                Shortage ({shortageData.length})
              </TabsTrigger>
              <TabsTrigger value="balanced">Tercukupi ({balancedData.length})</TabsTrigger>
            </TabsList>

            {['all', 'surplus', 'shortage', 'balanced'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Desa</TableHead>
                        <TableHead>Komoditas</TableHead>
                        <TableHead className="text-right">Stok Saat Ini</TableHead>
                        <TableHead className="text-right">Prediksi Kebutuhan</TableHead>
                        <TableHead className="text-right">Gap</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Confidence</TableHead>
                        <TableHead className="text-right">Data History</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tab === 'all'
                        ? predictions
                        : predictions?.filter((p) =>
                            tab === 'surplus'
                              ? p.predictedStatus === 'surplus'
                              : tab === 'shortage'
                                ? p.predictedStatus === 'shortage'
                                : p.predictedStatus === 'balanced'
                          )
                      )?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Tidak ada data untuk filter ini
                          </TableCell>
                        </TableRow>
                      ) : (
                        (tab === 'all'
                          ? predictions
                          : predictions?.filter((p) =>
                              tab === 'surplus'
                                ? p.predictedStatus === 'surplus'
                                : tab === 'shortage'
                                  ? p.predictedStatus === 'shortage'
                                  : p.predictedStatus === 'balanced'
                            )
                        )?.map((p, i) => (
                          <TableRow key={`${p.villageId}-${p.commodityId}-${i}`}>
                            <TableCell className="font-medium">{p.villageName}</TableCell>
                            <TableCell>
                              {p.commodityName}{' '}
                              <span className="text-xs text-muted-foreground">({p.unit})</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {p.currentStock.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {Math.round(p.predictedDemand).toLocaleString()}
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono ${
                                p.gap > 0 ? 'text-red-500' : p.gap < 0 ? 'text-emerald-500' : ''
                              }`}
                            >
                              {p.gap > 0 ? '+' : ''}
                              {Math.round(p.gap).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant[p.predictedStatus] ?? 'outline'}>
                                {statusLabel[p.predictedStatus] ?? p.predictedStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {Math.round(p.confidence * 100)}%
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {p.historyMonths} bulan
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Penjelasan */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Bagaimana cara kerjanya?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Sistem mencatat stok setiap desa per komoditas secara bulanan. Dari data historis 6 bulan
            terakhir, kami menghitung <strong>Simple Moving Average (SMA)</strong> dengan bobot 2x
            untuk 3 bulan terakhir.
          </p>
          <p>
            <strong>Surplus</strong> = stok saat ini &ge; 1.5x prediksi kebutuhan (cukup untuk &gt;1.5 bulan)
          </p>
          <p>
            <strong>Shortage</strong> = stok saat ini &le; 0.5x prediksi kebutuhan (kurang dari setengah bulan)
          </p>
          <p>
            Semakin banyak data history, semakin tinggi nilai <strong>Confidence</strong> (0.3 s/d 0.95).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
