import { z } from 'zod';

export const CitySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  population: z.number().int().nullable(),
  geometry: z.string().nullable(),
});

export const CitiesSchema = z.array(CitySchema);

export type City = z.infer<typeof CitySchema>;
export type Cities = z.infer<typeof CitiesSchema>;

export const GetDistanceFromToParamsSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});
export type IGetDistanceFromToParams = z.infer<typeof GetDistanceFromToParamsSchema>;

export const GetDistanceFromToResultSchema = z.object({
  city_from: z.string().min(1),
  city_to: z.string().min(1),
  distance_meters: z.number().nullable(),
});

export interface IGetDistanceFromToResult {
  city_from: string;
  city_to: string;
  distance_meters: number | null;
}
