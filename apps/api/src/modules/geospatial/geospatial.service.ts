import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeospatialService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find villages within a given radius (km) from a coordinate point.
   * Uses PostGIS ST_DWithin & ST_Distance for geospatial filtering.
   */
  async findVillagesWithinRadius(lat: number, lng: number, radiusKm: number) {
    return this.prisma.$queryRaw`
      SELECT id, name, subdistrict, district, latitude, longitude,
        main_commodities, population,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) / 1000 AS distance_km
      FROM villages
      WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusKm * 1000}
      )
      AND status = 'active'
      ORDER BY distance_km;
    `;
  }

  /**
   * Get the straight-line distance between two villages by their IDs.
   */
  async getDistanceBetweenVillages(villageAId: string, villageBId: string) {
    const result = await this.prisma.$queryRaw`
      SELECT
        a.id AS village_a_id,
        a.name AS village_a_name,
        b.id AS village_b_id,
        b.name AS village_b_name,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::geography
        ) / 1000 AS distance_km
      FROM villages a, villages b
      WHERE a.id = ${villageAId} AND b.id = ${villageBId};
    `;

    return result;
  }

  /**
   * Compute route distances for all village pairs.
   * Insert into village_routes table for precomputed lookup.
   */
  async precomputeRouteDistances() {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO village_routes (village_a_id, village_b_id, distance_km)
        SELECT a.id, b.id,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::geography
          ) / 1000
        FROM villages a
        CROSS JOIN villages b
        WHERE a.id < b.id
        ON CONFLICT (village_a_id, village_b_id) DO NOTHING;
      `;
      return { success: true };
    } catch (err) {
      console.error('[geospatial] precompute error:', err);
      // Fail silently — table might not exist yet
      return { success: false, error: (err as Error).message };
    }
  }
}
