import { z } from 'zod';

export const RegionSchema = z.object({
  ogc_fid: z.number().int().positive(),
  name: z.string().min(1),
  iso_code: z.string().min(2),
  shape_id: z.string().nullable(),
  group_code: z.string().nullable(),
  type: z.string().nullable(),
  geom: z.string().nullable(), // GeoJSON string
});
export const RegionsSchema = z.array(RegionSchema);
export type Region = z.infer<typeof RegionSchema>;
export type Regions = z.infer<typeof RegionsSchema>;
