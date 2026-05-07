import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev-secret",
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) throw new UnauthorizedException("User not found or inactive");
    
    // Fetch village relation to ensure fallback if direct villageId is null
    const villageUser = await this.prisma.village_users.findFirst({
      where: { userId: user.id },
    });

    const villageId = user.villageId || villageUser?.villageId || null;

    return { id: user.id, phone: user.phone, role: user.role, name: user.name, villageId };
  }
}
