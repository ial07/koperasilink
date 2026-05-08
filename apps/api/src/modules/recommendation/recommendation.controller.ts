import { Controller, Get, Post, Patch, Param, Query } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";

@Controller("recommendations")
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Post("generate")
  async generate() {
    return this.recommendationService.generate();
  }

  @Get()
  async findAll(
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.recommendationService.findAll({
      status: status || "all",
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Patch(":id/accept")
  async accept(@Param("id") id: string) {
    return this.recommendationService.updateStatus(id, "accepted");
  }

  @Patch(":id/reject")
  async reject(@Param("id") id: string) {
    return this.recommendationService.updateStatus(id, "rejected");
  }
}
