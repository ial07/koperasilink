import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeospatialService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find villages within a given radius (km) from a coordinate point using Haversine formula in pure SQL.
   */
  async findVillagesWithinRadius(lat: number, lng: number, radiusKm: number) {
    return this.prisma.$queryRaw`
      SELECT id, name, subdistrict, district, latitude, longitude,
        main_commodities, population,
        (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )
        ) AS distance_km
      FROM villages
      WHERE status = 'active'
      AND (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )
        ) <= ${radiusKm}
      ORDER BY distance_km;
    `;
  }

  /**
   * Get the straight-line distance between two villages by their IDs using Haversine.
   */
  async getDistanceBetweenVillages(villageAId: string, villageBId: string) {
    return this.prisma.$queryRaw`
      SELECT
        a.id AS village_a_id,
        a.name AS village_a_name,
        b.id AS village_b_id,
        b.name AS village_b_name,
        (
          6371 * acos(
            cos(radians(a.latitude)) * cos(radians(b.latitude)) *
            cos(radians(b.longitude) - radians(a.longitude)) +
            sin(radians(a.latitude)) * sin(radians(b.latitude))
          )
        ) AS distance_km
      FROM villages a, villages b
      WHERE a.id = ${villageAId} AND b.id = ${villageBId};
    `;
  }

  /**
   * Compute route distances for all village pairs.
   */
  async precomputeRouteDistances() {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO village_routes (village_a_id, village_b_id, distance_km)
        SELECT a.id, b.id,
          (
            6371 * acos(
              cos(radians(a.latitude)) * cos(radians(b.latitude)) *
              cos(radians(b.longitude) - radians(a.longitude)) +
              sin(radians(a.latitude)) * sin(radians(b.latitude))
            )
          )
        FROM villages a
        CROSS JOIN villages b
        WHERE a.id < b.id
        ON CONFLICT (village_a_id, village_b_id) DO NOTHING;
      `;
      return { success: true };
    } catch (err) {
      console.error('[geospatial] precompute error:', err);
      return { success: false, error: (err as Error).message };
    }
  }
}
