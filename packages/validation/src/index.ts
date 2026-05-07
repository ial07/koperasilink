import { z } from "zod";

// Example shared schema
export const villageSchema = z.object({
  name: z.string().min(2),
  subdistrict: z.string(),
  district: z.string(),
  province: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export type VillageInput = z.infer<typeof villageSchema>;
