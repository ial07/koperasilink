import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(AuthGuard("jwt"))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ) {
    return this.inventoryService.findAll({
      search,
      limit: limit ? parseInt(limit) : undefined,
      page: page ? parseInt(page) : undefined,
    });
  }
}
