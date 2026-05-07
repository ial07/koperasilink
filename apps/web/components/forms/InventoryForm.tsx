'use client';

import { useForm } from 'react-hook-form';
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

const inventorySchema = z.object({
  villageId: z.string().min(1, 'Select a village'),
  commodityId: z.string().min(1, 'Select a commodity'),
  currentStock: z.coerce.number().min(0, 'Stock must be >= 0'),
  capacity: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  villages: Array<{ id: string; name: string }>;
  commodities: Array<{ id: string; name: string; unit: string }>;
  onSuccess?: () => void;
  initialData?: Partial<InventoryFormData>;
  editMode?: boolean;
  inventoryId?: string;
}

export function InventoryForm({
  villages,
  commodities,
  onSuccess,
  initialData,
  editMode,
  inventoryId,
}: InventoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      villageId: initialData?.villageId ?? '',
      commodityId: initialData?.commodityId ?? '',
      currentStock: initialData?.currentStock ?? 0,
      capacity: initialData?.capacity ?? undefined,
      unitPrice: initialData?.unitPrice ?? undefined,
    },
  });

  const selectedCommodity = watch('commodityId');

  const onSubmit = async (data: any) => {
    try {
      if (editMode && inventoryId) {
        await apiClient.put(`/inventory/${inventoryId}`, data);
        toast.success('Stock updated');
      } else {
        await apiClient.post('/inventory', data);
        toast.success('Stock created');
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save inventory');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Village selector */}
      <div className="space-y-2">
        <Label htmlFor="villageId">Village</Label>
        <select
          id="villageId"
          {...register('villageId')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
          disabled={editMode}
        >
          <option value="">Select village...</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        {errors.villageId && (
          <p className="text-sm text-destructive">{errors.villageId.message}</p>
        )}
      </div>

      {/* Commodity selector */}
      <div className="space-y-2">
        <Label htmlFor="commodityId">Commodity</Label>
        <select
          id="commodityId"
          {...register('commodityId')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
          disabled={editMode}
        >
          <option value="">Select commodity...</option>
          {commodities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.unit})
            </option>
          ))}
        </select>
        {errors.commodityId && (
          <p className="text-sm text-destructive">{errors.commodityId.message}</p>
        )}
      </div>

      {/* Stock input */}
      <div className="space-y-2">
        <Label htmlFor="currentStock">
          Current Stock
          {selectedCommodity &&
            ` (${commodities.find((c) => c.id === selectedCommodity)?.unit ?? ''})`}
        </Label>
        <Input
          id="currentStock"
          type="number"
          min={0}
          step="0.01"
          placeholder="0"
          {...register('currentStock')}
        />
        {errors.currentStock && (
          <p className="text-sm text-destructive">{errors.currentStock.message}</p>
        )}
      </div>

      {/* Capacity input */}
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity (max storage)</Label>
        <Input
          id="capacity"
          type="number"
          min={0}
          step="0.01"
          placeholder="Optional"
          {...register('capacity')}
        />
        {errors.capacity && (
          <p className="text-sm text-destructive">{errors.capacity.message}</p>
        )}
      </div>

      {/* Price input */}
      <div className="space-y-2">
        <Label htmlFor="unitPrice">Unit Price (IDR)</Label>
        <Input
          id="unitPrice"
          type="number"
          min={0}
          step="100"
          placeholder="Optional"
          {...register('unitPrice')}
        />
        {errors.unitPrice && (
          <p className="text-sm text-destructive">{errors.unitPrice.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : editMode ? 'Update Stock' : 'Save Stock'}
      </Button>
    </form>
  );
}
