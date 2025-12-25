import { Pool, PoolClient, QueryResult } from 'pg';
import type { PreparedQuery } from '@pgtyped/runtime';
import dotenv from 'dotenv';

dotenv.config();

// -------------------- Инициализация пула --------------------
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }, // если нужно для prod
});

// Проверка соединения при старте
pool
  .connect()
  .then((client) => {
    console.log('Postgres pool connected');
    client.release();
  })
  .catch((err) => {
    console.error('Failed to connect to Postgres', err);
    process.exit(1);
  });

// -------------------- Типы для раннера --------------------
type DBExecutor = Pool | PoolClient;

/**
 * Универсальный раннер pgtyped-запросов
 */
export async function runQuery<P, R>(
  query: PreparedQuery<P, R>,
  params?: P,
  executor?: DBExecutor,
): Promise<R[]> {
  const db = executor ?? pool;

  return query.run(params as P, db);
}

/**
 * Удобный раннер для получения одной строки
 */
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
// -------------------- Экспорт пула на случай транзакций --------------------
export { pool };
