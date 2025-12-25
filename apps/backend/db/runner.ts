/* GPT generated */
import { Pool, PoolClient, QueryResult } from 'pg';
import type { PreparedQuery } from '@pgtyped/runtime';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then((client) => {
    console.log('Connected to Database successfully');
    client.release();
  })
  .catch((err) => {
    console.error('Failed to connect to Database', err);
    process.exit(1);
  });

type DBExecutor = Pool | PoolClient;

export async function runQuery<P, R>(
  query: PreparedQuery<P, R>,
  params?: P,
  executor?: DBExecutor,
): Promise<R[]> {
  const db = executor ?? pool;

  return query.run(params as P, db);
}

export async function runOne<P, R>(
  query: PreparedQuery<P, R>,
  params?: P,
  executor?: DBExecutor,
): Promise<R> {
  const rows = await runQuery(query, params, executor);

  if (!rows.length) {
    throw new Error('Expected one row, got zero');
  }

  return rows[0];
}

export async function runRaw(
  sql: string,
  params?: any[],
  executor?: DBExecutor,
): Promise<QueryResult<any>> {
  const db = executor ?? pool;
  return db.query(sql, params);
}
