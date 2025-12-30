import { router, publicProcedure } from '../trpc';
import { GeoCitiesSchema, GeoCountriesSchema } from '@gis/shared/schemas';
import { getAllCitiesWithGeom, getAllCountriesWithGeom } from '@db/generated/geo_objects.types';
import { runQuery } from '@db/runner';

export const geoRouter = router({
  getCities: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/geo/cities',
        summary: 'Get all cities with geometry',
        description: 'Возвращает список городов с координатами (WKT POINT) и населением.',
      },
    })
    .output(GeoCitiesSchema)
    .query(async () => {
      const result = await runQuery(getAllCitiesWithGeom);
      return GeoCitiesSchema.parse(result);
    }),
  getCountries: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/geo/countries',
        summary: 'Get all countries with geometry',
        description: 'Возвращает список стран с ISO-кодом и границами (WKT MULTIPOLYGON).',
      },
    })
    .output(GeoCountriesSchema)
    .query(async () => {
      const result = await runQuery(getAllCountriesWithGeom);
      return GeoCountriesSchema.parse(result);
    }),
});
