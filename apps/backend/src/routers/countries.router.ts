import { router, publicProcedure } from '../trpc';
import { CountriesSchema, CountrySchema } from '@gis/shared/schemas';
import { getAllCountries, getCountryById } from '@db/generated/countries.types';
import { runQuery } from '@db/runner';

export const countriesRouter = router({
  getCountries: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/countries',
        summary: 'Get all countries with geometry',
        description: 'Returns a list of countries with geometry (GeoJSON)',
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
        path: '/countries/{ogc_fid}',
        summary: 'Get country by ogc_fid',
        description: 'Returns a country by ogc_fid',
      },
    })
    .output(CountrySchema)
    .query(async ({ input }) => {
      const result = await runQuery(getCountryById, { ogc_fid: input.ogc_fid });
      if (!result.length) throw new Error('Country not found');
      return CountrySchema.parse(result[0]);
    }),
});
