"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Map } from "lucide-react";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supply Map</h1>
        <p className="text-muted-foreground mt-1">
          Geographic overview of village supply status
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center h-[500px] gap-4 text-muted-foreground">
          <Map className="h-12 w-12 opacity-30" />
          <div className="text-center">
            <p className="font-medium">Map Coming in Phase 5</p>
            <p className="text-sm mt-1">
              Interactive Leaflet map with color-coded village markers will be added after PostGIS is enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
