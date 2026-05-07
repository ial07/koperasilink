-- Create village_routes table for precomputed distance lookups
-- Run this manually after PostGIS extension is enabled

CREATE TABLE IF NOT EXISTS village_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_a_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  village_b_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  distance_km DECIMAL(8, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(village_a_id, village_b_id)
);

CREATE INDEX IF NOT EXISTS idx_village_routes_a ON village_routes(village_a_id);
CREATE INDEX IF NOT EXISTS idx_village_routes_b ON village_routes(village_b_id);
