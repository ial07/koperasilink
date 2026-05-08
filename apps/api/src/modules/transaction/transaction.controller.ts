import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
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
}
