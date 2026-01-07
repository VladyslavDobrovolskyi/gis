import { router, publicProcedure } from '../trpc';
import { CitiesSchema, CitySchema } from '@gis/shared/schemas';
import { getAllCities, getCityById } from '@db/generated/cities.types';
import { runQuery } from '@db/runner';

export const citiesRouter = router({
  getCities: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/cities',
        summary: 'Get all cities with geometry',
        description: 'Returns a list of cities with geometry (GeoJSON)',
      },
    })
    .output(CitiesSchema)
    .query(async () => {
      const result = await runQuery(getAllCities);
      return CitiesSchema.parse(result);
    }),
  getCityById: publicProcedure
    .input(CitySchema.pick({ ogc_fid: true }))
    .meta({
      openapi: {
        method: 'GET',
        path: '/cities/{ogc_fid}',
        summary: 'Get city by ogc_fid',
        description: 'Returns a city by ogc_fid',
      },
    })
    .output(CitySchema)
    .query(async ({ input }) => {
      const result = await runQuery(getCityById, { ogc_fid: input.ogc_fid });
      if (!result.length) throw new Error('City not found');
      return CitySchema.parse(result[0]);
    }),
});
