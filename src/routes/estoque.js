// src/routes/estoque.js
import { Router } from 'express';
import { query as q } from '../db.js';

const router = Router();

/*
  Tabela esperada: public.estoque_movimentacoes
  - id serial PK
  - produto_id int references produtos(id)
  - tipo text check (tipo in ('entrada','saida'))
  - quantidade numeric not null check (quantidade > 0)
  - obs text
  - created_at timestamptz default now()

  Saldo = soma(entradas) - soma(saídas)
*/

// lista últimas movimentações
router.get('/movimentos', async (_req, res, next) => {
  try {
    const r = await q(
      `select m.id, m.produto_id, p.nome as produto_nome, m.tipo, m.quantidade::float, m.obs, m.created_at
         from estoque_movimentacoes m
         join produtos p on p.id = m.produto_id
        order by m.id desc
        limit 100`
    );
    res.json(r.rows);
  } catch (err) { next(err); }
});

// saldo por produto
router.get('/saldo/:produtoId', async (req, res, next) => {
  try {
    const id = Number(req.params.produtoId);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const r = await q(
      `select
         coalesce(sum(case when tipo = 'entrada' then quantidade else -quantidade end),0)::float as saldo
       from estoque_movimentacoes
      where produto_id = $1`,
      [id]
    );
    res.json({ produto_id: id, saldo: r.rows[0].saldo });
  } catch (err) { next(err); }
});

// cria lançamento (entrada/saída)
router.post('/movimentos', async (req, res, next) => {
  try {
    const produto_id = Number(req.body?.produto_id);
    const tipo = (req.body?.tipo || '').trim();
    const quantidade = Number(req.body?.quantidade);
    const obs = (req.body?.obs || '').trim() || null;

    if (!Number.isInteger(produto_id)) return res.status(400).json({ error: 'produto_id inválido' });
    if (!['entrada','saida'].includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });
    if (!Number.isFinite(quantidade) || quantidade <= 0) return res.status(400).json({ error: 'quantidade inválida' });

    const r = await q(
      `insert into estoque_movimentacoes (produto_id, tipo, quantidade, obs)
       values ($1,$2,$3,$4)
       returning id, produto_id, tipo, quantidade::float, obs, created_at`,
      [produto_id, tipo, quantidade, obs]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

export default router;
