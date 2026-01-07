import { router, publicProcedure } from '../trpc';
import { RegionsSchema, RegionSchema } from '@gis/shared/schemas';
import { getAllRegions, getRegionById } from '@db/generated/regions.types';
import { runQuery } from '@db/runner';
export const regionsRouter = router({
  getRegions: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/regions',
        summary: 'Get all regions with geometry',
        description: 'Returns a list of regions with geometry (GeoJSON)',
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
        path: '/regions/{ogc_fid}',
        summary: 'Get region by ogc_fid',
        description: 'Returns a region by ogc_fid',
      },
    })
    .output(RegionSchema)
    .query(async ({ input }) => {
      const result = await runQuery(getRegionById, { ogc_fid: input.ogc_fid });
      if (!result.length) throw new Error('Region not found');
      return RegionSchema.parse(result[0]);
    }),
});
