'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit2, Trash2, PowerOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function MasterDataCommodityPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitId: '',
    perishability: 'low',
  });

  const { data: commodities, isLoading } = useQuery({
    queryKey: ['commodities-all'],
    queryFn: () => apiClient.get('/commodities?all=true').then((res) => res.data),
  });

  const { data: uoms } = useQuery({
    queryKey: ['uoms'],
    queryFn: () => apiClient.get('/commodities/uoms').then((res) => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.id) {
        return apiClient.patch(`/commodities/${data.id}`, data);
      }
      return apiClient.post('/commodities', data);
    },
    onSuccess: () => {
      toast.success('Komoditas berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['commodities-all'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan komoditas');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/commodities/${id}`),
    onSuccess: () => {
      toast.success('Status komoditas berhasil diubah (nonaktif)');
      queryClient.invalidateQueries({ queryKey: ['commodities-all'] });
    },
  });

  const resetForm = () => {
    setEditItem(null);
    setFormData({ name: '', category: '', unitId: '', perishability: 'low' });
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unitId: item.unitId || item.unitRelation?.id || '',
      perishability: item.perishability,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editItem ? { ...formData, id: editItem.id } : formData);
  };

  if (user?.role !== 'system_admin' && user?.role !== 'koperasi_admin') {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground">Akses Ditolak. Halaman ini hanya untuk Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data Komoditas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola standar penamaan dan satuan komoditas secara terpusat untuk semua desa.
          </p>
        </div>
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Komoditas
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Komoditas' : 'Tambah Komoditas Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Komoditas</Label>
                <Input 
                  required 
                  placeholder="Contoh: Kopi Robusta" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">Sistem akan secara otomatis mengubah nama menjadi huruf kecil untuk mencegah duplikasi (misal: "Kopi" -&gt; "kopi").</p>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input 
                  required 
                  placeholder="Contoh: perkebunan, pertanian" 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan (UoM)</Label>
                <select 
                  required 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.unitId}
                  onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                >
                  <option value="" disabled>Pilih Satuan...</option>
                  {uoms?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.symbol}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama (Ternormalisasi)</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Skeleton className="h-6 w-[250px] mx-auto" />
                </TableCell>
              </TableRow>
            ) : (Array.isArray(commodities) ? commodities : commodities?.data || [])?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Belum ada master data komoditas.
                </TableCell>
              </TableRow>
            ) : (
              (Array.isArray(commodities) ? commodities : commodities?.data || []).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm font-medium">{item.name}</TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>{item.unitRelation?.symbol || '-'}</TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {item.isActive ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if(confirm(`Nonaktifkan komoditas ${item.name}? Desa tidak akan bisa memilih komoditas ini lagi.`)) {
                              deactivateMutation.mutate(item.id);
                            }
                          }}
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600 hover:text-emerald-700"
                          onClick={() => {
                            saveMutation.mutate({ ...item, isActive: true });
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
