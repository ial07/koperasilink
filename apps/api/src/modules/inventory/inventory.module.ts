import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { InventoryMovementService } from "./inventory-movement.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryMovementService, PrismaService],
  exports: [InventoryService, InventoryMovementService],
})
export class InventoryModule {}
