import { router, publicProcedure } from '../trpc';
import { RegionsSchema, RegionSchema } from '@gis/shared/schemas';
import { getAllRegions, getRegionById } from '@db/generated/regions.types';
import { runQuery } from '@db/runner';
export const regionRouter = router({
  getRegions: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/region',
        summary: 'Get all regions with geometry',
        description: 'Возвращает список регионов с геометрией (GeoJSON)',
      },
    })
    .output(RegionsSchema)
    .query(async () => {
      const result = await runQuery(getAllRegions);
      return RegionsSchema.parse(result);
    }),
  getRegionById: publicProcedure
    .input(RegionSchema.pick({ ogc_fid: true }))
    .meta({
      openapi: {
        method: 'GET',
        path: '/region/{ogc_fid}',
        summary: 'Get region by ogc_fid',
        description: 'Возвращает регион по ogc_fid',
      },
    })
    .output(RegionSchema)
    .query(async ({ input }) => {
      const result = await runQuery(getRegionById, { ogc_fid: input.ogc_fid });
      if (!result.length) throw new Error('Region not found');
      return RegionSchema.parse(result[0]);
    }),
});
