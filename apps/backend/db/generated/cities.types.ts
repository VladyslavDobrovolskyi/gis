/** Types generated for queries found in "db/sql/cities.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetAllCities' parameters type */
export type IGetAllCitiesParams = void;

/** 'GetAllCities' return type */
export interface IGetAllCitiesResult {
  geometry: string | null;
  id: number;
  name: string;
  population: number | null;
}

/** 'GetAllCities' query type */
export interface IGetAllCitiesQuery {
  params: IGetAllCitiesParams;
  result: IGetAllCitiesResult;
}

const getAllCitiesIR: any = {
  usedParamSet: {},
  params: [],
  statement: 'SELECT id, name, population, ST_AsText(location) AS geometry FROM cities',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, name, population, ST_AsText(location) AS geometry FROM cities
 * ```
 */
export const getAllCities = new PreparedQuery<IGetAllCitiesParams, IGetAllCitiesResult>(
  getAllCitiesIR,
);
