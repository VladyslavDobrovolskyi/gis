import { z } from 'zod';
import { RegionsSchema, RegionSchema } from '@schemas/regions.schema';

export type Region = z.infer<typeof RegionSchema>;
export type Regions = z.infer<typeof RegionsSchema>;
