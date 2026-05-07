import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { RolesGuard, Roles } from '../strategies/roles.guard';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('supply')
  findSurplus(@Query('commodityId') commodityId: string) {
    if (!commodityId) return { error: 'commodityId is required' };
    return this.inventoryService.findSurplusForCommodity(commodityId);
  }

  @Get('village/:villageId')
  findByVillage(@Param('villageId') villageId: string) {
    return this.inventoryService.findByVillage(villageId);
  }

  @Post()
  @Roles('system_admin', 'koperasi_admin', 'bumdes_operator')
  create(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.create(dto);
  }

  @Put(':id')
  @Roles('system_admin', 'koperasi_admin', 'bumdes_operator')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @Roles('system_admin', 'koperasi_admin', 'bumdes_operator')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
