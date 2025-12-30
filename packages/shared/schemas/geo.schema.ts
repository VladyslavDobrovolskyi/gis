import { z } from 'zod';

export const GeoCitySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  population: z.number().int().nullable(),
  geometry: z.string().nullable(),
  border_geometry: z.string().nullable(),
});
export const GeoCitiesSchema = z.array(GeoCitySchema);
export type GeoCity = z.infer<typeof GeoCitySchema>;
export type GeoCities = z.infer<typeof GeoCitiesSchema>;

export const GeoCountrySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  iso_code: z.string().min(2).max(2),
  geometry: z.string().nullable(),
});
export const GeoCountriesSchema = z.array(GeoCountrySchema);
export type GeoCountry = z.infer<typeof GeoCountrySchema>;
export type GeoCountries = z.infer<typeof GeoCountriesSchema>;
