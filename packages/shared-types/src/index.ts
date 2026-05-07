export interface Village {
  id: string;
  name: string;
  subdistrict: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  population?: number;
  mainCommodities: string[];
  status: "active" | "inactive" | "pending";
}

export interface Commodity {
  id: string;
  name: string;
  nameLocal?: string;
  category: "vegetables" | "fruits" | "grains" | "spices" | "livestock" | "fishery" | "processed" | "other";
  unit: "kg" | "ton" | "ikat" | "butir" | "ekor" | "liter";
  perishability: "high" | "medium" | "low";
  shelfLifeDays?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: "koperasi_admin" | "bumdes_operator" | "distributor" | "government" | "farmer" | "system_admin";
  villageId?: string;
}

export type VillageStatus = "surplus" | "shortage" | "balanced";
export type TransactionStatus = "pending" | "confirmed" | "in_transit" | "completed" | "cancelled";
export type RecommendationStatus = "pending" | "accepted" | "rejected" | "expired" | "converted";
