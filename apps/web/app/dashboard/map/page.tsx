'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supply Map</h1>
        <p className="text-muted-foreground mt-1">
          Color-coded markers show village supply status across Rejang Lebong
        </p>
      </div>
      <MapView />
    </div>
  );
}
