import pool from './src/db.js';

try {
  const r = await pool.query('select current_user, now()');
  console.log('OK:', r.rows[0]);
} catch (e) {
  console.error('DB FAIL:', e.message);
}
process.exit(0);
