import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, LoginDto, VerifyOtpDto, RequestOtpDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) throw new ConflictException("Phone already registered");

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword,
        villageId: dto.villageId,
        role: "bumdes_operator",
      },
    });

    // Send OTP after registration
    await this.sendOtp(dto.phone);

    return {
      message: "User created. Please verify your phone with OTP.",
      userId: user.id,
      phone: user.phone,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    if (!user.verified) {
      throw new UnauthorizedException("Phone not verified. Please verify OTP first.");
    }

    return this.generateTokens(user.id, user.phone, user.role);
  }

  async sendOtp(phone: string) {
    // In production: send real SMS via Twilio/WhatsApp API
    // For dev: always return OTP 123456
    const code = "123456";
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.oTP.create({
      data: { phone, code, expiresAt },
    });

    return { message: "OTP sent", phone };
  }

  async requestOtp(dto: RequestOtpDto) {
    return this.sendOtp(dto.phone);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otp = await this.prisma.oTP.findFirst({
      where: {
        phone: dto.phone,
        code: dto.code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    await this.prisma.oTP.update({
      where: { id: otp.id },
      data: { used: true },
    });

    await this.prisma.user.updateMany({
      where: { phone: dto.phone },
      data: { verified: true },
    });

    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
    });

    return this.generateTokens(user!.id, user!.phone, user!.role);
  }

  async refreshToken(oldToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user) throw new UnauthorizedException("User not found");

    // Delete old token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(user.id, user.phone, user.role);
  }

  private async generateTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: "15m" });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
