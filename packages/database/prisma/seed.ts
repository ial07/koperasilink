import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with Rejang Lebong initial data...')

  // Insert UoMs
  const kg = await prisma.unitOfMeasure.upsert({
    where: { symbol: 'kg' },
    update: {},
    create: { symbol: 'kg', description: 'Kilogram' }
  })

  // Insert Commodities
  const chili = await prisma.commodity.upsert({
    where: { name: 'Cabai Merah' },
    update: {},
    create: {
      name: 'Cabai Merah',
      category: 'vegetables',
      unitId: kg.id,
      perishability: 'high',
      shelfLifeDays: 7
    }
  })

  const coffee = await prisma.commodity.upsert({
    where: { name: 'Kopi Robusta' },
    update: {},
    create: {
      name: 'Kopi Robusta',
      category: 'grains',
      unitId: kg.id,
      perishability: 'low',
      shelfLifeDays: 180
    }
  })

  // Insert Rejang Lebong Villages
  const selupu = await prisma.village.upsert({
    where: { code: '17.02.01.2001' },
    update: {},
    create: {
      name: 'Sumber Urip',
      code: '17.02.01.2001',
      subdistrict: 'Selupu Rejang',
      district: 'Rejang Lebong',
      province: 'Bengkulu',
      latitude: -3.4682,
      longitude: 102.5831,
      mainCommodities: ['Cabai Merah', 'Kopi Robusta']
    }
  })

  const curup = await prisma.village.upsert({
    where: { code: '17.02.02.2002' },
    update: {},
    create: {
      name: 'Batu Dewa',
      code: '17.02.02.2002',
      subdistrict: 'Curup Utara',
      district: 'Rejang Lebong',
      province: 'Bengkulu',
      latitude: -3.4501,
      longitude: 102.5321,
      mainCommodities: ['Kopi Robusta']
    }
  })

  // Insert Inventory
  await prisma.inventory.upsert({
    where: {
      villageId_commodityId: {
        villageId: selupu.id,
        commodityId: chili.id
      }
    },
    update: {},
    create: {
      villageId: selupu.id,
      commodityId: chili.id,
      currentStock: 2000,
      capacity: 5000,
      unitPrice: 35000
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
