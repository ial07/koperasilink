import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting UoM Migration...');

  const commodities = await prisma.commodity.findMany();
  console.log(`Found ${commodities.length} commodities.`);

  // Extract unique unit symbols
  const uniqueUnits = new Set<string>();
  for (const c of commodities) {
    if (c.unit) {
      uniqueUnits.add(c.unit.toLowerCase().trim());
    }
  }

  const uomMap = new Map<string, string>(); // symbol -> id

  // Ensure UoMs exist
  for (const symbol of uniqueUnits) {
    let uom = await prisma.unitOfMeasure.findUnique({ where: { symbol } });
    if (!uom) {
      uom = await prisma.unitOfMeasure.create({
        data: { symbol, description: `Satuan ${symbol}` }
      });
      console.log(`Created new UoM: ${symbol}`);
    }
    uomMap.set(symbol, uom.id);
  }

  // Update commodities
  let updatedCount = 0;
  for (const c of commodities) {
    if (c.unit) {
      const normalizedUnit = c.unit.toLowerCase().trim();
      const unitId = uomMap.get(normalizedUnit);
      if (unitId && c.unitId !== unitId) {
        await prisma.commodity.update({
          where: { id: c.id },
          data: { unitId }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Migration Complete: Updated ${updatedCount} commodities with unitId.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
