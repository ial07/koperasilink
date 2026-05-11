'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryForm } from '@/components/forms/InventoryForm';
import { Package, TrendingUp, TrendingDown, Search, Plus, ClipboardCheck } from 'lucide-react';
import { useState, useCallback } from 'react';

import { InventoryMovementForm } from '@/components/forms/InventoryMovementForm';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [villageFilter, setVillageFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<any>(null);

  const onStatusChange = useCallback((value: string | null) => {
    setStatusFilter(value ?? 'all');
  }, []);
  const onVillageChange = useCallback((value: string | null) => {
    setVillageFilter(value ?? 'all');
  }, []);
  const queryClient = useQueryClient();

  // Fetch inventory
  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory', search],
    queryFn: () =>
      apiClient.get('/inventory', { params: { search, limit: 50 } }).then((r) => r.data),
    retry: 1,
  });

  // Fetch villages for filter & form
  const { data: villagesData } = useQuery({
    queryKey: ['villages-list'],
    queryFn: () => apiClient.get('/villages', { params: { limit: 100 } }).then((r) => r.data),
  });

  // Fetch commodities for form
  const { data: commoditiesData } = useQuery({
    queryKey: ['commodities-list'],
    queryFn: () =>
      apiClient.get('/commodities', { params: { limit: 50 } }).then((r) => r.data),
  });

  const villages = villagesData?.data ?? [];
  const commodities = Array.isArray(commoditiesData) ? commoditiesData : (commoditiesData?.data ?? []);
  const allItems = data?.data ?? [];

  // Apply filters
  const items = allItems.filter((item: any) => {
    if (statusFilter !== 'all' && item.computedStatus !== statusFilter) return false;
    if (villageFilter !== 'all' && item.villageId !== villageFilter) return false;
    return true;
  });

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    surplus: 'default',
    balanced: 'secondary',
    shortage: 'destructive',
    unknown: 'secondary',
  };

  const stats = {
    total: isLoading ? '—' : String(items.length),
    surplus: isLoading
      ? '—'
      : String(items.filter((i: any) => i.computedStatus === 'surplus').length),
    shortage: isLoading
      ? '—'
      : String(items.filter((i: any) => i.computedStatus === 'shortage').length),
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  const handleMovementSuccess = () => {
    setMovementDialogOpen(false);
    setSelectedInventory(null);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manajemen stok komoditas per desa. Catat setiap pergerakan barang (Masuk/Keluar) untuk akurasi AI.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={async () => {
              try {
                const res = await apiClient.post('/inventory/record-all-monthly');
                const { toast } = await import('sonner');
                toast.success(res?.data?.message || 'Semua stok berhasil dicatat ke histori bulanan!');
                queryClient.invalidateQueries({ queryKey: ['trend-predictions'] });
              } catch (e: any) {
                const { toast } = await import('sonner');
                toast.error(e?.response?.data?.message || 'Gagal mencatat stok bulanan');
              }
            }}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Snapshot Bulanan
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Komoditas Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Komoditas Desa</DialogTitle>
              </DialogHeader>
              <InventoryForm
                villages={villages}
                commodities={commodities}
                onSuccess={handleSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surplus</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.surplus}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortage</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.shortage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="surplus">Surplus</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="shortage">Shortage</SelectItem>
          </SelectContent>
        </Select>
        <Select value={villageFilter} onValueChange={onVillageChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Villages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Villages</SelectItem>
            {villages.map((v: any) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Aktivitas Stok</DialogTitle>
          </DialogHeader>
          {selectedInventory && (
            <InventoryMovementForm
              inventoryId={selectedInventory.id}
              villageName={selectedInventory.village?.name || '—'}
              commodityName={selectedInventory.commodity?.name || '—'}
              currentStock={Number(selectedInventory.currentStock)}
              unit={selectedInventory.commodity?.unitRelation?.symbol || ''}
              onSuccess={handleMovementSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
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
                  <TableHead className="text-right">Last Updated</TableHead>
                  <TableHead className="w-32 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => {
                  const status = item.computedStatus ?? 'unknown';
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {item.village?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        {item.commodity?.name ?? '—'}{' '}
                        <span className="text-muted-foreground text-xs">
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
                        <Badge variant={statusVariant[status]} className="capitalize">
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {item.lastUpdated
                          ? new Date(item.lastUpdated).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedInventory(item);
                            setMovementDialogOpen(true);
                          }}
                        >
                          🔄 Aktivitas
                        </Button>
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
