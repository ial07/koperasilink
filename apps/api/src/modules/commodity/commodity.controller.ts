import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommodityService } from './commodity.service';
import { RolesGuard, Roles } from '../strategies/roles.guard';

@Controller('commodities')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CommodityController {
  constructor(private commodityService: CommodityService) {}

  @Post()
  @Roles('system_admin', 'koperasi_admin')
  create(
    @Body()
    data: {
      name: string;
      nameLocal?: string;
      category: string;
      unitId: string;
      perishability: string;
      shelfLifeDays?: number;
    },
  ) {
    return this.commodityService.create(data);
  }

  @Get('uoms')
  getUoms() {
    return this.commodityService.getUoms();
  }

  @Get()
  findAll(@Query('all') all: string) {
    const activeOnly = all !== 'true';
    return this.commodityService.findAll(activeOnly);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commodityService.findOne(id);
  }

  @Patch(':id')
  @Roles('system_admin', 'koperasi_admin')
  update(@Param('id') id: string, @Body() data: any) {
    return this.commodityService.update(id, data);
  }

  @Delete(':id')
  @Roles('system_admin', 'koperasi_admin')
  remove(@Param('id') id: string) {
    return this.commodityService.deactivate(id);
  }
}
