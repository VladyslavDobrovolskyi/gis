/** Types generated for queries found in "db/sql/cities.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetAllCities' parameters type */
export type IGetAllCitiesParams = void;

/** 'GetAllCities' return type */
export interface IGetAllCitiesResult {
  city_name: string | null;
  geom: string | null;
  ogc_fid: number;
  region_id: number | null;
}

/** 'GetAllCities' query type */
export interface IGetAllCitiesQuery {
  params: IGetAllCitiesParams;
  result: IGetAllCitiesResult;
}

const getAllCitiesIR: any = {
  usedParamSet: {},
  params: [],
  statement: 'SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom\nFROM cities',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom
 * FROM cities
 * ```
 */
export const getAllCities = new PreparedQuery<IGetAllCitiesParams, IGetAllCitiesResult>(
  getAllCitiesIR,
);

/** 'GetCityById' parameters type */
export interface IGetCityByIdParams {
  ogc_fid?: number | null | void;
}

/** 'GetCityById' return type */
export interface IGetCityByIdResult {
  city_name: string | null;
  geom: string | null;
  ogc_fid: number;
  region_id: number | null;
}

/** 'GetCityById' query type */
export interface IGetCityByIdQuery {
  params: IGetCityByIdParams;
  result: IGetCityByIdResult;
}

const getCityByIdIR: any = {
  usedParamSet: { ogc_fid: true },
  params: [
    { name: 'ogc_fid', required: false, transform: { type: 'scalar' }, locs: [{ a: 93, b: 100 }] },
  ],
  statement:
    'SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom\nFROM cities\nWHERE ogc_fid = :ogc_fid',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom
 * FROM cities
 * WHERE ogc_fid = :ogc_fid
 * ```
 */
export const getCityById = new PreparedQuery<IGetCityByIdParams, IGetCityByIdResult>(getCityByIdIR);

/** 'GetCitiesByRegion' parameters type */
export interface IGetCitiesByRegionParams {
  region_id?: number | null | void;
}

/** 'GetCitiesByRegion' return type */
export interface IGetCitiesByRegionResult {
  city_name: string | null;
  geom: string | null;
  ogc_fid: number;
  region_id: number | null;
}

/** 'GetCitiesByRegion' query type */
export interface IGetCitiesByRegionQuery {
  params: IGetCitiesByRegionParams;
  result: IGetCitiesByRegionResult;
}

const getCitiesByRegionIR: any = {
  usedParamSet: { region_id: true },
  params: [
    {
      name: 'region_id',
      required: false,
      transform: { type: 'scalar' },
      locs: [{ a: 95, b: 104 }],
    },
  ],
  statement:
    'SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom\nFROM cities\nWHERE region_id = :region_id',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom
 * FROM cities
 * WHERE region_id = :region_id
 * ```
 */
export const getCitiesByRegion = new PreparedQuery<
  IGetCitiesByRegionParams,
  IGetCitiesByRegionResult
>(getCitiesByRegionIR);
