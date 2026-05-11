import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Commodity Normalization and Deduplication...');

  const allCommodities = await prisma.commodity.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const groups = new Map<string, typeof allCommodities>();

  // Group by normalized name
  for (const c of allCommodities) {
    const normalized = c.name.trim().toLowerCase();
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(c);
  }

  let mergedCount = 0;
  let deletedCount = 0;

  for (const [normalizedName, commodities] of groups.entries()) {
    if (commodities.length > 1) {
      console.log(`Found duplicate for: "${normalizedName}" (${commodities.length} records)`);
      
      const master = commodities[0];
      const duplicates = commodities.slice(1);

      for (const dup of duplicates) {
        console.log(`  Merging "${dup.name}" (ID: ${dup.id}) -> "${master.name}" (ID: ${master.id})`);
        
        await prisma.$transaction(async (tx) => {
          // Remap Inventory
          // Note: If both master and dup have inventory in the SAME village, it violates unique constraint on (villageId, commodityId)
          // We must handle this: if the village already has an inventory for master, we either sum them or just log and skip/delete.
          // Let's check for conflicts.
          const dupInventories = await tx.inventory.findMany({ where: { commodityId: dup.id } });
          for (const inv of dupInventories) {
            const existingMasterInv = await tx.inventory.findUnique({
              where: {
                villageId_commodityId: {
                  villageId: inv.villageId,
                  commodityId: master.id,
                }
              }
            });
            if (existingMasterInv) {
              // Merge stock into master inv, delete dup inv
              await tx.inventory.update({
                where: { id: existingMasterInv.id },
                data: { currentStock: { increment: inv.currentStock } }
              });
              await tx.inventory.delete({ where: { id: inv.id } });
            } else {
              // Just remap
              await tx.inventory.update({
                where: { id: inv.id },
                data: { commodityId: master.id }
              });
            }
          }

          // Remap InventoryHistory
          await tx.inventoryHistory.updateMany({
            where: { commodityId: dup.id },
            data: { commodityId: master.id },
          });

          // Remap InventoryMovement
          await tx.inventoryMovement.updateMany({
            where: { commodityId: dup.id },
            data: { commodityId: master.id },
          });

          // Remap Transaction
          await tx.transaction.updateMany({
            where: { commodityId: dup.id },
            data: { commodityId: master.id },
          });

          // Remap AiRecommendation
          await tx.aiRecommendation.updateMany({
            where: { commodityId: dup.id },
            data: { commodityId: master.id },
          });

          // Delete the duplicate commodity
          await tx.commodity.delete({
            where: { id: dup.id }
          });
          
          deletedCount++;
        });
      }
      mergedCount++;
    } else {
      // Just normalize the name in case it wasn't trimmed/lowercased correctly
      // Actually, updating to lowercase directly
      const c = commodities[0];
      if (c.name !== normalizedName) {
        await prisma.commodity.update({
          where: { id: c.id },
          data: { name: normalizedName }
        });
        console.log(`Normalized name: "${c.name}" -> "${normalizedName}"`);
      }
    }
  }

  console.log(`Migration Complete: Merged ${mergedCount} commodity groups, Deleted ${deletedCount} duplicate records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
