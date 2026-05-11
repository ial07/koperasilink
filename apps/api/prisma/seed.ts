import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const villages = [
  // Selupu Rejang
  { name: "Sambirejo", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.4077233, longitude: 102.6400074 },
  { name: "Air Duku", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.4101511, longitude: 102.6377116 },
  { name: "Air Meles Atas", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.474183, longitude: 102.573987 },
  { name: "Karang Jaya", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.3777294, longitude: 102.6410565 },
  { name: "Cawang Baru", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.4266144, longitude: 102.6014115 },
  { name: "Cawang Lama", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.3905491, longitude: 102.5870105 },
  { name: "Kali Padang", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.4150, longitude: 102.5950 },
  { name: "Kampung Baru", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.3871883, longitude: 102.6042712 },
  { name: "Kayu Manis", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.3598918, longitude: 102.5735968 },
  { name: "Air Putih Kali Bandung", subdistrict: "Selupu Rejang", district: "Rejang Lebong", latitude: -3.4082407, longitude: 102.6292529 },
  
  // Curup Tengah
  { name: "Talang Rimbo Baru", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.4778894, longitude: 102.531911 },
  { name: "Talang Rimbo Lama", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.4798, longitude: 102.5339 },
  { name: "Batu Galing", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.4729143, longitude: 102.5418432 },
  { name: "Karya Baru", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.4699489, longitude: 102.5525194 },
  { name: "Air Bang", subdistrict: "Curup Tengah", district: "Rejang Lebong", latitude: -3.4758, longitude: 102.5299 },

  // Curup Timur
  { name: "Sukaraja", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.4624861, longitude: 102.537452 },
  { name: "Karang Anyar", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.4559152, longitude: 102.5303959 },
  { name: "Air Meles Bawah", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.4637067, longitude: 102.5429587 },
  { name: "Talang Ulu", subdistrict: "Curup Timur", district: "Rejang Lebong", latitude: -3.4567217, longitude: 102.5576814 },
  
  // Curup
  { name: "Pasar Baru", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.477865, longitude: 102.5328748 },
  { name: "Timbul Rejo", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.4669355, longitude: 102.5696118 },
  { name: "Dwi Tunggal", subdistrict: "Curup", district: "Rejang Lebong", latitude: -3.477477, longitude: 102.51308 },
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

const villageInventory: Array<{
  villageName: string;
  commodityName: string;
  stock: number;
  capacity: number;
  price: number;
  demand?: number;
}> = [
  // ── SURPLUS (stock > monthly demand * 1.5) ──
  { villageName: "Sambirejo",  commodityName: "Kopi Robusta", stock: 4200, capacity: 5000, price: 35000, demand: 400 },
  { villageName: "Sambirejo",  commodityName: "Cabai Merah",  stock: 450,  capacity: 500,  price: 25000, demand: 80 },
  { villageName: "Air Duku",   commodityName: "Kopi Robusta", stock: 3800, capacity: 4000, price: 32000, demand: 350 },
  { villageName: "Air Duku",   commodityName: "Jahe",         stock: 600,  capacity: 800,  price: 15000, demand: 100 },
  { villageName: "Cawang Baru",commodityName: "Kopi Robusta", stock: 2000, capacity: 3000, price: 34000, demand: 200 },

  // ── SHORTAGE (stock < monthly demand * 1.5) ──
  { villageName: "Talang Rimbo Baru", commodityName: "Cabai Merah",  stock: 15,   capacity: 400,  price: 30000, demand: 200 },
  { villageName: "Talang Rimbo Baru", commodityName: "Bawang Merah", stock: 30,   capacity: 300,  price: 20000, demand: 150 },
  { villageName: "Pasar Baru",        commodityName: "Padi",         stock: 0.5,  capacity: 6,    price: 5500000, demand: 3 },
  { villageName: "Pasar Baru",        commodityName: "Kangkung",     stock: 10,   capacity: 200,  price: 3000, demand: 120 },
  { villageName: "Sukaraja",          commodityName: "Cabai Merah",  stock: 10,   capacity: 300,  price: 27000, demand: 100 },
  { villageName: "Sukaraja",          commodityName: "Kopi Robusta", stock: 250,  capacity: 2000, price: 33000, demand: 500 },

  // ── BALANCED ──
  { villageName: "Air Meles Bawah", commodityName: "Cabai Merah",  stock: 150,  capacity: 400,  price: 26000, demand: 80 },
  { villageName: "Air Meles Bawah", commodityName: "Bawang Merah", stock: 120,  capacity: 300,  price: 18000, demand: 70 },
  { villageName: "Air Meles Atas",  commodityName: "Kopi Robusta", stock: 1500, capacity: 3000, price: 31000, demand: 600 },
  { villageName: "Air Meles Atas",  commodityName: "Jahe",         stock: 300,  capacity: 600,  price: 14000, demand: 150 },
  { villageName: "Air Meles Atas",  commodityName: "Kunyit",       stock: 400,  capacity: 700,  price: 12000, demand: 200 },
  { villageName: "Karang Anyar",    commodityName: "Bayam",        stock: 80,   capacity: 150,  price: 4000, demand: 60 },
  { villageName: "Karang Anyar",    commodityName: "Kangkung",     stock: 100,  capacity: 200,  price: 3500, demand: 80 },

  // ── EXTRA ──
  { villageName: "Timbul Rejo", commodityName: "Padi",         stock: 8,    capacity: 10,   price: 5000000, demand: 2 },
  { villageName: "Timbul Rejo", commodityName: "Cabai Merah",  stock: 20,   capacity: 200,  price: 28000, demand: 50 },
  { villageName: "Dwi Tunggal", commodityName: "Padi",         stock: 6,    capacity: 8,    price: 5200000, demand: 2 },
  { villageName: "Kali Padang", commodityName: "Pisang",       stock: 400,  capacity: 500,  price: 8000, demand: 150 },
  { villageName: "Kampung Baru",commodityName: "Alpukat",      stock: 60,   capacity: 200,  price: 15000, demand: 50 },
  { villageName: "Cawang Lama", commodityName: "Jahe",         stock: 800,  capacity: 800,  price: 13000, demand: 80 },
  { villageName: "Karya Baru",  commodityName: "Kunyit",       stock: 100,  capacity: 500,  price: 11000, demand: 150 },
];

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.aiRecommendation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventoryHistory.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.village_users.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.commodity.deleteMany();
  await prisma.village.deleteMany();

  const dbVillagesMap = new Map();
  for (const v of villages) {
    const created = await prisma.village.create({ data: v });
    dbVillagesMap.set(v.name, created);
    console.log(`  ✅ Village: ${v.name}`);
  }

  const dbCommoditiesMap = new Map();
  for (const c of commodities) {
    const uom = await prisma.unitOfMeasure.upsert({
      where: { symbol: c.unit },
      update: {},
      create: { symbol: c.unit, description: `Satuan ${c.unit}` }
    });

    const { unit, ...commodityData } = c;

    const created = await prisma.commodity.create({ 
      data: { ...commodityData, unitId: uom.id } 
    });
    dbCommoditiesMap.set(c.name, created);
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

  const sambirejo = dbVillagesMap.get("Sambirejo");
  const airDuku = dbVillagesMap.get("Air Duku");

  if (sambirejo && airDuku) {
    const op1 = await prisma.user.create({
      data: {
        name: `Operator Sambirejo`,
        phone: "081111111111",
        password: hashedPassword,
        role: "bumdes_operator",
        verified: true,
        villageId: sambirejo.id,
      },
    });
    await prisma.village_users.create({
      data: { userId: op1.id, villageId: sambirejo.id },
    });
    console.log(`  ✅ Demo Operator (Sambirejo): 081111111111 / admin123`);

    const op2 = await prisma.user.create({
      data: {
        name: `Operator Air Duku`,
        phone: "082222222222",
        password: hashedPassword,
        role: "bumdes_operator",
        verified: true,
        villageId: airDuku.id,
      },
    });
    await prisma.village_users.create({
      data: { userId: op2.id, villageId: airDuku.id },
    });
    console.log(`  ✅ Demo Operator (Air Duku): 082222222222 / admin123`);
  }

  // Seed meaningful inventory
  console.log("🌱 Seeding inventory...");

  for (const inv of villageInventory) {
    const village = dbVillagesMap.get(inv.villageName);
    const commodity = dbCommoditiesMap.get(inv.commodityName);
    if (!village || !commodity) {
      console.warn(`  ⚠️  Skipping: ${inv.villageName} / ${inv.commodityName} not found`);
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
        monthlyDemand: inv.demand ?? 0,
        unitPrice: inv.price,
      },
      create: {
        villageId: village.id,
        commodityId: commodity.id,
        currentStock: inv.stock,
        capacity: inv.capacity,
        monthlyDemand: inv.demand ?? 0,
        unitPrice: inv.price,
      },
    });
    const pct = Math.round((inv.stock / inv.capacity) * 100);
    console.log(`  📦 ${village.name} → ${inv.commodityName}: ${inv.stock}/${inv.capacity} (${pct}%)`);
  }

  console.log("🌱 Seeding inventory history (6 months trend)...");
  await prisma.inventoryHistory.deleteMany();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  for (const inv of villageInventory) {
    const village = dbVillagesMap.get(inv.villageName);
    const commodity = dbCommoditiesMap.get(inv.commodityName);
    if (!village || !commodity) continue;

    // Generate history untuk 6 bulan terakhir
    // Setiap kategori punya tren yang JELAS biar moving average-nya masuk akal:
    //   SURPLUS  → 6 bln lalu: stock rendah, sekarang: stock tinggi (tren naik ➡️ surplus)
    //   SHORTAGE → 6 bln lalu: stock tinggi, sekarang: stock rendah (tren turun ➡️ shortage)
    //   BALANCED → stok stabil di sekitar nilai sekarang
    for (let m = 0; m < 6; m++) {
      let month = currentMonth - 5 + m;
      let year = currentYear;
      if (month <= 0) { month += 12; year -= 1; }

      const demand = inv.demand ?? 0;
      const isSurplus = demand > 0 && inv.stock >= demand * 1.5;
      const isShortage = demand > 0 && inv.stock <= demand * 0.8;
      const currentStock = inv.stock;

      // Progress: 0 (6 bln lalu) → 1 (sekarang)
      const progress = (m + 1) / 6;
      // Inverse progress: 1 (6 bln lalu) → 0 (sekarang)
      const invProgress = 1 - progress;

      let historicalStock: number;

      if (isSurplus) {
        // SURPLUS: 6 bulan lalu stok pas-pasan, sekarang melimpah
        // stok naik dari ~demand*1.0 ke demand*3+
        const startStock = Math.max(demand * 1.1, currentStock * 0.2);
        historicalStock = Math.round(startStock + (currentStock - startStock) * progress);
      } else if (isShortage) {
        // SHORTAGE: 6 bulan lalu stok masih cukup, sekarang menipis
        // stok turun dari ~demand*1.3 ke stok sekarang
        const startStock = Math.max(currentStock * 3, demand * 1.3);
        historicalStock = Math.round(startStock + (currentStock - startStock) * progress);
      } else {
        // BALANCED: stok relatif stabil, variasi kecil ±15%
        const variation = 0.85 + Math.random() * 0.3;
        historicalStock = Math.round(currentStock * variation);
      }

      // Pastikan gak negatif
      historicalStock = Math.max(0, historicalStock);

      await prisma.inventoryHistory.upsert({
        where: {
          villageId_commodityId_recordedYear_recordedMonth: {
            villageId: village.id,
            commodityId: commodity.id,
            recordedYear: year,
            recordedMonth: month,
          },
        },
        update: { recordedStock: historicalStock },
        create: {
          villageId: village.id,
          commodityId: commodity.id,
          recordedStock: historicalStock,
          recordedMonth: month,
          recordedYear: year,
          source: "seed",
        },
      });
    }
    console.log(`  📈 ${village.name} → ${commodity.name}: history 6 bulan`);
  }

  console.log("🌱 Seeding AI Recommendations and Transactions...");

  {
    const recSambirejo = dbVillagesMap.get("Sambirejo");
    const recAirDuku = dbVillagesMap.get("Air Duku");
    const recSukaraja = dbVillagesMap.get("Sukaraja");
    const recAirMelesBawah = dbVillagesMap.get("Air Meles Bawah");
    const recTalangRimboBaru = dbVillagesMap.get("Talang Rimbo Baru");

    const kopi = dbCommoditiesMap.get("Kopi Robusta");
    const cabai = dbCommoditiesMap.get("Cabai Merah");
    const jahe = dbCommoditiesMap.get("Jahe");
    const bawang = dbCommoditiesMap.get("Bawang Merah");

    if (recSambirejo && recAirDuku && recSukaraja && kopi && cabai) {
      // Recommendation 1: Air Duku -> Sukaraja (Kopi)
      await prisma.aiRecommendation.create({
        data: {
          sourceVillageId: recAirDuku.id,
          targetVillageId: recSukaraja.id,
          commodityId: kopi.id,
          recommendedQuantity: 1000,
          estimatedProfit: 5000000,
          estimatedShippingCost: 150000,
          priorityScore: 0.95,
          distanceKm: 8.5,
          sourcePrice: 40000,
          status: "pending",
          triggeredBy: "system_cron",
        },
      });

      // Recommendation 2: Sambirejo -> Talang Rimbo Baru (Cabai)
      await prisma.aiRecommendation.create({
        data: {
          sourceVillageId: recSambirejo.id,
          targetVillageId: recTalangRimboBaru.id,
          commodityId: cabai.id,
          recommendedQuantity: 150,
          estimatedProfit: 750000,
          estimatedShippingCost: 50000,
          priorityScore: 0.88,
          distanceKm: 4.2,
          sourcePrice: 55000,
          status: "pending",
          triggeredBy: "system_cron",
        },
      });

      // Transaction 1: Completed (Sambirejo -> Sukaraja, Cabai)
      await prisma.transaction.create({
        data: {
          fromVillageId: recSambirejo.id,
          toVillageId: recSukaraja.id,
          commodityId: cabai.id,
          quantity: 50,
          unitPrice: 55000,
          totalAmount: 2750000,
          shippingCost: 45000,
          status: "completed",
          aiRecommended: true,
          notes: "Urgent transfer",
        },
      });

      // Transaction 2: In Transit (Air Duku -> Air Meles Bawah, Jahe)
      if (jahe && recAirMelesBawah) {
        await prisma.transaction.create({
          data: {
            fromVillageId: recAirDuku.id,
            toVillageId: recAirMelesBawah.id,
            commodityId: jahe.id,
            quantity: 200,
            unitPrice: 15000,
            totalAmount: 3000000,
            shippingCost: 80000,
            status: "in_transit",
            aiRecommended: true,
            notes: "Scheduled delivery",
          },
        });
      }

      console.log("  ✅ Seeded 2 AI Recommendations and 2 Transactions");
    }
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());