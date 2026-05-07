import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  password: z.string().min(6).optional(),
  villageId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6),
});

export const otpRequestSchema = z.object({
  phone: z.string().min(10),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
});

export const createVillageSchema = z.object({
  name: z.string().min(2),
  subdistrict: z.string(),
  district: z.string(),
  province: z.string().default("Bengkulu"),
  latitude: z.number(),
  longitude: z.number(),
  population: z.number().int().optional(),
  mainCommodities: z.array(z.string()),
  hasColdStorage: z.boolean().default(false),
  contactPhone: z.string().optional(),
});

export const createCommoditySchema = z.object({
  name: z.string().min(2),
  nameLocal: z.string().optional(),
  category: z.string(),
  unit: z.string(),
  perishability: z.enum(["high", "medium", "low"]),
  shelfLifeDays: z.number().int().optional(),
  iconUrl: z.string().url().optional(),
});

export const updateInventorySchema = z.object({
  villageId: z.string().uuid(),
  commodityId: z.string().uuid(),
  currentStock: z.number().min(0),
  capacity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateVillageInput = z.infer<typeof createVillageSchema>;
export type CreateCommodityInput = z.infer<typeof createCommoditySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
