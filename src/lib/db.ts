import pg from 'pg';
import { randomUUID } from 'node:crypto';

let pool: pg.Pool | null = null;

function db(): pg.Pool {
  if (pool) return pool;
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not set. Run app provisioning and configure .env.local.');
  pool = new pg.Pool({ connectionString, max: 5 });
  return pool;
}

export interface DummyRecord {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  createdAt: string;
}

const RECORD_COLUMNS = `
  id,
  organization_id AS "organizationId",
  created_by AS "createdBy",
  name,
  created_at AS "createdAt"
`;

export async function listRecords(organizationId: string): Promise<DummyRecord[]> {
  const { rows } = await db().query<DummyRecord>(
    `SELECT ${RECORD_COLUMNS}
     FROM core_dummy_web.records
     WHERE organization_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [organizationId],
  );
  return rows;
}

export async function createRecord(
  organizationId: string,
  createdBy: string,
  name: string,
): Promise<DummyRecord> {
  const { rows } = await db().query<DummyRecord>(
    `INSERT INTO core_dummy_web.records (id, organization_id, created_by, name)
     VALUES ($1, $2, $3, $4)
     RETURNING ${RECORD_COLUMNS}`,
    [randomUUID(), organizationId, createdBy, name],
  );
  return rows[0]!;
}

export async function deleteRecord(organizationId: string, id: string): Promise<boolean> {
  const result = await db().query(
    `DELETE FROM core_dummy_web.records
     WHERE id = $1 AND organization_id = $2`,
    [id, organizationId],
  );
  return result.rowCount === 1;
}

export async function closeDb(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}
