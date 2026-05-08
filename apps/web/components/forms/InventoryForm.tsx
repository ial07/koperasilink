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
import { useAuthStore } from '@/stores/auth';

const inventorySchema = z.object({
  villageId: z.string().min(1, 'Pilih desa'),
  commodityId: z.string().min(1, 'Pilih komoditas'),
  currentStock: z.coerce.number().min(0, 'Stok harus >= 0'),
  capacity: z.coerce.number().min(0, 'Kapasitas harus >= 0').optional(),
  monthlyDemand: z.coerce.number().min(0, 'Kebutuhan harus >= 0').optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  villages: Array<{ id: string; name: string }>;
  commodities: Array<{ id: string; name: string; unit: string }>;
  onSuccess?: () => void;
  initialData?: Partial<InventoryFormData & { unitPrice?: number }>;
  editMode?: boolean;
  inventoryId?: string;
}

export function InventoryForm({
  villages = [],
  commodities = [],
  onSuccess,
  initialData,
  editMode,
  inventoryId,
}: InventoryFormProps) {
  const { user } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      villageId: user?.role === 'bumdes_operator' ? user?.villageId || '' : (initialData?.villageId ?? ''),
      commodityId: initialData?.commodityId ?? '',
      currentStock: initialData?.currentStock ?? 0,
      capacity: initialData?.capacity ?? undefined,
      monthlyDemand: initialData?.monthlyDemand ?? undefined,
    },
  });

  const selectedCommodity = watch('commodityId');

  const onSubmit = async (data: any) => {
    try {
      if (editMode && inventoryId) {
        await apiClient.put(`/inventory/${inventoryId}`, data);
        toast.success('Stok berhasil diperbarui');
      } else {
        await apiClient.post('/inventory', data);
        toast.success('Stok berhasil ditambahkan');
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan stok');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Desa */}
      <div className="space-y-2">
        <Label htmlFor="villageId">Desa</Label>
        {user?.role === 'bumdes_operator' ? (
          <>
            <Input 
              disabled 
              value={user?.villageName || villages.find(v => v.id === user?.villageId)?.name || 'Desa Anda'} 
              className="bg-muted text-muted-foreground"
            />
            <input type="hidden" {...register('villageId')} value={user.villageId || ''} />
          </>
        ) : (
          <Controller
            control={control}
            name="villageId"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={editMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih desa..." />
                </SelectTrigger>
                <SelectContent>
                  {villages.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
        {errors.villageId && (
          <p className="text-sm text-destructive">{errors.villageId.message}</p>
        )}
      </div>

      {/* Komoditas */}
      <div className="space-y-2">
        <Label htmlFor="commodityId">Komoditas</Label>
        <Controller
          control={control}
          name="commodityId"
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={editMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih komoditas..." />
              </SelectTrigger>
              <SelectContent>
                {commodities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.commodityId && (
          <p className="text-sm text-destructive">{errors.commodityId.message}</p>
        )}
      </div>

      {/* Stok saat ini */}
      <div className="space-y-2">
        <Label htmlFor="currentStock">
          Stok Saat Ini
          {selectedCommodity && commodities.length > 0 &&
            ` (${commodities.find((c) => c.id === selectedCommodity)?.unit ?? ''})`}
        </Label>
        <Input
          id="currentStock"
          type="number"
          min={0}
          step="0.01"
          placeholder="Contoh: 500"
          {...register('currentStock')}
        />
        <p className="text-xs text-muted-foreground">
          Jumlah stok komoditas yang tersedia saat ini.
        </p>
        {errors.currentStock && (
          <p className="text-sm text-destructive">{errors.currentStock.message}</p>
        )}
      </div>

      {/* Kapasitas */}
      <div className="space-y-2">
        <Label htmlFor="capacity">Kapasitas Maksimal</Label>
        <Input
          id="capacity"
          type="number"
          min={0}
          step="0.01"
          placeholder="Contoh: 1000"
          {...register('capacity')}
        />
        <p className="text-xs text-muted-foreground">
          Total kapasitas gudang atau tempat penyimpanan.
        </p>
        {errors.capacity && (
          <p className="text-sm text-destructive">{errors.capacity.message}</p>
        )}
      </div>

      {/* Kebutuhan Bulanan — NEW */}
      <div className="space-y-2">
        <Label htmlFor="monthlyDemand">
          Kebutuhan Bulanan
          {selectedCommodity && commodities.length > 0 &&
            ` (${commodities.find((c) => c.id === selectedCommodity)?.unit ?? ''}/bulan)`}
        </Label>
        <Input
          id="monthlyDemand"
          type="number"
          min={0}
          step="0.01"
          placeholder="Contoh: 200"
          {...register('monthlyDemand')}
        />
        <p className="text-xs text-muted-foreground">
          Perkiraan kebutuhan desa per bulan. AI akan membandingkan stok vs kebutuhan ini untuk menentukan surplus/shortage.
        </p>
        {errors.monthlyDemand && (
          <p className="text-sm text-destructive">{errors.monthlyDemand.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Menyimpan...' : editMode ? 'Perbarui Stok' : 'Simpan Stok'}
      </Button>
    </form>
  );
}
