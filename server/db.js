import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://breezy:breezypass@postgres:5432/breezydb',
});

export async function initDatabase() {
  try {
    const client = await pool.connect();
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    client.release();
    console.log('[DB] PostgreSQL schema verified and up to date.');
  } catch (err) {
    console.warn('[DB] PostgreSQL connection pending or running in memory mode:', err.message);
  }
}
