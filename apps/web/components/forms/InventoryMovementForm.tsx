'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

const movementSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus lebih dari 0'),
  notes: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface InventoryMovementFormProps {
  inventoryId: string;
  villageName: string;
  commodityName: string;
  currentStock: number;
  unit: string;
  onSuccess?: () => void;
}

export function InventoryMovementForm({
  inventoryId,
  villageName,
  commodityName,
  currentStock,
  unit,
  onSuccess,
}: InventoryMovementFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'IN',
      quantity: 0,
      notes: '',
    },
  });

  const type = watch('type');

  const onSubmit = async (data: MovementFormData) => {
    try {
      // If type is ADJUSTMENT, we can use the main PUT endpoint or a specific movement logic
      // Wait, our movement endpoint expects type, quantity, notes.
      // But for ADJUSTMENT, if quantity is the absolute new stock, we should probably hit the PUT endpoint,
      // or we hit POST /inventory/:id/movements with type=ADJUSTMENT but we didn't implement calculating delta there.
      // Let's implement delta logic on frontend for ADJUSTMENT and send IN/OUT, 
      // OR let's just hit PUT /inventory/:id with currentStock = quantity for ADJUSTMENT.
      if (data.type === 'ADJUSTMENT') {
        await apiClient.put(`/inventory/${inventoryId}`, {
          currentStock: data.quantity,
        });
      } else {
        await apiClient.post(`/inventory/${inventoryId}/movements`, data);
      }
      toast.success('Aktivitas stok berhasil dicatat');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat aktivitas');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-muted p-3 rounded-md mb-4 text-sm">
        <p><strong>Desa:</strong> {villageName}</p>
        <p><strong>Komoditas:</strong> {commodityName}</p>
        <p><strong>Stok Saat Ini:</strong> {currentStock} {unit}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Jenis Aktivitas</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenis..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Stok Masuk (Panen/Pembelian)</SelectItem>
                <SelectItem value="OUT">Stok Keluar (Penjualan/Rusak)</SelectItem>
                <SelectItem value="ADJUSTMENT">Stock Opname (Penyesuaian)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">
          {type === 'ADJUSTMENT' ? 'Jumlah Stok Akhir' : 'Jumlah Kuantitas'} ({unit})
        </Label>
        <Input
          id="quantity"
          type="number"
          step="0.01"
          {...register('quantity')}
        />
        <p className="text-xs text-muted-foreground">
          {type === 'IN' && 'Jumlah barang yang akan DITAMBAHKAN ke stok.'}
          {type === 'OUT' && 'Jumlah barang yang akan DIKURANGI dari stok.'}
          {type === 'ADJUSTMENT' && 'Hasil perhitungan fisik yang akan MENGGANTIKAN stok saat ini.'}
        </p>
        {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (Opsional)</Label>
        <Input
          id="notes"
          placeholder="Contoh: Panen musim ini, barang rusak, dsb"
          {...register('notes')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Memproses...' : 'Catat Aktivitas'}
      </Button>
    </form>
  );
}
