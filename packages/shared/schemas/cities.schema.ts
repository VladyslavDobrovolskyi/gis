import { z } from 'zod';

export const CitySchema = z.object({
  ogc_fid: z.number().int().positive(),
  city_name: z.string().min(1),
  region_id: z.number().int().positive(),
  geom: z.string().nullable(), // GeoJSON string
});
export const CitiesSchema = z.array(CitySchema);
export type City = z.infer<typeof CitySchema>;
export type Cities = z.infer<typeof CitiesSchema>;
