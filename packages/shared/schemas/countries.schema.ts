import { z } from 'zod';

export const CountrySchema = z.object({
  ogc_fid: z.number().int().positive(),
  name: z.string().min(1),
  iso_code: z.string().min(2),
  shape_id: z.string().nullable(),
  group_code: z.string().nullable(),
  type: z.string().nullable(),
  geom: z.string().nullable(), // GeoJSON string
});
export const CountriesSchema = z.array(CountrySchema);
export type Country = z.infer<typeof CountrySchema>;
export type Countries = z.infer<typeof CountriesSchema>;
