# PHASE 9: Transaction Lifecycle + Stock Adjustment

**Duration:** Week 8  
**Dependencies:** Phase 8 (Recommendations feed transactions)  
**Review After:** Full transaction flow: accept recommendation → pending → confirmed → in_transit → completed

---

## Goal

Full transaction lifecycle, status state machine, auto stock adjustment on completion, transaction history, filterable list.

## Task 9.1: Status State Machine

**File: `apps/api/src/modules/transaction/utils/status-machine.ts`**
```typescript
export const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_transit", "cancelled"],
  in_transit: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return TRANSITIONS[from]?.includes(to) || false;
}

export function getNextStatus(from: string): string[] {
  return TRANSITIONS[from] || [];
}
```

## Task 9.2: Transaction Service

**File: `apps/api/src/modules/transaction/transaction.service.ts`**
```typescript
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { isValidTransition, getNextStatus } from "./utils/status-machine";

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async createFromRecommendation(recommendationId: string, userId: string) {
    const recommendation = await this.prisma.aiRecommendation.findUnique({
      where: { id: recommendationId },
    });
    if (!recommendation) throw new NotFoundException("Recommendation not found");
    if (recommendation.status !== "accepted") {
      throw new BadRequestException("Recommendation must be accepted first");
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          fromVillageId: recommendation.fromVillageId,
          toVillageId: recommendation.toVillageId,
          commodityId: recommendation.commodityId,
          quantity: recommendation.matchQty,
          unitPrice: 0, // TODO: get from inventory
          shippingCost: 0,
          status: "pending",
          aiRecommended: true,
          recommendationId: recommendation.id,
          createdBy: userId,
        },
      });

      await tx.aiRecommendation.update({
        where: { id: recommendationId },
        data: { status: "converted" },
      });

      return transaction;
    });
  }

  async updateStatus(id: string, newStatus: string, userId?: string) {
    const existing = await this.prisma.transaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Transaction not found");
    if (!isValidTransition(existing.status, newStatus)) {
      throw new BadRequestException(
        `Invalid transition: ${existing.status} → ${newStatus}. Allowed: ${getNextStatus(existing.status).join(", ")}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { status: newStatus };
      switch (newStatus) {
        case "confirmed":
          updateData.confirmedAt = new Date();
          break;
        case "in_transit":
          updateData.shippedAt = new Date();
          break;
        case "completed":
          updateData.completedAt = new Date();
          await this.adjustInventory(tx, existing);
          break;
        case "cancelled":
          updateData.cancelledAt = new Date();
          break;
      }

      return tx.transaction.update({ where: { id }, data: updateData });
    });
  }

  private async adjustInventory(tx: any, t: any) {
    // Deduct from source
    await tx.inventory.update({
      where: { villageId_commodityId: { villageId: t.fromVillageId, commodityId: t.commodityId } },
      data: { currentStock: { decrement: t.quantity }, lastUpdated: new Date() },
    });

    // Add to target (upsert)
    await tx.inventory.upsert({
      where: { villageId_commodityId: { villageId: t.toVillageId, commodityId: t.commodityId } },
      update: { currentStock: { increment: t.quantity }, lastUpdated: new Date() },
      create: {
        villageId: t.toVillageId,
        commodityId: t.commodityId,
        currentStock: t.quantity,
        capacity: t.quantity * 2,
        lastUpdated: new Date(),
      },
    });
  }

  async findAll(filters: { page?: number; limit?: number; status?: string; villageId?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.villageId) {
      where.OR = [{ fromVillageId: filters.villageId }, { toVillageId: filters.villageId }];
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          fromVillage: { select: { id: true, name: true } },
          toVillage: { select: { id: true, name: true } },
          commodity: { select: { id: true, name: true, unit: true } },
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page: filters.page || 1 };
  }
}
```

## Task 9.3: Transaction Controller

**File: `apps/api/src/modules/transaction/transaction.controller.ts`**
```typescript
@Controller('transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Post('from-recommendation/:recommendationId')
  createFromRecomendation(@Param('recommendationId') id: string, @CurrentUser() user: any) {
    return this.transactionService.createFromRecommendation(id, user.id);
  }

  @Get()
  findAll(@Query() query: QueryTransactionDto) {
    return this.transactionService.findAll(query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: any) {
    return this.transactionService.updateStatus(id, dto.status, user.id);
  }
}
```

## Task 9.4: Frontend — Transaction Pages

### Transaction List (`app/dashboard/transactions/page.tsx`):
- Tabs: All | Pending | Confirmed | In Transit | Completed | Cancelled
- Table: Date | From → To | Commodity | Qty | Status badge | Actions
- Search/filter by village name
- Pagination

### Transaction Detail (`app/dashboard/transactions/[id]/page.tsx`):
- Status timeline (visual: pending → confirmed → in_transit → completed)
- Transaction info cards (source, target, commodity, pricing)
- Action buttons visible only for valid next states
- Loading, empty, error states

### Accept → Create Transaction flow:
When user clicks "Accept" on a recommendation card:
1. Call `POST /transactions/from-recommendation/:id`
2. Toast success
3. Redirect to `/dashboard/transactions` showing pending transaction
4. From there user can confirm → mark in transit → complete

## Task 9.5: Prisma Schema Update

Make sure the `Transaction` model has the right fields:
```prisma
model Transaction {
  id               String   @id @default(cuid())
  fromVillageId    String
  toVillageId      String
  commodityId      String
  quantity         Float
  unitPrice        Float    @default(0)
  shippingCost     Float    @default(0)
  status           String   @default("pending")
  aiRecommended    Boolean  @default(false)
  recommendationId String?
  createdBy        String
  confirmedAt      DateTime?
  shippedAt        DateTime?
  completedAt      DateTime?
  cancelledAt      DateTime?
  cancellationReason String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  fromVillage     Village          @relation("FromVillage", fields: [fromVillageId], references: [id])
  toVillage       Village          @relation("ToVillage", fields: [toVillageId], references: [id])
  commodity       Commodity        @relation(fields: [commodityId], references: [id])
  createdByUser   User             @relation(fields: [createdBy], references: [id])
}
```

## Validation Checklist

- [ ] Full flow: Accept recommendation → create pending transaction
- [ ] Status transitions enforced by state machine
- [ ] Invalid transitions return 400 with allowed states
- [ ] Stock adjusts correctly on completion (source -, target +)
- [ ] Transaction list filterable by status, village, date
- [ ] Transaction detail shows timeline
- [ ] Action buttons visible only for valid next states
- [ ] Loading/empty/error states on all pages
- [ ] Empty state when no transactions

## Git Checkpoint

```bash
git add .
git commit -m "phase-9: transaction lifecycle with state machine and stock adjustment"
git tag phase-9
```
