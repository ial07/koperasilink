import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const inv = await prisma.inventory.findMany({ include: { commodity: true } });
  console.log(JSON.stringify(inv, null, 2));
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
