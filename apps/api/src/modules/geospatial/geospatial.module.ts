import { Module } from '@nestjs/common';
import { GeospatialController } from './geospatial.controller';
import { GeospatialService } from './geospatial.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GeospatialController],
  providers: [GeospatialService, PrismaService],
  exports: [GeospatialService],
})
export class GeospatialModule {}
