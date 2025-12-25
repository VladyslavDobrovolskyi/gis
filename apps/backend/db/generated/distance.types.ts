/** Types generated for queries found in "db/sql/distance.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetDistanceFromTo' parameters type */
export interface IGetDistanceFromToParams {
  from?: string | null | void;
  to?: string | null | void;
}

/** 'GetDistanceFromTo' return type */
export interface IGetDistanceFromToResult {
  city_from: string;
  city_to: string;
  distance_meters: number | null;
}

/** 'GetDistanceFromTo' query type */
export interface IGetDistanceFromToQuery {
  params: IGetDistanceFromToParams;
  result: IGetDistanceFromToResult;
}

const getDistanceFromToIR: any = {
  usedParamSet: { from: true, to: true },
  params: [
    { name: 'from', required: false, transform: { type: 'scalar' }, locs: [{ a: 199, b: 203 }] },
    { name: 'to', required: false, transform: { type: 'scalar' }, locs: [{ a: 219, b: 221 }] },
  ],
  statement:
    'SELECT \n  c1.name AS city_from,\n  c2.name AS city_to,\n  ST_Distance(\n    c1.location::geography,\n    c2.location::geography\n  ) AS distance_meters\nFROM cities c1\nCROSS JOIN cities c2\nWHERE c1.name = :from AND c2.name = :to',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   c1.name AS city_from,
 *   c2.name AS city_to,
 *   ST_Distance(
 *     c1.location::geography,
 *     c2.location::geography
 *   ) AS distance_meters
 * FROM cities c1
 * CROSS JOIN cities c2
 * WHERE c1.name = :from AND c2.name = :to
 * ```
 */
export const getDistanceFromTo = new PreparedQuery<
  IGetDistanceFromToParams,
  IGetDistanceFromToResult
>(getDistanceFromToIR);
