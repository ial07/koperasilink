import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TransactionService } from "./transaction.service";

@Controller("transactions")
@UseGuards(AuthGuard("jwt"))
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ) {
    return this.transactionService.findAll(req.user, {
      limit: limit ? parseInt(limit) : undefined,
      page: page ? parseInt(page) : undefined,
    });
  }

  @Post("from-recommendation/:recommendationId")
  createFromRecommendation(@Param("recommendationId") id: string, @Req() req: any) {
    return this.transactionService.createFromRecommendation(id, req.user.id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Query("status") status: string) {
    return this.transactionService.updateStatus(id, status);
  }
}
