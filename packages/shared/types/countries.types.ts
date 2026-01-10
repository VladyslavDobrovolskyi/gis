import { z } from 'zod';
import { CountriesSchema, CountrySchema } from '@/schemas/countries.schema';

export type Country = z.infer<typeof CountrySchema>;
export type Countries = z.infer<typeof CountriesSchema>;
