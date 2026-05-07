import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const villages = [
  { name: "Air Duku", subdistrict: "Curup Tengah", latitude: -3.454, longitude: 102.536 },
  { name: "Air Meles Bawah", subdistrict: "Curup Timur", latitude: -3.458, longitude: 102.546 },
  { name: "Air Meles Atas", subdistrict: "Curup Timur", latitude: -3.460, longitude: 102.550 },
  { name: "Batu Galing", subdistrict: "Curup", latitude: -3.462, longitude: 102.520 },
  { name: "Talang Rimbo Baru", subdistrict: "Curup Tengah", latitude: -3.448, longitude: 102.528 },
  { name: "Talang Rimbo Lama", subdistrict: "Curup Tengah", latitude: -3.445, longitude: 102.525 },
  { name: "Duku Ilir", subdistrict: "Curup Tengah", latitude: -3.450, longitude: 102.540 },
  { name: "Duku Ulu", subdistrict: "Curup Tengah", latitude: -3.447, longitude: 102.542 },
  { name: "Kesambi", subdistrict: "Padang Ulak Tanding", latitude: -3.410, longitude: 102.490 },
  { name: "Teladan", subdistrict: "Curup", latitude: -3.470, longitude: 102.515 },
  { name: "Pasar Baru", subdistrict: "Curup", latitude: -3.466, longitude: 102.518 },
  { name: "Sukaraja", subdistrict: "Curup Timur", latitude: -3.455, longitude: 102.555 },
  { name: "Karang Anyar", subdistrict: "Curup Timur", latitude: -3.452, longitude: 102.560 },
  { name: "Perbo", subdistrict: "Curup", latitude: -3.475, longitude: 102.510 },
  { name: "Timbul Rejo", subdistrict: "Curup", latitude: -3.478, longitude: 102.505 },
  { name: "Pagar Gunung", subdistrict: "Padang Ulak Tanding", latitude: -3.420, longitude: 102.480 },
  { name: "Sari Mulyo", subdistrict: "Padang Ulak Tanding", latitude: -3.430, longitude: 102.475 },
  { name: "Campur Kenanga", subdistrict: "Padang Ulak Tanding", latitude: -3.415, longitude: 102.468 },
  { name: "Karya Baru", subdistrict: "Curup Tengah", latitude: -3.443, longitude: 102.532 },
  { name: "Taba Jambu", subdistrict: "Curup Tengah", latitude: -3.438, longitude: 102.535 },
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
  await prisma.transaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.commodity.deleteMany();
  await prisma.village.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

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
  console.log(`  ✅ Demo user: 081234567890 / admin123`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
