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

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.aiRecommendation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.village_users.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.commodity.deleteMany();
  await prisma.village.deleteMany();

  // Seed villages
  for (const v of villages) {
    await prisma.village.create({ data: v });
    console.log(`  ✅ Village: ${v.name}`);
  }

  // Seed commodities
  for (const c of commodities) {
    await prisma.commodity.create({ data: c });
    console.log(`  ✅ Commodity: ${c.name}`);
  }

  // Seed demo admin user
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

  // Seed Bumdes Operators
  const dbVillages = await prisma.village.findMany();
  
  if (dbVillages.length >= 2) {
    const village1 = dbVillages[0]; // Air Duku
    const village2 = dbVillages[11]; // Sukaraja

    // Operator Village 1
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

    // Operator Village 2
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

  // Seed fake inventory for the first 10 villages and random commodities
  console.log("🌱 Seeding inventory...");
  const dbCommodities = await prisma.commodity.findMany();

  for (let i = 0; i < 15; i++) {
    const v = dbVillages[Math.floor(Math.random() * dbVillages.length)];
    const c = dbCommodities[Math.floor(Math.random() * dbCommodities.length)];
    
    // Random stock between 500 and 5000
    const stock = Math.floor(Math.random() * 4500) + 500;
    const capacity = stock + Math.floor(Math.random() * 2000);
    const price = Math.floor(Math.random() * 15) * 1000 + 5000;

    await prisma.inventory.upsert({
      where: { villageId_commodityId: { villageId: v.id, commodityId: c.id } },
      update: {},
      create: {
        villageId: v.id,
        commodityId: c.id,
        currentStock: stock,
        capacity: capacity,
        unitPrice: price,
        qualityGrade: ["A", "B", "C"][Math.floor(Math.random() * 3)],
      },
    });
  }
  console.log("  ✅ Generated dummy inventory");

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
