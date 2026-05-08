import { Controller, Get, Post, Param, Query, UseGuards, Body, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { RolesGuard, Roles } from '../strategies/roles.guard';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('recommendations/generate')
  @Roles('system_admin', 'koperasi_admin')
  generate(
    @Query('maxResults') maxResults: string,
    @Query('radiusKm') radiusKm: string,
  ) {
    return this.aiService.generateRecommendations(
      maxResults ? parseInt(maxResults) : 10,
      radiusKm ? parseFloat(radiusKm) : 50.0
    );
  }

  @Get('recommendations/pending')
  getPending(@Req() req: any) {
    return this.aiService.getPendingRecommendations(req.user);
  }

  @Post('recommendations/:id/accept')
  @Roles('system_admin', 'koperasi_admin', 'bumdes_operator')
  accept(@Param('id') id: string) {
    return this.aiService.acceptRecommendation(id);
  }

  @Post('recommendations/:id/reject')
  @Roles('system_admin', 'koperasi_admin', 'bumdes_operator')
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.aiService.rejectRecommendation(id, reason);
  }
}
