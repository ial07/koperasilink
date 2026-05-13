import { Module } from '@nestjs/common';
import { VillageController } from './village.controller';
import { VillageService } from './village.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [VillageController],
  providers: [VillageService, PrismaService],
  exports: [VillageService],
})
export class VillageModule {}
