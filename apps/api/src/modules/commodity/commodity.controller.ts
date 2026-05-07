import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CommodityService } from "./commodity.service";

@Controller("commodities")
@UseGuards(AuthGuard("jwt"))
export class CommodityController {
  constructor(private commodityService: CommodityService) {}

  @Post()
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
  update(@Param("id") id: string, @Body() data: any) {
    return this.commodityService.update(id, data);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.commodityService.remove(id);
  }
}
