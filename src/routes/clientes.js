import { Router } from 'express';
import pool from '../db.js';
import asyncHandler from '../middleware/asyncHandler.js';

const r = Router();

/**
 * GET /clientes
 * Query params:
 *  - page (1..), limit (1..200), q (busca por nome ou email)
 *  - status (ativo|inativo) opcional
 */
r.get('/', asyncHandler(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
  const offset = (page - 1) * limit;
  const q = (req.query.q || '').trim();
  const status = (req.query.status || '').trim();

  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    params.push(`%${q}%`);
    where.push('(c.nome ILIKE $' + (params.length - 1) + ' OR c.email ILIKE $' + params.length + ')');
  }
  if (status === 'ativo' || status === 'inativo') {
    params.push(status);
    where.push('c.status = $' + params.length);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  // total
  const totalSql = `SELECT COUNT(*)::int AS total FROM clientes c ${whereSql}`;
  const { rows: [{ total }] } = await pool.query(totalSql, params);

  // dados
  params.push(limit, offset);
  const sql = `
    SELECT c.id, c.nome, c.email, c.telefone, c.documento, c.endereco, c.status,
           c.created_at, c.updated_at
    FROM clientes c
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;
  const { rows } = await pool.query(sql, params);
  res.json({ page, limit, total, data: rows });
}));

/**
 * GET /clientes/:id
 */
r.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

  const { rows } = await pool.query(
    `SELECT id, nome, email, telefone, documento, endereco, status, created_at, updated_at
     FROM clientes WHERE id = $1`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'cliente não encontrado' });
  res.json(rows[0]);
}));

/**
 * POST /clientes
 * body: { nome, email?, telefone?, documento?, endereco? }
 */
r.post('/', asyncHandler(async (req, res) => {
  const { nome, email, telefone, documento, endereco } = req.body || {};
  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return res.status(400).json({ error: 'nome é obrigatório' });
  }

  const { rows } = await pool.query(
    `INSERT INTO clientes (nome, email, telefone, documento, endereco)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nome, email, telefone, documento, endereco, status, created_at, updated_at`,
    [nome.trim(), email || null, telefone || null, documento || null, endereco || null]
  );
  res.status(201).json(rows[0]);
}));

/**
 * PUT /clientes/:id  (atualização parcial)
 */
r.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

  const fields = [];
  const values = [];
  let i = 1;

  const upsert = (key, val) => {
    fields.push(`${key} = $${i++}`);
    values.push(val);
  };

  const { nome, email, telefone, documento, endereco, status } = req.body || {};
  if (nome !== undefined)      upsert('nome', nome);
  if (email !== undefined)     upsert('email', email);
  if (telefone !== undefined)  upsert('telefone', telefone);
  if (documento !== undefined) upsert('documento', documento);
  if (endereco !== undefined)  upsert('endereco', endereco);
  if (status !== undefined)    upsert('status', status); // 'ativo'|'inativo'
  upsert('updated_at', new Date());

  if (!fields.length) return res.status(400).json({ error: 'nada para atualizar' });

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE clientes SET ${fields.join(', ')}
     WHERE id = $${i}
     RETURNING id, nome, email, telefone, documento, endereco, status, created_at, updated_at`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'cliente não encontrado' });
  res.json(rows[0]);
}));

/**
 * DELETE /clientes/:id  (soft delete → status = 'inativo')
 * Para deletar de verdade, troque por DELETE FROM clientes WHERE id=$1
 */
r.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

  const { rows } = await pool.query(
    `UPDATE clientes SET status = 'inativo', updated_at = now()
     WHERE id = $1
     RETURNING id, nome, status`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'cliente não encontrado' });
  res.json({ ok: true, cliente: rows[0] });
}));

export default r;
