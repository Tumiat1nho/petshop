// NODE/src/routes/clientes.js
import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import pool from '../db.js';

const router = express.Router();

// listar
router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    'select id, nome, telefone, email from clientes order by id'
  );
  res.json(rows);
}));

// criar
router.post('/', asyncHandler(async (req, res) => {
  const { nome, telefone, email } = req.body || {};
  if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });

  const { rows } = await pool.query(
    `insert into clientes (nome, telefone, email)
     values ($1,$2,$3)
     returning id, nome, telefone, email`,
    [nome, telefone ?? null, email ?? null]
  );
  res.status(201).json(rows[0]);
}));

// excluir
router.delete('/:id', asyncHandler(async (req, res) => {
  const r = await pool.query('delete from clientes where id=$1', [req.params.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
}));

export default router;
