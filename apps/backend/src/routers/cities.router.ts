import { router, publicProcedure } from '@trpc';
import {
  CitiesSchema,
  GetDistanceFromToParamsSchema,
  GetDistanceFromToResultSchema,
} from '@gis/shared/schemas';

import { getAllCities } from '@generated/cities.types';
import { getDistanceFromTo } from '@generated/distance.types';
import { runQuery, runOne } from '@db/runner';

export const citiesRouter = router({
  getAll: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/',
        summary: 'Get all cities',
      },
    })
    .output(CitiesSchema)
    .query(async () => {
      const result = await runQuery(getAllCities);
      return CitiesSchema.parse(result);
    }),

  distance: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/distance',
        summary: 'Get distance between two cities',
      },
    })
    .input(GetDistanceFromToParamsSchema)
    .output(GetDistanceFromToResultSchema)
    .query(async ({ input }) => {
      const result = await runOne(getDistanceFromTo, {
        from: input.from,
        to: input.to,
      });

      return GetDistanceFromToResultSchema.parse(result);
    }),
});
