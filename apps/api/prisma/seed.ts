import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const villages = [
  { name: "Air Duku", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.454, longitude: 102.536 },
  { name: "Air Meles Bawah", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.458, longitude: 102.546 },
  { name: "Air Meles Atas", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.460, longitude: 102.550 },
  { name: "Batu Galing", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.462, longitude: 102.520 },
  { name: "Talang Rimbo Baru", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.448, longitude: 102.528 },
  { name: "Talang Rimbo Lama", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.445, longitude: 102.525 },
  { name: "Duku Ilir", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.450, longitude: 102.540 },
  { name: "Duku Ulu", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.447, longitude: 102.542 },
  { name: "Kesambi", subdistrict: "Padang Ulak Tanding", district: "Rejang Lebong", latitude: -3.410, longitude: 102.490 },
  { name: "Teladan", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.470, longitude: 102.515 },
  { name: "Pasar Baru", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.466, longitude: 102.518 },
  { name: "Sukaraja", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.455, longitude: 102.555 },
  { name: "Karang Anyar", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.452, longitude: 102.560 },
  { name: "Perbo", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.475, longitude: 102.510 },
  { name: "Timbul Rejo", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.478, longitude: 102.505 },
  { name: "Pagar Gunung", subdistrict: "Padang Ulak Tanding", district: "Rejang Lebong", latitude: -3.420, longitude: 102.480 },
  { name: "Sari Mulyo", subdistrict: "Padang Ulak Tanding", district: "Rejang Lebong", latitude: -3.430, longitude: 102.475 },
  { name: "Campur Kenanga", subdistrict: "Padang Ulak Tanding", district: "Rejang Lebong", latitude: -3.415, longitude: 102.468 },
  { name: "Karya Baru", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.443, longitude: 102.532 },
  { name: "Taba Jambu", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.438, longitude: 102.535 },
];

const commodities = [
  { name: "Kopi Robusta", nameLocal: "Kopi", category: "spices", unit: "kg", perishability: "low", shelfLifeDays: 365 },
  { name: "Padi", nameLocal: "Gabah", category: "grains", unit: "ton", perishability: "low", shelfLifeDays: 180 },
  { name: "Cabai Merah", nameLocal: "Cabe", category: "vegetables", unit: "kg", perishability: "high", shelfLifeDays: 7 },
  { name: "Bawang Merah", nameLocal: "Bawang", category: "vegetables", unit: "kg", perishability: "medium", shelfLifeDays: 30 },
  { name: "Kangkung", nameLocal: "Kangkong", category: "vegetables", unit: "ikat", perishability: "high", shelfLifeDays: 3 },
  { name: "Bayam", nameLocal: "Bayem", category: "vegetables", unit: "ikat", perishability: "high", shelfLifeDays: 2 },
  { name: "Jahe", nameLocal: "Jae", category: "spices", unit: "kg", perishability: "low", shelfLifeDays: 90 },
  { name: "Kunyit", nameLocal: "Kunir", category: "spices", unit: "kg", perishability: "low", shelfLifeDays: 90 },
  { name: "Pisang", nameLocal: "Gedang", category: "fruits", unit: "kg", perishability: "high", shelfLifeDays: 5 },
  { name: "Alpukat", nameLocal: "Avokad", category: "fruits", unit: "kg", perishability: "medium", shelfLifeDays: 7 },
];

/**
 * Setiap desa punya profil stok yang jelas:
 * - Surplus: stok ≥ 70% capacity
 * - Shortage: stok ≤ 20% capacity
 * - Balanced: di antaranya
 */
