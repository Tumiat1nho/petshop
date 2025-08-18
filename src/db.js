// src/db.js
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

function req(name) {
  const v = (process.env[name] ?? '').trim();
  if (!v) throw new Error(`ENV ${name} ausente`);
  return v;
}

const DB_HOST = req('DB_HOST');
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_NAME = req('DB_NAME');
const DB_USER = req('DB_USER');
const DB_PASSWORD = req('DB_PASSWORD');

// Monta connectionString para evitar que o pg use defaults (PGUSER etc.)
const connectionString =
  `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}` +
  `@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

console.log('[DB] conectando como:', DB_USER, 'em', DB_HOST);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 5),
  idleTimeoutMillis: 15_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  console.error('pg pool error:', err.message);
});

export const query = (text, params) => pool.query(text, params);
export { pool };
export default pool;

// desligamento gracioso
async function shutdown(signal) {
  try {
    console.log(`\n${signal} recebido. Fechando pool...`);
    await pool.end();
    console.log('Pool fechado.');
    process.exit(0);
  } catch (e) {
    console.error('Erro ao fechar pool:', e);
    process.exit(1);
  }
}
if (process.env.NODE_ENV !== 'test') {
  ['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));
}
