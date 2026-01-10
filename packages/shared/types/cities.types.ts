import { z } from 'zod';
import { CitiesSchema, CitySchema } from '@/schemas/cities.schema';

export type City = z.infer<typeof CitySchema>;
export type Cities = z.infer<typeof CitiesSchema>;
