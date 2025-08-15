// test_especies.js
import { query, pool } from './src/db.js';

const run = async () => {
  try {
    const { rows } = await query('select id::text, nome from especies order by id');
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end(); // encerra explicitamente
  }
};
run();
