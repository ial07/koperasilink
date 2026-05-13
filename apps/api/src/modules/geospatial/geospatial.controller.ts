import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GeospatialService } from './geospatial.service';

@Controller('geospatial')
@UseGuards(AuthGuard('jwt'))
export class GeospatialController {
  constructor(private readonly geospatialService: GeospatialService) {}

  /**
   * GET /api/v1/geospatial/nearby?lat=-3.46&lng=102.53&radius=50
   * Returns villages within the given radius (km).
   */
  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius ?? '50');

    if (isNaN(latNum) || isNaN(lngNum)) {
      return { error: 'Invalid lat/lng coordinates' };
    }

    return this.geospatialService.findVillagesWithinRadius(
      latNum,
      lngNum,
      radiusNum,
    );
  }

  /**
   * GET /api/v1/geospatial/distance?villageA=xxx&villageB=yyy
   * Returns distance between two villages.
   */
  @Get('distance')
  distance(
    @Query('villageA') villageA: string,
    @Query('villageB') villageB: string,
  ) {
    return this.geospatialService.getDistanceBetweenVillages(
      villageA,
      villageB,
    );
  }

  /**
   * POST-like: trigger precompute route distances
   * (using GET for simplicity in MVP — can be changed to POST later)
   */
  @Get('precompute')
  precompute() {
    return this.geospatialService.precomputeRouteDistances();
  }
}
