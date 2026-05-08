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

const PERISH_ICONS: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
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
    queryKey: ['inventory-summary-v2'],
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
        className="h-[600px] w-full z-0"
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
          const commodities = summary?.commodities || [];
          // Urutkan: shortage dulu, baru surplus, baru balanced
          const sorted = [...commodities].sort((a: any, b: any) => {
            const order: Record<string, number> = { shortage: 0, surplus: 1, balanced: 2, unknown: 3 };
            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
          });

          return (
            <Marker
              key={v.id}
              position={[v.latitude, v.longitude]}
              icon={createIcon(status)}
            >
              <Popup>
                <div className="min-w-[200px]">
                  {/* Header desa */}
                  <div className="font-semibold text-base mb-1">{v.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {v.subdistrict} · {v.district}
                  </div>

                  {/* Status desa */}
                  <div className="mb-2">
                    <Badge
                      variant={
                        status === 'surplus'
                          ? 'default'
                          : status === 'shortage'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="capitalize"
                    >
                      {STATUS_LABELS[status]}
                    </Badge>
                  </div>

                  {/* Per komoditas */}
                  {sorted.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Commodities
                      </div>
                      {sorted.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: STATUS_COLORS[c.status] || '#6b7280' }}
                            />
                            <span className="truncate font-medium">{c.name}</span>
                            <span className="text-muted-foreground">
                              {PERISH_ICONS[c.perishability] ?? ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums">
                              {Number(c.currentStock).toLocaleString()}
                              <span className="text-muted-foreground ml-0.5">{c.unit}</span>
                            </span>
                            {c.capacity && (
                              <span className="text-[10px] text-muted-foreground">
                                /{Number(c.capacity).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ringkasan */}
                  {summary && (
                    <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex justify-between">
                      <span>👥 {v.population?.toLocaleString() || 'N/A'}</span>
                      <span>{summary.commodityCount} commodities</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t bg-card text-sm flex-wrap">
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
        <span className="text-muted-foreground text-xs ml-2">
          Desa status = komoditas paling kritis
        </span>
      </div>
    </div>
  );
}
