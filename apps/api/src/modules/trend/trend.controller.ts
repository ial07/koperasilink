import { Controller, Get, Param, Query } from '@nestjs/common';
import { TrendAnalysisService } from './trend-analysis.service';

@Controller('trend')
export class TrendController {
  constructor(private readonly trendService: TrendAnalysisService) {}

  @Get('predict/:villageId/:commodityId')
  async predict(
    @Param('villageId') villageId: string,
    @Param('commodityId') commodityId: string,
  ) {
    return this.trendService.predictDemand(villageId, commodityId);
  }

  @Get('predict-all')
  async predictAll() {
    return this.trendService.predictAll();
  }

  @Get('shortage')
  async predictedShortage() {
    return this.trendService.findPredictedShortage();
  }

  @Get('surplus')
  async predictedSurplus() {
    return this.trendService.findPredictedSurplus();
  }
}
