import { Pool } from 'pg'

let pool = null
let ready = false

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
    })
  }
  return pool
}

export async function ensureDB() {
  if (ready) return
  const db = getPool()
  await db.query(`
    CREATE TABLE IF NOT EXISTS grupos (
      id                    SERIAL PRIMARY KEY,
      enviado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      adicionado_manualmente BOOLEAN     NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS convidados (
      id               SERIAL PRIMARY KEY,
      grupo_id         INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
      nome             TEXT    NOT NULL,
      data_nascimento  TEXT    NOT NULL,
      ordem            INTEGER NOT NULL DEFAULT 0
    );
  `)
  ready = true
}
