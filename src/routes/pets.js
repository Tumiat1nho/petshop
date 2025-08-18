// NODE/src/routes/pets.js
import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import pool from '../db.js';

const router = express.Router();

/**
 * GET /pets
 * Lista pets (opcionalmente filtrando por ?cliente_id=)
 * Retorna também nome do cliente e nome da espécie.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { cliente_id } = req.query;

  const baseSQL = `
    select
      p.id,
      p.nome,
      p.especie_id,
      e.nome as especie,
      p.raca,
      p.cliente_id,
      c.nome as cliente_nome
    from pets p
    join clientes c on c.id = p.cliente_id
    left join especies e on e.id = p.especie_id
  `;

  const { rows } = cliente_id
    ? await pool.query(baseSQL + ' where p.cliente_id = $1 order by p.id', [cliente_id])
    : await pool.query(baseSQL + ' order by p.id');

  res.json(rows);
}));

/**
 * POST /pets
 * Cria pet. Aceita:
 * - especie_id (preferencial)
 * - OU especie (texto) -> tenta mapear para especies.id
 */
router.post('/', asyncHandler(async (req, res) => {
  let { nome, especie_id, especie, raca, cliente_id } = req.body || {};

  if (!nome || !cliente_id) {
    return res.status(400).json({ error: 'nome e cliente_id são obrigatórios' });
  }

  // tenta mapear especie (texto) para especie_id, se necessário
  if (!especie_id && especie) {
    const f = await pool.query('select id from especies where nome ilike $1 limit 1', [especie]);
    if (f.rowCount) especie_id = f.rows[0].id;
  }

  if (!especie_id) {
    return res.status(400).json({ error: 'especie_id é obrigatório' });
  }

  const { rows } = await pool.query(
    `insert into pets (nome, especie_id, raca, cliente_id)
     values ($1,$2,$3,$4)
     returning id, nome, especie_id, raca, cliente_id`,
    [nome, Number(especie_id), raca ?? null, Number(cliente_id)]
  );

  res.status(201).json(rows[0]);
}));

/** DELETE /pets/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  const r = await pool.query('delete from pets where id = $1', [req.params.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
}));

export default router;