const villageInventory: Array<{
  villageIndex: number;
  commodityName: string;
  stock: number;
  capacity: number;
  price: number;
}> = [
  // ── SURPLUS ──
  { villageIndex: 3,  commodityName: "Kopi Robusta", stock: 4200, capacity: 5000, price: 35000 },  // 84%
  { villageIndex: 3,  commodityName: "Cabai Merah",  stock: 80,   capacity: 500,  price: 25000 },
  { villageIndex: 8,  commodityName: "Kopi Robusta", stock: 3800, capacity: 4000, price: 32000 },  // 95%
  { villageIndex: 8,  commodityName: "Jahe",         stock: 600,  capacity: 800,  price: 15000 },
  { villageIndex: 1,  commodityName: "Kopi Robusta", stock: 2000, capacity: 3000, price: 34000 },  // 67%

  // ── SHORTAGE ──
  { villageIndex: 6,  commodityName: "Cabai Merah",  stock: 15,   capacity: 400,  price: 30000 },  // 4%
  { villageIndex: 6,  commodityName: "Bawang Merah", stock: 30,   capacity: 300,  price: 20000 },  // 10%
  { villageIndex: 14, commodityName: "Padi",         stock: 0.5,  capacity: 6,    price: 5500000 }, // 8%
  { villageIndex: 14, commodityName: "Kangkung",     stock: 10,   capacity: 200,  price: 3000 },
  { villageIndex: 0,  commodityName: "Cabai Merah",  stock: 10,   capacity: 300,  price: 27000 },
  { villageIndex: 0,  commodityName: "Kopi Robusta", stock: 250,  capacity: 2000, price: 33000 },

  // ── BALANCED ──
  { villageIndex: 9,  commodityName: "Cabai Merah",  stock: 150,  capacity: 400,  price: 26000 },
  { villageIndex: 9,  commodityName: "Bawang Merah", stock: 120,  capacity: 300,  price: 18000 },
  { villageIndex: 12, commodityName: "Kopi Robusta", stock: 1500, capacity: 3000, price: 31000 },
  { villageIndex: 12, commodityName: "Jahe",         stock: 300,  capacity: 600,  price: 14000 },
  { villageIndex: 12, commodityName: "Kunyit",       stock: 400,  capacity: 700,  price: 12000 },
  { villageIndex: 2,  commodityName: "Bayam",        stock: 80,   capacity: 150,  price: 4000 },
  { villageIndex: 2,  commodityName: "Kangkung",     stock: 100,  capacity: 200,  price: 3500 },

  // ── EXTRA ──
  { villageIndex: 11, commodityName: "Padi",         stock: 8,    capacity: 10,   price: 5000000 },
  { villageIndex: 11, commodityName: "Cabai Merah",  stock: 20,   capacity: 200,  price: 28000 },
  { villageIndex: 4,  commodityName: "Padi",         stock: 6,    capacity: 8,    price: 5200000 },
  { villageIndex: 5,  commodityName: "Pisang",       stock: 400,  capacity: 500,  price: 8000 },
  { villageIndex: 7,  commodityName: "Alpukat",      stock: 60,   capacity: 200,  price: 15000 },
  { villageIndex: 10, commodityName: "Jahe",         stock: 800,  capacity: 800,  price: 13000 },
  { villageIndex: 13, commodityName: "Kunyit",       stock: 100,  capacity: 500,  price: 11000 },
  { villageIndex: 15, commodityName: "Padi",         stock: 3,    capacity: 5,    price: 4800000 },
  { villageIndex: 16, commodityName: "Cabai Merah",  stock: 200,  capacity: 350,  price: 24000 },
  { villageIndex: 17, commodityName: "Kopi Robusta", stock: 2800, capacity: 3500, price: 36000 },
  { villageIndex: 18, commodityName: "Bawang Merah", stock: 100,  capacity: 250,  price: 19000 },
  { villageIndex: 19, commodityName: "Pisang",       stock: 200,  capacity: 300,  price: 7000 },
];

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.aiRecommendation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.village_users.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.commodity.deleteMany();
  await prisma.village.deleteMany();

  for (const v of villages) {
    await prisma.village.create({ data: v });
    console.log(`  ✅ Village: ${v.name}`);
  }

  for (const c of commodities) {
    await prisma.commodity.create({ data: c });
    console.log(`  ✅ Commodity: ${c.name}`);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Admin Koperasi",
      phone: "081234567890",
      password: hashedPassword,
      role: "system_admin",
      verified: true,
    },
  });
  console.log(`  ✅ Demo Admin: 081234567890 / admin123`);

  const dbVillages = await prisma.village.findMany();

  if (dbVillages.length >= 2) {
    const village1 = dbVillages[0];
    const village2 = dbVillages[11];

    const op1 = await prisma.user.create({
      data: {
        name: `Operator ${village1.name}`,
        phone: "081111111111",
        password: hashedPassword,
        role: "bumdes_operator",
        verified: true,
        villageId: village1.id,
      },
    });
    await prisma.village_users.create({
      data: { userId: op1.id, villageId: village1.id },
    });
    console.log(`  ✅ Demo Operator (${village1.name}): 081111111111 / admin123`);

    const op2 = await prisma.user.create({
      data: {
        name: `Operator ${village2.name}`,
        phone: "082222222222",
        password: hashedPassword,
        role: "bumdes_operator",
        verified: true,
        villageId: village2.id,
      },
    });
    await prisma.village_users.create({
      data: { userId: op2.id, villageId: village2.id },
    });
    console.log(`  ✅ Demo Operator (${village2.name}): 082222222222 / admin123`);
  }

  // Seed meaningful inventory
  console.log("🌱 Seeding inventory...");
  const dbCommodities = await prisma.commodity.findMany();
  const commodityMap = new Map(dbCommodities.map((c) => [c.name, c]));

  for (const inv of villageInventory) {
    const village = dbVillages[inv.villageIndex];
    const commodity = commodityMap.get(inv.commodityName);
    if (!village || !commodity) {
      console.warn(`  ⚠️  Skipping: village idx ${inv.villageIndex} / ${inv.commodityName} not found`);
      continue;
    }

    await prisma.inventory.upsert({
      where: {
        villageId_commodityId: {
          villageId: village.id,
          commodityId: commodity.id,
        },
      },
      update: {
        currentStock: inv.stock,
        capacity: inv.capacity,
        unitPrice: inv.price,
      },
      create: {
        villageId: village.id,
        commodityId: commodity.id,
        currentStock: inv.stock,
        capacity: inv.capacity,
        unitPrice: inv.price,
      },
    });
    const pct = Math.round((inv.stock / inv.capacity) * 100);
    console.log(`  📦 ${village.name} → ${inv.commodityName}: ${inv.stock}/${inv.capacity} (${pct}%)`);
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());