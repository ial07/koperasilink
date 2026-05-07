import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { VillageService } from "./village.service";
import type { CreateVillageData } from "./village.service";

@Controller("villages")
@UseGuards(AuthGuard("jwt"))
export class VillageController {
  constructor(private villageService: VillageService) {}

  @Post()
  create(@Body() data: CreateVillageData) {
    return this.villageService.create(data);
  }

  @Get()
  findAll(
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ) {
    return this.villageService.findAll({
      search,
      status,
      limit: limit ? parseInt(limit) : undefined,
      page: page ? parseInt(page) : undefined,
    });
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
