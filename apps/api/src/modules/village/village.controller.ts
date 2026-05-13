import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VillageService } from './village.service';
import type { CreateVillageData } from './village.service';
import { RolesGuard, Roles } from '../strategies/roles.guard';

@Controller('villages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VillageController {
  constructor(private villageService: VillageService) {}

  @Post()
  @Roles('system_admin', 'koperasi_admin')
  create(@Body() data: CreateVillageData) {
    return this.villageService.create(data);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.villageService.findAll({
      search,
      status,
      limit: limit ? parseInt(limit) : undefined,
      page: page ? parseInt(page) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.villageService.findOne(id);
  }

  @Patch(':id')
  @Roles('system_admin', 'koperasi_admin')
  update(@Param('id') id: string, @Body() data: any) {
    return this.villageService.update(id, data);
  }

  @Delete(':id')
  @Roles('system_admin', 'koperasi_admin')
  remove(@Param('id') id: string) {
    return this.villageService.remove(id);
  }
}
