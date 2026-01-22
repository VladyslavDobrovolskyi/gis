/** Types generated for queries found in "db/sql/regions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetAllRegions' parameters type */
export type IGetAllRegionsParams = void;

/** 'GetAllRegions' return type */
export interface IGetAllRegionsResult {
  geom: string | null;
  group_code: string | null;
  iso_code: string | null;
  name: string | null;
  ogc_fid: number;
  shape_id: string | null;
  type: string | null;
}

/** 'GetAllRegions' query type */
export interface IGetAllRegionsQuery {
  params: IGetAllRegionsParams;
  result: IGetAllRegionsResult;
}

const getAllRegionsIR: any = {
  usedParamSet: {},
  params: [],
  statement:
    'SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type\nFROM regions',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
 * FROM regions
 * ```
 */
export const getAllRegions = new PreparedQuery<IGetAllRegionsParams, IGetAllRegionsResult>(
  getAllRegionsIR,
);

/** 'GetRegionById' parameters type */
export interface IGetRegionByIdParams {
  ogc_fid?: number | null | void;
}

/** 'GetRegionById' return type */
export interface IGetRegionByIdResult {
  geom: string | null;
  group_code: string | null;
  iso_code: string | null;
  name: string | null;
  ogc_fid: number;
  shape_id: string | null;
  type: string | null;
}

/** 'GetRegionById' query type */
export interface IGetRegionByIdQuery {
  params: IGetRegionByIdParams;
  result: IGetRegionByIdResult;
}

const getRegionByIdIR: any = {
  usedParamSet: { ogc_fid: true },
  params: [
    { name: 'ogc_fid', required: false, transform: { type: 'scalar' }, locs: [{ a: 116, b: 123 }] },
  ],
  statement:
    'SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type\nFROM regions\nWHERE ogc_fid = :ogc_fid',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
 * FROM regions
 * WHERE ogc_fid = :ogc_fid
 * ```
 */
export const getRegionById = new PreparedQuery<IGetRegionByIdParams, IGetRegionByIdResult>(
  getRegionByIdIR,
);
