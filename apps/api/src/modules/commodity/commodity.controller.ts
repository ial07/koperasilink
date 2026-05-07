import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CommodityService } from "./commodity.service";
import { RolesGuard, Roles } from "../strategies/roles.guard";

@Controller("commodities")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class CommodityController {
  constructor(private commodityService: CommodityService) {}

  @Post()
  @Roles("system_admin", "koperasi_admin")
  create(
    @Body()
    data: {
      name: string;
      nameLocal?: string;
      category: string;
      unit: string;
      perishability: string;
      shelfLifeDays?: number;
    },
  ) {
    return this.commodityService.create(data);
  }

  @Get()
  findAll() {
    return this.commodityService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.commodityService.findOne(id);
  }

  @Patch(":id")
  @Roles("system_admin", "koperasi_admin")
  update(@Param("id") id: string, @Body() data: any) {
    return this.commodityService.update(id, data);
  }

  @Delete(":id")
  @Roles("system_admin", "koperasi_admin")
  remove(@Param("id") id: string) {
    return this.commodityService.remove(id);
  }
}
