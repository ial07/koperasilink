import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpi')
  async getKpi() {
    return this.dashboardService.getKpi();
  }

  @Get('village-conditions')
  async getVillageConditions() {
    return this.dashboardService.getVillageConditions();
  }

  @Get('recent-activity')
  async getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('trends/prices')
  async getPriceTrends(
    @Query('commodityId') commodityId?: string,
    @Query('days') days?: number,
  ) {
    return this.dashboardService.getPriceTrends(commodityId, days || 7);
  }
}
