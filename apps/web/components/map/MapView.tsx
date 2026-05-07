'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { divIcon } from 'leaflet';
import apiClient from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS: Record<string, string> = {
  surplus: '#22c55e',
  balanced: '#eab308',
  shortage: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  surplus: 'Surplus',
  balanced: 'Balanced',
  shortage: 'Shortage',
};

function createIcon(status: string) {
  const color = STATUS_COLORS[status] || '#6b7280';
  return divIcon({
    className: 'custom-marker',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function MapView() {
  const center: [number, number] = [-3.457, 102.533]; // Rejang Lebong center
  const zoom = 12;

  const { data: villages, isLoading, isError } = useQuery({
    queryKey: ['villages-map'],
    queryFn: () =>
      apiClient.get('/villages?limit=100&status=active').then((r) => r.data?.data || []),
  });

  const { data: inventorySummary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => apiClient.get('/inventory/summary').then((r) => r.data || {}),
  });

  if (isLoading) {
    return (
      <div className="h-[600px] rounded-lg border bg-muted flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[600px] rounded-lg border bg-destructive/10 flex items-center justify-center text-destructive">
        Failed to load map data
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-[600px] w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {villages?.map((v: any) => {
          if (!v.latitude || !v.longitude) return null;
          const summary = inventorySummary?.[v.id];
          const status = summary?.status || 'balanced';
          return (
            <Marker
              key={v.id}
              position={[v.latitude, v.longitude]}
              icon={createIcon(status)}
            >
              <Popup>
                <div className="font-medium text-base">{v.name}</div>
                <div className="text-sm text-muted-foreground">
                  {v.subdistrict} · {v.district}
                </div>
                <div className="mt-1">
                  <Badge
                    variant={
                      status === 'surplus'
                        ? 'default'
                        : status === 'shortage'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {STATUS_LABELS[status]}
                  </Badge>
                </div>
                {summary && (
                  <div className="mt-2 text-xs space-y-1 text-muted-foreground">
                    <div>👥 {v.population?.toLocaleString() || 'N/A'} population</div>
                    <div>📦 {summary.commodityCount || 0} commodities</div>
                    <div>⚖️ {summary.totalStock || 0} kg total stock</div>
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="flex items-center gap-4 px-4 py-2 border-t bg-card text-sm">
        <span className="font-medium">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-green-500 inline-block" /> Surplus
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-yellow-500 inline-block" /> Balanced
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-red-500 inline-block" /> Shortage
        </span>
      </div>
    </div>
  );
}
