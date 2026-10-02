import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run db:migrate.');

const here = dirname(fileURLToPath(import.meta.url));
const migration = await readFile(resolve(here, '../migrations/0001_records.sql'), 'utf8');
const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('Migrated core_dummy_web.records.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
