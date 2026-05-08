import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface TrendPrediction {
  villageId: string;
  villageName: string;
  commodityId: string;
  commodityName: string;
  unit: string;
  /** Current stock saat ini */
  currentStock: number;
  /** Kapasitas penyimpanan */
  capacity: number | null;
  /** Prediksi kebutuhan bulan depan (dari tren) */
  predictedDemand: number;
  /** Kondisi yang diprediksi: surplus/shortage/balanced */
  predictedStatus: "surplus" | "shortage" | "balanced";
  /** Selisih: predictedDemand - currentStock */
  gap: number;
  /** Confidence: 0-1, semakin banyak data history semakin tinggi */
  confidence: number;
  /** Jumlah bulan data history yang tersedia */
  historyMonths: number;
}

@Injectable()
export class TrendAnalysisService {
  constructor(private prisma: PrismaService) {}

  /**
   * Prediksi kebutuhan bulan depan untuk satu desa + komoditas.
   * Pake Simple Moving Average + Weighted Trend.
   */
  async predictDemand(
    villageId: string,
    commodityId: string,
  ): Promise<TrendPrediction | null> {
    // Ambil history 6 bulan terakhir
    const history = await this.prisma.inventoryHistory.findMany({
      where: { villageId, commodityId },
      orderBy: [{ recordedYear: "asc" }, { recordedMonth: "asc" }],
      take: 6,
    });

    // Ambil current inventory
    const inventory = await this.prisma.inventory.findUnique({
      where: { villageId_commodityId: { villageId, commodityId } },
      include: { commodity: true, village: true },
    });

    if (!inventory || !inventory.commodity) return null;

    const currentStock = Number(inventory.currentStock);
    const capacity = inventory.capacity ? Number(inventory.capacity) : null;
    const unit = inventory.commodity.unit;
    const commodityName = inventory.commodity.name;
    const villageName = inventory.village?.name ?? "Unknown";

    if (history.length === 0) {
      // Kalo gak ada history, fallback ke monthlyDemand kalo ada
      const demand = inventory.monthlyDemand ? Number(inventory.monthlyDemand) : 0;
      if (demand <= 0) return null;
      return {
        villageId,
        villageName,
        commodityId,
        commodityName,
        unit,
        currentStock,
        capacity,
        predictedDemand: demand,
        predictedStatus: this.classifyStatus(currentStock, demand),
        gap: demand - currentStock,
        confidence: 0.3,
        historyMonths: 0,
      };
    }

    const months = history.map((h) => Number(h.recordedStock));
    const predictedDemand = this.calculateMovingAverage(months);
    const confidence = Math.min(0.3 + history.length * 0.1, 0.95);

    return {
      villageId,
      villageName,
      commodityId,
      commodityName,
      unit,
      currentStock,
      capacity,
      predictedDemand: Math.round(predictedDemand * 100) / 100,
      predictedStatus: this.classifyStatus(currentStock, predictedDemand),
      gap: Math.round((predictedDemand - currentStock) * 100) / 100,
      confidence,
      historyMonths: history.length,
    };
  }

  /**
   * Prediksi untuk SEMUA desa + komoditas.
   */
  async predictAll(): Promise<TrendPrediction[]> {
    const inventories = await this.prisma.inventory.findMany({
      include: { commodity: true, village: true },
    });

    const results: TrendPrediction[] = [];
    for (const inv of inventories) {
      const prediction = await this.predictDemand(inv.villageId, inv.commodityId);
      if (prediction) results.push(prediction);
    }

    return results;
  }

  /**
   * Dapatkan desa-desa yang diprediksi SHORTAGE bulan depan.
   */
  async findPredictedShortage(): Promise<TrendPrediction[]> {
    const all = await this.predictAll();
    return all.filter((p) => p.predictedStatus === "shortage");
  }

  /**
   * Dapatkan desa-desa yang diprediksi SURPLUS bulan depan.
   */
  async findPredictedSurplus(): Promise<TrendPrediction[]> {
    const all = await this.predictAll();
    return all.filter((p) => p.predictedStatus === "surplus");
  }

  // ── Private helpers ──

  /**
   * Simple Moving Average (SMA) dengan weight pada data terbaru.
   * Data 3 bulan terakhir bobot 2x lipat.
   */
  private calculateMovingAverage(months: number[]): number {
    if (months.length === 0) return 0;
    if (months.length === 1) return months[0];

    const recent = months.slice(-3);
    const older = months.slice(0, -3);

    let totalWeight = 0;
    let weightedSum = 0;

    for (const val of older) {
      weightedSum += val * 1;
      totalWeight += 1;
    }
    for (const val of recent) {
      weightedSum += val * 2;
      totalWeight += 2;
    }

    return weightedSum / totalWeight;
  }

  /**
   * Klasifikasi: surplus/shortage/balanced berdasarkan stock vs predicted demand.
   * - Surplus: stock >= demand * 1.5 (cukup >1.5 bulan)
   * - Shortage: stock <= demand * 0.5 (kurang dari setengah bulan)
   * - Balanced: di antaranya
   */
  private classifyStatus(
    currentStock: number,
    predictedDemand: number,
  ): "surplus" | "shortage" | "balanced" {
    if (predictedDemand <= 0) return "balanced";
    if (currentStock >= predictedDemand * 1.5) return "surplus";
    if (currentStock <= predictedDemand * 0.5) return "shortage";
    return "balanced";
  }
}
