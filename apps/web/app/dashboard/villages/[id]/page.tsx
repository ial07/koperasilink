'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InventoryForm } from '@/components/forms/InventoryForm';
import {
  MapPin,
  Users,
  Package,
  ArrowLeft,
  Plus,
  Phone,
  Thermometer,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useState } from 'react';

export default function VillageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const villageId = params.id as string;
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch village detail
  const { data: village, isLoading: villageLoading } = useQuery({
    queryKey: ['village', villageId],
    queryFn: () => apiClient.get(`/villages/${villageId}`).then((r) => r.data),
    enabled: !!villageId,
  });

  // Fetch inventory for this village
  const { data: inventoryData, isLoading: invLoading } = useQuery({
    queryKey: ['inventory-village', villageId],
    queryFn: () =>
      apiClient.get(`/inventory/village/${villageId}`).then((r) => r.data),
    enabled: !!villageId,
  });

  // Fetch commodities for form
  const { data: commoditiesData } = useQuery({
    queryKey: ['commodities-list'],
    queryFn: () => apiClient.get('/commodities').then((r) => r.data),
  });

  // Fetch nearby villages (50km radius)
  const { data: nearbyData } = useQuery({
    queryKey: ['nearby-villages', village?.latitude, village?.longitude],
    queryFn: () =>
      apiClient
        .get('/geospatial/nearby', {
          params: {
            lat: village.latitude,
            lng: village.longitude,
            radius: 50,
          },
        })
        .then((r) => r.data),
    enabled: !!village?.latitude && !!village?.longitude,
  });

  const inventory = Array.isArray(inventoryData) ? inventoryData : [];
  const villages = village ? [village] : [];
  const commodities = Array.isArray(commoditiesData) ? commoditiesData : (commoditiesData?.data ?? []);
  const nearby = Array.isArray(nearbyData) ? nearbyData : [];

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    surplus: 'default',
    balanced: 'secondary',
    shortage: 'destructive',
    unknown: 'secondary',
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['inventory-village', villageId] });
  };

  if (villageLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!village) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Village not found</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/villages')}>
          Back to Villages
        </Button>
      </div>
    );
  }

  const stockSummary = {
    surplus: inventory.filter((i: any) => i.computedStatus === 'surplus').length,
    shortage: inventory.filter((i: any) => i.computedStatus === 'shortage').length,
    total: inventory.length,
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/villages')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Villages
      </Button>

      {/* Village header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{village.name}</h1>
          <p className="text-muted-foreground mt-1">
            {village.subdistrict}, {village.district}, {village.province}
          </p>
        </div>
        <Badge
          variant={village.status === 'active' ? 'default' : 'secondary'}
          className="capitalize text-sm px-3 py-1"
        >
          {village.status}
        </Badge>
      </div>

      {/* Village info cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Population</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {village.population?.toLocaleString() ?? '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coordinates</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono">
              {village.latitude?.toFixed(4)}, {village.longitude?.toFixed(4)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cold Storage</CardTitle>
            <Thermometer className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {village.hasColdStorage ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact</CardTitle>
            <Phone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono">
              {village.contactPhone ?? '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main commodities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Main Commodities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {village.mainCommodities?.length > 0
              ? village.mainCommodities.map((c: string) => (
                  <Badge key={c} variant="secondary" className="text-sm">
                    {c}
                  </Badge>
                ))
              : <span className="text-muted-foreground text-sm">No data</span>}
          </div>
        </CardContent>
      </Card>

      {/* Inventory section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inventory</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Stock levels for this village
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory</DialogTitle>
            </DialogHeader>
            <InventoryForm
              villages={villages}
              commodities={commodities}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stock summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockSummary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surplus</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stockSummary.surplus}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortage</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stockSummary.shortage}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory table */}
      <Card>
        <CardContent className="p-0">
          {invLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
              <Package className="h-6 w-6 opacity-40" />
              <p className="text-sm">No inventory records for this village</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price (IDR)</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.commodity?.name ?? '—'}
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({item.commodity?.unitRelation?.symbol ?? ''})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item.currentStock).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {item.capacity ? Number(item.capacity).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[item.computedStatus ?? 'unknown']}
                        className="capitalize"
                      >
                        {item.computedStatus ?? 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.unitPrice
                        ? `Rp ${Number(item.unitPrice).toLocaleString()}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {item.lastUpdated
                        ? new Date(item.lastUpdated).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Nearby villages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nearby Villages (50 km)</CardTitle>
        </CardHeader>
        <CardContent>
          {nearby.length === 0 ? (
            <p className="text-sm text-muted-foreground">No nearby villages found.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {nearby
                .filter((n: any) => n.id !== villageId)
                .slice(0, 6)
                .map((n: any) => (
                  <Card key={n.id} className="border border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{n.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {n.subdistrict}
                          </p>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {Number(n.distance_km).toFixed(1)} km
                        </Badge>
                      </div>
                      {n.main_commodities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {n.main_commodities.map((c: string) => (
                            <Badge
                              key={c}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
