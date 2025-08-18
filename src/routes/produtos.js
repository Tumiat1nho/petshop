// src/routes/produtos.js
import { Router } from 'express';
import { query as q } from '../db.js';

const router = Router();

function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// GET /produtos
router.get('/', async (_req, res, next) => {
  try {
    const r = await q(
      `select id, nome, descricao, preco::float, unidade, ativo, created_at, updated_at
         from produtos
        order by id desc`
    );
    res.json(r.rows);
  } catch (err) { next(err); }
});

// POST /produtos
router.post('/', async (req, res, next) => {
  try {
    const nome = (req.body?.nome || '').trim();
    const descricao = (req.body?.descricao || '').trim() || null;
    const preco = toNumber(req.body?.preco);
    const unidade = (req.body?.unidade || 'UN').toUpperCase();
    const ativo = (req.body?.ativo || 'ativo');

    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
    if (!preco || preco <= 0) return res.status(400).json({ error: 'preço inválido' });
    if (!['UN','KG','L'].includes(unidade)) return res.status(400).json({ error: 'unidade inválida' });
    if (!['ativo','inativo'].includes(ativo)) return res.status(400).json({ error: 'status inválido' });

    const r = await q(
      `insert into produtos (nome, descricao, preco, unidade, ativo)
       values ($1,$2,$3,$4,$5)
       returning id, nome, descricao, preco::float, unidade, ativo, created_at, updated_at`,
      [nome, descricao, preco, unidade, ativo]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// PUT /produtos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const nome = (req.body?.nome || '').trim();
    const descricao = (req.body?.descricao || '').trim() || null;
    const preco = toNumber(req.body?.preco);
    const unidade = (req.body?.unidade || 'UN').toUpperCase();
    const ativo = (req.body?.ativo || 'ativo');

    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
    if (!preco || preco <= 0) return res.status(400).json({ error: 'preço inválido' });
    if (!['UN','KG','L'].includes(unidade)) return res.status(400).json({ error: 'unidade inválida' });
    if (!['ativo','inativo'].includes(ativo)) return res.status(400).json({ error: 'status inválido' });

    const r = await q(
      `update produtos
          set nome=$2, descricao=$3, preco=$4, unidade=$5, ativo=$6, updated_at=now()
        where id=$1
      returning id, nome, descricao, preco::float, unidade, ativo, created_at, updated_at`,
      [id, nome, descricao, preco, unidade, ativo]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'produto não encontrado' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /produtos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const r = await q(`delete from produtos where id=$1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'produto não encontrado' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
