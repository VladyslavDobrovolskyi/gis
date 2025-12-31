import { router, publicProcedure } from '../trpc';
import { CitiesSchema, CitySchema } from '@gis/shared/schemas';
import { getAllCities, getCityById } from '@db/generated/cities.types';
import { runQuery } from '@db/runner';

export const cityRouter = router({
  getCities: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/city',
        summary: 'Get all cities with geometry',
        description: 'Возвращает список городов с геометрией (GeoJSON)',
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
        path: '/city/{ogc_fid}',
        summary: 'Get city by ogc_fid',
        description: 'Возвращает город по ogc_fid',
      },
    })
    .output(CitySchema)
    .query(async ({ input }) => {
      const result = await runQuery(getCityById, { ogc_fid: input.ogc_fid });
      if (!result.length) throw new Error('City not found');
      return CitySchema.parse(result[0]);
    }),
});
