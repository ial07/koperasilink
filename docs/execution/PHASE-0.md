# PHASE 0: Monorepo + Database Schema + Docker

**Duration:** Week 1 (Days 1-3)  
**Dependencies:** None (root phase)  
**Review After:** Semua service bisa `docker compose up` dan migration jalan

---

## Goal

Bikin fondasi project: monorepo pake Turborepo + pnpm, scaffold semua service, database schema, Docker Compose, CI pipeline.

## Task 0.1: Init Monorepo

### 0.1.1 Setup pnpm + Turborepo

```bash
cd /Users/mm/Public/IALWorks/AI/koperasilink

# Init package.json
pnpm init

# Add Turborepo
pnpm add -D turbo --filter root
```

**File: `package.json`**
```json
{
  "name": "koperasilink",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

### 0.1.2 Workspace config

**File: `pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

**File: `turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "lint": {},
    "type-check": {},
    "test": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

### 0.1.3 Git init + ignore

```bash
git init
```

**File: `.gitignore`**
```
node_modules/
dist/
.next/
.env
.env.local
*.log
.DS_Store
services/ai/venv/
__pycache__/
*.pyc
```

## Task 0.2: Scaffold NestJS API

### 0.2.1 Create NestJS project

```bash
pnpm create nest apps/api
```

### 0.2.2 Update package.json name

**File: `apps/api/package.json`** — ubah name jadi `@koperasilink/api`

### 0.2.3 Setup main.ts (CORS + port + prefix)

**File: `apps/api/src/main.ts`**
```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");

  app.enableCors({
    origin: ["http://localhost:3000"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(4000);
  console.log("🚀 API running on http://localhost:4000/api/v1");
}
bootstrap();
```

### 0.2.4 Setup Prisma

```bash
cd /Users/mm/Public/IALWorks/AI/koperasilink/apps/api
pnpm add @prisma/client
pnpm add -D prisma
pnpm prisma init
```

### 0.2.5 Create Prisma Module

**File: `apps/api/src/prisma/prisma.module.ts`**
```typescript
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**File: `apps/api/src/prisma/prisma.service.ts`**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## Task 0.3: Scaffold Next.js Frontend

```bash
pnpm create next-app@latest apps/web --typescript --tailwind --app --src-dir=false
```

### 0.3.1 Setup next.config.ts

**File: `apps/web/next.config.ts`**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

### 0.3.2 Root layout

**File: `apps/web/app/layout.tsx`**
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoperasiLink",
  description: "AI-powered village supply chain platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
```

### 0.3.3 Landing page

**File: `apps/web/app/page.tsx`**
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">KoperasiLink</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        AI-powered village supply chain platform
      </p>
    </main>
  );
}
```

## Task 0.4: Scaffold Python FastAPI AI Service

### 0.4.1 Create folder structure

```bash
mkdir -p services/ai/app/api/v1 services/ai/tests
cd services/ai
python3 -m venv venv
```

### 0.4.2 Main app

**File: `services/ai/app/main.py`**
```python
from fastapi import FastAPI
from app.api.v1.health import router as health_router

app = FastAPI(title="KoperasiLink AI Service", version="0.1.0")
app.include_router(health_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"service": "KoperasiLink AI", "status": "running", "version": "0.1.0"}
```

### 0.4.3 Health endpoint

**File: `services/ai/app/api/v1/health.py`**
```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-engine"}
```

### 0.4.4 Dependencies

**File: `services/ai/requirements.txt`**
```
fastapi==0.110.*
uvicorn[standard]==0.29.*
pydantic==2.7.*
pydantic-settings==2.2.*
httpx==0.27.*
asyncpg==0.29.*
pytest==8.*
```

### 0.4.5 Dockerfile

**File: `services/ai/Dockerfile`**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Task 0.5: Shared Packages

### 0.5.1 Shared types

**File: `packages/shared-types/package.json`**
```json
{
  "name": "@koperasilink/shared-types",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

**File: `packages/shared-types/src/index.ts`**
```typescript
export interface Village {
  id: string;
  name: string;
  subdistrict: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  population?: number;
  mainCommodities: string[];
  status: "active" | "inactive" | "pending";
}

export interface Commodity {
  id: string;
  name: string;
  nameLocal?: string;
  category: "vegetables" | "fruits" | "grains" | "spices" | "livestock" | "fishery" | "processed" | "other";
  unit: "kg" | "ton" | "ikat" | "butir" | "ekor" | "liter";
  perishability: "high" | "medium" | "low";
  shelfLifeDays?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: "koperasi_admin" | "bumdes_operator" | "distributor" | "government" | "farmer" | "system_admin";
  villageId?: string;
}

export type VillageStatus = "surplus" | "shortage" | "balanced";
export type TransactionStatus = "pending" | "confirmed" | "in_transit" | "completed" | "cancelled";
export type RecommendationStatus = "pending" | "accepted" | "rejected" | "expired" | "converted";
```

### 0.5.2 Validation package

**File: `packages/validation/package.json`**
```json
{
  "name": "@koperasilink/validation",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

## Task 0.6: Docker Compose

### 0.6.1 Dockerfiles

**File: `infra/docker/Dockerfile.api`**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @koperasilink/api build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]
```

**File: `infra/docker/Dockerfile.web`**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web/ ./apps/web/
COPY packages/ ./packages/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @koperasilink/web build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules
CMD ["pnpm", "--filter", "@koperasilink/web", "start"]
```

### 0.6.2 docker-compose.yml

**File: `infra/docker/docker-compose.yml`**
```yaml
version: "3.8"

services:
  postgres:
    image: postgis/postgis:16-3.4
    container_name: koperasilink-db
    environment:
      POSTGRES_DB: koperasilink
      POSTGRES_USER: koperasi
      POSTGRES_PASSWORD: koperasi_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U koperasi -d koperasilink"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: koperasilink-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.api
    container_name: koperasilink-api
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://koperasi:koperasi_dev@postgres:5432/koperasilink?schema=public
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  ai:
    build:
      context: ../../services/ai
      dockerfile: Dockerfile
    container_name: koperasilink-ai
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://koperasi:koperasi_dev@postgres:5432/koperasilink?schema=public
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.web
    container_name: koperasilink-web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api/v1
    depends_on:
      - api

volumes:
  pgdata:
```

## Task 0.7: Environment Setup

**File: `.env.example`**
```
DATABASE_URL=postgresql://koperasi:koperasi_dev@localhost:5432/koperasilink?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production-please
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_AI_URL=http://localhost:8000/api/v1
AI_DATABASE_URL=postgresql://koperasi:koperasi_dev@localhost:5432/koperasilink?schema=public
```

## Task 0.8: CI Pipeline

**File: `.github/workflows/ci.yml`**
```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo type-check

  build:
    needs: [lint, type-check]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build
```

## Validation Checklist

- [ ] `pnpm install` runs without error
- [ ] `pnpm turbo build` builds all packages
- [ ] `docker compose -f infra/docker/docker-compose.yml up` boots postgres, redis, api, ai, web
- [ ] `curl http://localhost:8000/api/v1/health` returns `{"status": "healthy"}`
- [ ] Next.js dev server runs: `pnpm --filter @koperasilink/web dev`
- [ ] Git repo initialized

## Git Checkpoint

```bash
git add .
git commit -m "phase-0: monorepo foundation, docker, ci"
git tag phase-0
```
