// src/routes/servicos.js
import { Router } from 'express';
import { query as q } from '../db.js';

const router = Router();

/*
  Tabela: public.servicos
  - id, nome, descricao, preco, ativo, created_at, updated_at
*/

// helper
function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// GET /servicos
router.get('/', async (_req, res, next) => {
  try {
    const r = await q(
      `select id, nome, descricao, preco::float, ativo, created_at, updated_at
         from servicos
        order by id desc`
    );
    res.json(r.rows);
  } catch (err) { next(err); }
});

// POST /servicos
router.post('/', async (req, res, next) => {
  try {
    const nome = (req.body?.nome || '').trim();
    const descricao = (req.body?.descricao || '').trim() || null;
    const preco = toNumber(req.body?.preco);
    const ativo = (req.body?.ativo || 'ativo');

    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
    if (!preco || preco <= 0) return res.status(400).json({ error: 'preço inválido' });
    if (!['ativo','inativo'].includes(ativo)) return res.status(400).json({ error: 'status inválido' });

    const r = await q(
      `insert into servicos (nome, descricao, preco, ativo)
       values ($1,$2,$3,$4)
       returning id, nome, descricao, preco::float, ativo, created_at, updated_at`,
      [nome, descricao, preco, ativo]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// PUT /servicos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const nome = (req.body?.nome || '').trim();
    const descricao = (req.body?.descricao || '').trim() || null;
    const preco = toNumber(req.body?.preco);
    const ativo = (req.body?.ativo || 'ativo');

    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
    if (!preco || preco <= 0) return res.status(400).json({ error: 'preço inválido' });
    if (!['ativo','inativo'].includes(ativo)) return res.status(400).json({ error: 'status inválido' });

    const r = await q(
      `update servicos
          set nome = $2,
              descricao = $3,
              preco = $4,
              ativo = $5,
              updated_at = now()
        where id = $1
      returning id, nome, descricao, preco::float, ativo, created_at, updated_at`,
      [id, nome, descricao, preco, ativo]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'serviço não encontrado' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /servicos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const r = await q(`delete from servicos where id = $1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'serviço não encontrado' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
