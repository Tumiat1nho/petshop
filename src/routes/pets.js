import { Router } from 'express';
import pool from '../db.js';

const r = Router();

/**
 * GET /pets
 * Query params:
 *  - page (1..), limit (1..200)
 *  - cliente_id (filtra pelos pets de um cliente)
 *  - q (busca por nome do pet)
 *  - especie_id, raca_id (opcionais)
 *  - status ('ativo' | 'inativo')
 */
r.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    const add = (clause, value) => {
      params.push(value);
      where.push(clause.replace('$X', `$${params.length}`));
    };

    if (req.query.cliente_id) {
      const cid = Number(req.query.cliente_id);
      if (!Number.isInteger(cid)) return res.status(400).json({ error: 'cliente_id inválido' });
      add('p.cliente_id = $X', cid);
    }
    if (req.query.q) {
      const q = `%${req.query.q.trim()}%`;
      add('p.nome ILIKE $X', q);
    }
    if (req.query.especie_id) {
      const eid = Number(req.query.especie_id);
      if (!Number.isInteger(eid)) return res.status(400).json({ error: 'especie_id inválido' });
      add('p.especie_id = $X', eid);
    }
    if (req.query.raca_id) {
      const rid = Number(req.query.raca_id);
      if (!Number.isInteger(rid)) return res.status(400).json({ error: 'raca_id inválido' });
      add('p.raca_id = $X', rid);
    }
    if (req.query.status === 'ativo' || req.query.status === 'inativo') {
      add('p.status = $X', req.query.status);
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const totalSql = `SELECT COUNT(*)::int AS total FROM pets p ${whereSql}`;
    const { rows: [{ total }] } = await pool.query(totalSql, params);

    params.push(limit, offset);
    const sql = `
      SELECT p.id, p.nome, p.cliente_id, p.especie_id, p.raca_id, p.sexo, p.nascimento,
             p.castrado, p.observacoes, p.status, p.created_at, p.updated_at,
             c.nome AS cliente_nome, e.nome AS especie_nome, r.nome AS raca_nome
      FROM pets p
      JOIN clientes c ON c.id = p.cliente_id
      JOIN especies e ON e.id = p.especie_id
      LEFT JOIN racas r ON r.id = p.raca_id
      ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await pool.query(sql, params);
    res.json({ page, limit, total, data: rows });
  } catch (e) { next(e); }
});

/** GET /pets/:id */
r.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const sql = `
      SELECT p.id, p.nome, p.cliente_id, p.especie_id, p.raca_id, p.sexo, p.nascimento,
             p.castrado, p.observacoes, p.status, p.created_at, p.updated_at,
             c.nome AS cliente_nome, e.nome AS especie_nome, r.nome AS raca_nome
      FROM pets p
      JOIN clientes c ON c.id = p.cliente_id
      JOIN especies e ON e.id = p.especie_id
      LEFT JOIN racas r ON r.id = p.raca_id
      WHERE p.id = $1
    `;
    const { rows } = await pool.query(sql, [id]);
    if (!rows.length) return res.status(404).json({ error: 'pet não encontrado' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

/** POST /pets  - cria um pet */
r.post('/', async (req, res, next) => {
  try {
    const {
      nome, cliente_id, especie_id, raca_id = null,
      sexo = null, nascimento = null, castrado = false, observacoes = null
    } = req.body || {};

    if (!nome || typeof nome !== 'string') return res.status(400).json({ error: 'nome é obrigatório' });
    const cid = Number(cliente_id);
    const eid = Number(especie_id);
    const rid = raca_id === null ? null : Number(raca_id);

    if (!Number.isInteger(cid)) return res.status(400).json({ error: 'cliente_id inválido' });
    if (!Number.isInteger(eid)) return res.status(400).json({ error: 'especie_id inválido' });
    if (rid !== null && !Number.isInteger(rid)) return res.status(400).json({ error: 'raca_id inválido' });
    if (sexo && !['M','F'].includes(sexo)) return res.status(400).json({ error: "sexo deve ser 'M' ou 'F'" });

    const { rows } = await pool.query(
      `INSERT INTO pets (nome, cliente_id, especie_id, raca_id, sexo, nascimento, castrado, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, nome, cliente_id, especie_id, raca_id, sexo, nascimento, castrado, observacoes, status, created_at, updated_at`,
      [nome.trim(), cid, eid, rid, sexo, nascimento, Boolean(castrado), observacoes]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

/** PUT /pets/:id  - atualização parcial */
r.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const fields = [];
    const values = [];
    let i = 1;

    const set = (k, v) => { fields.push(`${k} = $${i++}`); values.push(v); };
    const { nome, cliente_id, especie_id, raca_id, sexo, nascimento, castrado, observacoes, status } = req.body || {};

    if (nome !== undefined) set('nome', nome);
    if (cliente_id !== undefined) {
      const n = Number(cliente_id);
      if (!Number.isInteger(n)) return res.status(400).json({ error: 'cliente_id inválido' });
      set('cliente_id', n);
    }
    if (especie_id !== undefined) {
      const n = Number(especie_id);
      if (!Number.isInteger(n)) return res.status(400).json({ error: 'especie_id inválido' });
      set('especie_id', n);
    }
    if (raca_id !== undefined) {
      const n = raca_id === null ? null : Number(raca_id);
      if (n !== null && !Number.isInteger(n)) return res.status(400).json({ error: 'raca_id inválido' });
      set('raca_id', n);
    }
    if (sexo !== undefined) {
      if (sexo && !['M','F'].includes(sexo)) return res.status(400).json({ error: "sexo deve ser 'M' ou 'F'" });
      set('sexo', sexo);
    }
    if (nascimento !== undefined) set('nascimento', nascimento);
    if (castrado !== undefined) set('castrado', Boolean(castrado));
    if (observacoes !== undefined) set('observacoes', observacoes);
    if (status !== undefined) set('status', status); // 'ativo' | 'inativo'
    set('updated_at', new Date());

    if (!fields.length) return res.status(400).json({ error: 'nada para atualizar' });

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE pets SET ${fields.join(', ')} WHERE id = $${i}
       RETURNING id, nome, cliente_id, especie_id, raca_id, sexo, nascimento, castrado, observacoes, status, created_at, updated_at`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'pet não encontrado' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

/** DELETE /pets/:id  - soft delete (status = inativo) */
r.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const { rows } = await pool.query(
      `UPDATE pets SET status = 'inativo', updated_at = now()
       WHERE id = $1 RETURNING id, nome, status`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'pet não encontrado' });
    res.json({ ok: true, pet: rows[0] });
  } catch (e) { next(e); }
});

export default r;
