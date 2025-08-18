import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import pool from '../db.js';

const router = express.Router();

// checa se existem colunas inicio/fim
let HAS_INICIO_COL = false;
let HAS_FIM_COL = false;

(async () => {
  try {
    const r = await pool.query(`
      select column_name
        from information_schema.columns
       where table_schema='public'
         and table_name='agendamentos'
         and column_name in ('inicio','fim')
    `);
    for (const row of r.rows) {
      if (row.column_name === 'inicio') HAS_INICIO_COL = true;
      if (row.column_name === 'fim') HAS_FIM_COL = true;
    }
    console.log('[agendamentos] columns => inicio:', HAS_INICIO_COL, 'fim:', HAS_FIM_COL);
  } catch (e) {
    console.error('Col check fail:', e.message);
  }
})();

// LISTAR – usa coalesce para suportar schemas diferentes
router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `select a.id,
            a.cliente_id,
            c.nome as cliente_nome,
            a.pet_id,
            p.nome as pet_nome,
            a.servico,
            coalesce(a.data_hora, a.inicio) as data_hora,
            a.fim
       from agendamentos a
  left join clientes c on c.id = a.cliente_id
  left join pets     p on p.id = a.pet_id
      order by coalesce(a.data_hora, a.inicio) desc, a.id desc`
  );
  res.json(rows);
}));

// CRIAR – grava data_hora; se existir inicio/fim no schema, também preenche
router.post('/', asyncHandler(async (req, res) => {
  const { cliente_id, pet_id, servico, data_hora, duracao_min } = req.body || {};
  if (!cliente_id || !servico || !data_hora) {
    return res.status(400).json({ error: 'cliente_id, servico e data_hora são obrigatórios' });
  }

  const startIso = new Date(data_hora).toISOString();
  const minutes = Number.isFinite(Number(duracao_min))
    ? Number(duracao_min)
    : Number(process.env.DEFAULT_APPT_MINUTES || 60);

  const endIso = new Date(startIso);
  endIso.setMinutes(endIso.getMinutes() + minutes);
  const endIsoStr = endIso.toISOString();

  const cols = ['cliente_id','pet_id','servico','data_hora'];
  const vals = [Number(cliente_id), pet_id ? Number(pet_id) : null, servico, startIso];

  if (HAS_INICIO_COL) { cols.push('inicio'); vals.push(startIso); }
  if (HAS_FIM_COL)    { cols.push('fim');    vals.push(endIsoStr); }

  const placeholders = cols.map((_, i) => `$${i+1}`).join(',');
  const returningCols = ['id','cliente_id','pet_id','servico'];
  returningCols.push(HAS_INICIO_COL ? 'inicio as data_hora' : 'data_hora');
  if (HAS_FIM_COL) returningCols.push('fim');

  const { rows } = await pool.query(
    `insert into agendamentos (${cols.join(',')})
     values (${placeholders})
     returning ${returningCols.join(', ')}`,
    vals
  );

  res.status(201).json(rows[0]);
}));

// EXCLUIR
router.delete('/:id', asyncHandler(async (req, res) => {
  const r = await pool.query('delete from agendamentos where id = $1', [req.params.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
}));

export default router;
