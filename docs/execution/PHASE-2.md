# PHASE 2: Authentication + RBAC

**Duration:** Week 2 (Days 1-2)  
**Dependencies:** Phase 0 (Docker + database running), Phase 1 (layout + API client)  
**Review After:** User bisa register, login, dan role-based access jalan

---

## Goal

JWT authentication dengan OTP fallback, Role-Based Access Control (6 roles), dan halaman login/register di frontend.

## Task 2.1: Install Auth Dependencies (Backend)

```bash
cd apps/api
pnpm add @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
pnpm add @nestjs/throttler class-validator class-transformer
pnpm add -D @types/passport-jwt @types/bcrypt
```

## Task 2.2: Database Setup — User Model

Prisma schema udah include model `User`. Jalankan migration:

```bash
cd packages/database || cd apps/api
pnpm prisma migrate dev --name add-users
```

**Atau kalo pake prisma di apps/api:**
```bash
cd apps/api
pnpm prisma db push
```

## Task 2.3: NestJS Auth Module Structure

Bikin folder: `apps/api/src/modules/auth/`

```
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── otp.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── decorators/
│   ├── roles.decorator.ts
│   └── current-user.decorator.ts
└── dto/
    ├── register.dto.ts
    ├── login.dto.ts
    ├── otp-request.dto.ts
    └── otp-verify.dto.ts
```

### 2.3.1 DTOs

**File: `modules/auth/dto/register.dto.ts`**
```typescript
import { IsString, IsEmail, IsOptional, IsPhoneNumber, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsPhoneNumber("ID")
  phone: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  villageId?: string;
}
```

**File: `modules/auth/dto/login.dto.ts`**
```typescript
import { IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**File: `modules/auth/dto/otp-request.dto.ts`**
```typescript
import { IsPhoneNumber } from "class-validator";

export class OtpRequestDto {
  @IsPhoneNumber("ID")
  phone: string;
}
```

**File: `modules/auth/dto/otp-verify.dto.ts`**
```typescript
import { IsPhoneNumber, IsString, Length } from "class-validator";

export class OtpVerifyDto {
  @IsPhoneNumber("ID")
  phone: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
```

### 2.3.2 Auth Service

**File: `modules/auth/auth.service.ts`**
```typescript
import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  // In-memory OTP store (production: Redis)
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if phone already exists
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException("Phone number already registered");

    // Hash password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: "koperasi_admin",
        villageId: dto.villageId,
        authProvider: dto.password ? "password" : "otp",
      },
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (!user.passwordHash) {
      throw new BadRequestException("This account uses OTP. Please request OTP instead.");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async requestOtp(phone: string) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 5 min expiry
    this.otpStore.set(phone, {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // TODO: Integrate with WhatsApp/SMS provider
    console.log(`📱 OTP for ${phone}: ${otp}`);

    return { success: true, message: "OTP sent" };
  }

  async verifyOtp(phone: string, otp: string) {
    const stored = this.otpStore.get(phone);
    if (!stored) throw new BadRequestException("No OTP requested");

    if (stored.expiresAt < new Date()) {
      this.otpStore.delete(phone);
      throw new BadRequestException("OTP expired");
    }

    if (stored.otp !== otp) {
      throw new BadRequestException("Invalid OTP");
    }

    this.otpStore.delete(phone);

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { name: phone, phone, role: "koperasi_admin", authProvider: "otp" },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  private generateToken(user: any) {
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
```

### 2.3.3 JWT Strategy

**File: `modules/auth/strategies/jwt.strategy.ts`**
```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../../prisma/prisma.service";

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
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }
    return { id: user.id, name: user.name, role: user.role, phone: user.phone, villageId: user.villageId };
  }
}
```

### 2.3.4 Guards

**File: `modules/auth/guards/jwt-auth.guard.ts`**
```typescript
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
```

**File: `modules/auth/guards/roles.guard.ts`**
```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### 2.3.5 Decorators

**File: `modules/auth/decorators/roles.decorator.ts`**
```typescript
import { SetMetadata } from "@nestjs/common";

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
```

**File: `modules/auth/decorators/current-user.decorator.ts`**
```typescript
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

### 2.3.6 Auth Controller

**File: `modules/auth/auth.controller.ts`**
```typescript
import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { OtpRequestDto } from "./dto/otp-request.dto";
import { OtpVerifyDto } from "./dto/otp-verify.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("otp/request")
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post("otp/verify")
  verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me")
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

### 2.3.7 Auth Module

**File: `modules/auth/auth.module.ts`**
```typescript
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev-secret",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

## Task 2.4: Update AppModule

**File: `apps/api/src/app.module.ts`**
```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,  // All routes authenticated by default
    },
  ],
})
export class AppModule {}
```

## Task 2.5: Public Endpoint Decorator

Biar endpoint tertentu bisa diakses tanpa auth (login, register):

**File: `apps/api/src/modules/auth/decorators/public.decorator.ts`**
```typescript
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Update AppModule:**
```typescript
// Tambahin skip logic di provider:
{
  provide: APP_GUARD,
  useClass: class implements CanActivate {
    constructor(
      private reflector: Reflector,
      private jwtGuard: JwtAuthGuard,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) return true;
      return this.jwtGuard.canActivate(context);
    }
  },
}
```

**Atau simpler:** Pasang `@UseGuards(JwtAuthGuard)` selectively di controller yang perlu auth. Kosongin `APP_GUARD` di root.

## Task 2.6: Login/Register Frontend Pages

### 2.6.1 Login page

**File: `apps/web/app/login/page.tsx`**
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";

const loginSchema = z.object({
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", data);
      localStorage.setItem("token", response.data.token);
      toast.success("Login successful");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">KoperasiLink</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="08123456789" {...register("phone")} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <a href="/register" className="text-primary hover:underline">Register</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.6.2 Register page

**File: `apps/web/app/register/page.tsx`** — similar pattern dengan form register.

## Validation Checklist

- [ ] `POST /api/v1/auth/register` creates user and returns JWT
- [ ] `POST /api/v1/auth/login` authenticates with phone + password
- [ ] `POST /api/v1/auth/otp/request` generates OTP and logs to console
- [ ] `POST /api/v1/auth/otp/verify` validates OTP and returns JWT
- [ ] Protected routes reject requests without JWT (401)
- [ ] RBAC: `@Roles('system_admin')` blocks non-admin users (403)
- [ ] Login page renders and submits correctly
- [ ] Register page renders and submits correctly
- [ ] JWT stored in localStorage, API client sends it in headers
- [ ] 401 response clears token and redirects to login

## Git Checkpoint

```bash
git add .
git commit -m "phase-2: authentication - jwt, otp, rbac, login/register pages"
git tag phase-2
```
