/** Types generated for queries found in "db/sql/countries.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetAllCountries' parameters type */
export type IGetAllCountriesParams = void;

/** 'GetAllCountries' return type */
export interface IGetAllCountriesResult {
  geom: string | null;
  group_code: string | null;
  iso_code: string | null;
  name: string | null;
  ogc_fid: number;
  shape_id: string | null;
  type: string | null;
}

/** 'GetAllCountries' query type */
export interface IGetAllCountriesQuery {
  params: IGetAllCountriesParams;
  result: IGetAllCountriesResult;
}

const getAllCountriesIR: any = {
  usedParamSet: {},
  params: [],
  statement:
    'SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type\nFROM countries',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
 * FROM countries
 * ```
 */
export const getAllCountries = new PreparedQuery<IGetAllCountriesParams, IGetAllCountriesResult>(
  getAllCountriesIR,
);

/** 'GetCountryById' parameters type */
export interface IGetCountryByIdParams {
  ogc_fid?: number | null | void;
}

/** 'GetCountryById' return type */
export interface IGetCountryByIdResult {
  geom: string | null;
  group_code: string | null;
  iso_code: string | null;
  name: string | null;
  ogc_fid: number;
  shape_id: string | null;
  type: string | null;
}

/** 'GetCountryById' query type */
export interface IGetCountryByIdQuery {
  params: IGetCountryByIdParams;
  result: IGetCountryByIdResult;
}

const getCountryByIdIR: any = {
  usedParamSet: { ogc_fid: true },
  params: [
    { name: 'ogc_fid', required: false, transform: { type: 'scalar' }, locs: [{ a: 118, b: 125 }] },
  ],
  statement:
    'SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type\nFROM countries\nWHERE ogc_fid = :ogc_fid',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
 * FROM countries
 * WHERE ogc_fid = :ogc_fid
 * ```
 */
export const getCountryById = new PreparedQuery<IGetCountryByIdParams, IGetCountryByIdResult>(
  getCountryByIdIR,
);
