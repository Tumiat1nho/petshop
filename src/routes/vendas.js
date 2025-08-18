// src/routes/vendas.js
import { Router } from 'express';
import pool, { query as q } from '../db.js';

const router = Router();

/** Lista últimas vendas */
router.get('/', async (_req, res, next) => {
  try {
    const r = await q(
      `select v.id, v.status, v.total::float, v.created_at,
              c.nome as cliente_nome,
              p.nome as pet_nome
         from vendas v
         join clientes c on c.id = v.cliente_id
    left join pets p on p.id = v.pet_id
     order by v.id desc
        limit 100`
    );
    res.json(r.rows);
  } catch (err) { next(err); }
});

/** Detalhe + itens */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const venda = await q(
      `select v.id, v.status, v.total::float, v.created_at,
              v.cliente_id, c.nome as cliente_nome,
              v.pet_id, p.nome as pet_nome
         from vendas v
         join clientes c on c.id = v.cliente_id
    left join pets p on p.id = v.pet_id
        where v.id = $1`,
      [id]
    );
    if (venda.rowCount === 0) return res.status(404).json({ error: 'venda não encontrada' });

    const itens = await q(
      `select id, tipo, ref_id, descricao, quantidade::float, preco_unit::float
         from venda_itens
        where venda_id = $1
     order by id asc`,
      [id]
    );
    res.json({ ...venda.rows[0], itens: itens.rows });
  } catch (err) { next(err); }
});

/** Cria venda */
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const cliente_id = Number(req.body?.cliente_id);
    const pet_id     = req.body?.pet_id != null ? Number(req.body.pet_id) : null;
    const itens      = Array.isArray(req.body?.itens) ? req.body.itens : [];

    if (!Number.isInteger(cliente_id)) throw new Error('cliente_id inválido');
    if (pet_id != null && !Number.isInteger(pet_id)) throw new Error('pet_id inválido');
    if (itens.length === 0) throw new Error('itens vazios');

    await client.query('BEGIN');

    const chkCli = await client.query('select 1 from clientes where id=$1', [cliente_id]);
    if (chkCli.rowCount === 0) throw new Error('cliente inexistente');
    if (pet_id != null) {
      const chkPet = await client.query('select 1 from pets where id=$1', [pet_id]);
      if (chkPet.rowCount === 0) throw new Error('pet inexistente');
    }

    const insVenda = await client.query(
      `insert into vendas (cliente_id, pet_id, status, total)
       values ($1,$2,'aberta',0)
       returning id, status, total, created_at`,
      [cliente_id, pet_id]
    );
    const vendaId = insVenda.rows[0].id;

    let total = 0;

    for (const it of itens) {
      const tipo = String(it.tipo || '').toLowerCase();
      const ref_id = Number(it.ref_id);
      const quantidade = Number(it.quantidade);

      if (!['servico','produto'].includes(tipo)) throw new Error('tipo inválido');
      if (!Number.isInteger(ref_id)) throw new Error('ref_id inválido');
      if (!Number.isFinite(quantidade) || quantidade <= 0) throw new Error('quantidade inválida');

      if (tipo === 'servico') {
        const r = await client.query(
          `select id, nome, preco from servicos
            where id = $1 and ativo = 'ativo'`,
          [ref_id]
        );
        if (r.rowCount === 0) throw new Error(`serviço ${ref_id} inexistente/inativo`);
        const { nome, preco } = r.rows[0];
        await client.query(
          `insert into venda_itens (venda_id, tipo, ref_id, descricao, quantidade, preco_unit)
           values ($1,'servico',$2,$3,$4,$5)`,
          [vendaId, ref_id, nome, quantidade, preco]
        );
        total += Number(preco) * quantidade;
      } else {
        const r = await client.query(
          `select id, nome, preco, ativo from produtos
            where id = $1 and ativo='ativo'`,
          [ref_id]
        );
        if (r.rowCount === 0) throw new Error(`produto ${ref_id} inexistente/inativo`);
        const { nome, preco } = r.rows[0];
        await client.query(
          `insert into venda_itens (venda_id, tipo, ref_id, descricao, quantidade, preco_unit)
           values ($1,'produto',$2,$3,$4,$5)`,
          [vendaId, ref_id, nome, quantidade, preco]
        );
        total += Number(preco) * quantidade;
      }
    }

    await client.query(`update vendas set total = $2 where id = $1`, [vendaId, total]);
    await client.query('COMMIT');

    const det = await client.query(
      `select v.id, v.status, v.total::float, v.created_at,
              v.cliente_id, c.nome as cliente_nome,
              v.pet_id, p.nome as pet_nome
         from vendas v
         join clientes c on c.id = v.cliente_id
    left join pets p on p.id = v.pet_id
        where v.id = $1`,
      [vendaId]
    );
    const itensRes = await client.query(
      `select id, tipo, ref_id, descricao, quantidade::float, preco_unit::float
         from venda_itens where venda_id=$1 order by id asc`,
      [vendaId]
    );
    res.status(201).json({ ...det.rows[0], itens: itensRes.rows });
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch {}
    next(err);
  } finally {
    pool.release && pool.release(); // se você estiver usando o export "pool" com connect(), ajuste conforme seu db.js
  }
});

/** Pagar venda (baixa estoque de produtos) */
router.post('/:id/pagar', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    await client.query('BEGIN');

    const v = await client.query(`select id, status from vendas where id=$1 for update`, [id]);
    if (v.rowCount === 0) throw new Error('venda não encontrada');
    if (v.rows[0].status !== 'aberta') throw new Error('apenas vendas "aberta" podem ser pagas');

    const itensProd = await client.query(
      `select ref_id as produto_id, quantidade
         from venda_itens
        where venda_id=$1 and tipo='produto'`,
      [id]
    );
    for (const it of itensProd.rows) {
      await client.query(
        `insert into estoque_movimentacoes (produto_id, tipo, quantidade, obs)
         values ($1,'saida',$2,$3)`,
        [it.produto_id, it.quantidade, `venda ${id}`]
      );
    }

    await client.query(`update vendas set status='paga' where id=$1`, [id]);
    await client.query('COMMIT');

    const det = await q(
      `select v.id, v.status, v.total::float, v.created_at,
              c.nome as cliente_nome, p.nome as pet_nome
         from vendas v
         join clientes c on c.id = v.cliente_id
    left join pets p on p.id = v.pet_id
        where v.id = $1`,
      [id]
    );
    res.json(det.rows[0]);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    next(err);
  } finally {
    client.release();
  }
});

export default router;
