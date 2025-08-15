// src/db.js
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,                 // ex.: postgres.<project_ref>
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },

  // boas práticas com pooler
  max: 5,                        // poucas conexões já bastam
  idleTimeoutMillis: 15_000,     // encerra idle após 15s
  connectionTimeoutMillis: 10_000
});

// evita que eventos de erro não tratados derrubem o processo
pool.on('error', (err) => {
  console.error('pool error (ignorado para não derrubar o app):', err.message);
});

// funções utilitárias
export const query = (text, params) => pool.query(text, params);

// encerra o pool com graça
const shutdown = async (signal) => {
  try {
    console.log(`\n${signal} recebido. Fechando pool...`);
    await pool.end();
    console.log('Pool fechado. 👋');
    process.exit(0);
  } catch (e) {
    console.error('Erro ao fechar pool:', e);
    process.exit(1);
  }
};
['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

export default pool;
