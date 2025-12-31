import { router, publicProcedure } from '../trpc';
import { CountriesSchema, CountrySchema } from '@gis/shared/schemas';
import { getAllCountries, getCountryById } from '@db/generated/countries.types';
import { runQuery } from '@db/runner';

export const countryRouter = router({
  getCountries: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/country',
        summary: 'Get all countries with geometry',
        description: 'Возвращает список стран с геометрией (GeoJSON)',
      },
    })
    .output(CountriesSchema)
    .query(async () => {
      const result = await runQuery(getAllCountries);
      return CountriesSchema.parse(result);
    }),
  getCountryById: publicProcedure
    .input(CountrySchema.pick({ ogc_fid: true }))
    .meta({
      openapi: {
        method: 'GET',
        path: '/country/{ogc_fid}',
        summary: 'Get country by ogc_fid',
        description: 'Возвращает страну по ogc_fid',
      },
    })
    .output(CountrySchema)
    .query(async ({ input }) => {
      const result = await runQuery(getCountryById, { ogc_fid: input.ogc_fid });
      if (!result.length) throw new Error('Country not found');
      return CountrySchema.parse(result[0]);
    }),
});
