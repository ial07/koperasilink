import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { VillageService } from "./village.service";

@Controller("villages")
@UseGuards(AuthGuard("jwt"))
export class VillageController {
  constructor(private villageService: VillageService) {}

  @Post()
  create(@Body() data: { name: string; subdistrict: string; latitude: number; longitude: number }) {
    return this.villageService.create(data);
  }

  @Get()
  findAll() {
    return this.villageService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.villageService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.villageService.update(id, data);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.villageService.remove(id);
  }
}
