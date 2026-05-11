import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { RolesGuard, Roles } from "../strategies/roles.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get("villages")
  async getVillages() {
    return this.authService.getVillages();
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }



  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body("refreshToken") token: string) {
    return this.authService.refreshToken(token);
  }

  @Post("me")
  @UseGuards(AuthGuard("jwt"))
  async me(@Req() req: any) {
    return req.user;
  }
}
