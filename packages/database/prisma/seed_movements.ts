import { PrismaClient, MovementType, SourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting movement migration...');

  // Get all inventories that have stock but no movements
  const inventories = await prisma.inventory.findMany({
    where: {
      currentStock: { gt: 0 },
      movements: { none: {} }
    }
  });

  console.log(`Found ${inventories.length} inventory records needing initial movements.`);

  let createdCount = 0;

  for (const inv of inventories) {
    try {
      await prisma.inventoryMovement.create({
        data: {
          inventoryId: inv.id,
          villageId: inv.villageId,
          commodityId: inv.commodityId,
          type: MovementType.ADJUSTMENT,
          quantity: inv.currentStock,
          sourceType: SourceType.SYSTEM,
          notes: 'Initial Migration Balance',
        }
      });
      createdCount++;
    } catch (e) {
      console.error(`Error creating movement for inventory ${inv.id}:`, e);
    }
  }

  console.log(`Successfully created ${createdCount} initial movements.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
