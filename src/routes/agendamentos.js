import { Router } from 'express';
import pool from '../db.js';

const r = Router();

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// Pré-cheque de conflitos (pet / staff)
async function temConflito(client, { idExcluir = null, pet_id, staff_id, inicio, fim }) {
  const janela = `tstzrange($2,$3,'[)')`;

  // Pet
  let sql = `
    select 1
    from agendamentos a
    where a.pet_id = $1
      and tstzrange(a.inicio, a.fim, '[)') && ${janela}
  `;
  const params = [pet_id, inicio, fim];
  if (idExcluir) { sql += ' and a.id <> $4'; params.push(idExcluir); }
  const petConflito = await client.query(sql, params);
  if (petConflito.rowCount) return { who: 'pet' };

  // Staff (se houver)
  if (staff_id) {
    let sqlS = `
      select 1
      from agendamentos a
      where a.staff_id = $1
        and tstzrange(a.inicio, a.fim, '[)') && ${janela}
    `;
    const paramsS = [staff_id, inicio, fim];
    if (idExcluir) { sqlS += ' and a.id <> $4'; paramsS.push(idExcluir); }
    const staffConflito = await client.query(sqlS, paramsS);
    if (staffConflito.rowCount) return { who: 'staff' };
  }
  return null;
}

/**
 * GET /agendamentos?from=&to=&status=&staff_id=&cliente_id=&pet_id=&page=&limit=
 * Retorna agendamentos que SOBREPOEM o intervalo informado.
 */
r.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const offset = (page - 1) * limit;

    const now = new Date();
    const dFrom = toDate(req.query.from) || now;
    const dTo   = toDate(req.query.to)   || new Date(now.getTime() + 7*24*3600*1000);
    if (dFrom >= dTo) return res.status(400).json({ error: '`from` deve ser menor que `to`' });

    const where = [];
    const params = [];
    const add = (clause, val) => { params.push(val); where.push(clause.replace('$X', `$${params.length}`)); };

    add('(a.inicio < $X)', dTo.toISOString());
    add('(a.fim    > $X)', dFrom.toISOString());

    if (req.query.status) add('a.status = $X', req.query.status);

    if (req.query.staff_id) {
      const v = Number(req.query.staff_id);
      if (!Number.isInteger(v)) return res.status(400).json({ error: 'staff_id inválido' });
      add('a.staff_id = $X', v);
    }
    if (req.query.cliente_id) {
      const v = Number(req.query.cliente_id);
      if (!Number.isInteger(v)) return res.status(400).json({ error: 'cliente_id inválido' });
      add('a.cliente_id = $X', v);
    }
    if (req.query.pet_id) {
      const v = Number(req.query.pet_id);
      if (!Number.isInteger(v)) return res.status(400).json({ error: 'pet_id inválido' });
      add('a.pet_id = $X', v);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const countSql = `SELECT COUNT(*)::int AS total FROM agendamentos a ${whereSql}`;
    const { rows: [{ total }] } = await pool.query(countSql, params);

    params.push(limit, offset);
    const sql = `
      SELECT a.id, a.pet_id, a.cliente_id, a.staff_id, a.inicio, a.fim, a.status, a.observacoes,
             a.created_at, a.updated_at,
             p.nome AS pet_nome, c.nome AS cliente_nome, s.nome AS staff_nome
      FROM agendamentos a
      JOIN pets p     ON p.id = a.pet_id
      JOIN clientes c ON c.id = a.cliente_id
      LEFT JOIN staff s ON s.id = a.staff_id
      ${whereSql}
      ORDER BY a.inicio ASC
      LIMIT $${params.length-1} OFFSET $${params.length}
    `;
    const { rows } = await pool.query(sql, params);
    res.json({ page, limit, total, data: rows, window: { from: dFrom.toISOString(), to: dTo.toISOString() } });
  } catch (e) { next(e); }
});

/** GET /agendamentos/:id  (com itens) */
r.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const headSql = `
      SELECT a.id, a.pet_id, a.cliente_id, a.staff_id, a.inicio, a.fim, a.status, a.observacoes,
             a.created_at, a.updated_at,
             p.nome AS pet_nome, c.nome AS cliente_nome, s.nome AS staff_nome
      FROM agendamentos a
      JOIN pets p     ON p.id = a.pet_id
      JOIN clientes c ON c.id = a.cliente_id
      LEFT JOIN staff s ON s.id = a.staff_id
      WHERE a.id = $1
    `;
    const { rows: h } = await pool.query(headSql, [id]);
    if (!h.length) return res.status(404).json({ error: 'agendamento não encontrado' });

    const itemsSql = `
      SELECT asv.id, asv.servico_id, sv.nome AS servico_nome,
             asv.quantidade, asv.preco_unitario, asv.desconto
      FROM agendamento_servicos asv
      JOIN servicos sv ON sv.id = asv.servico_id
      WHERE asv.agendamento_id = $1
      ORDER BY asv.id
    `;
    const { rows: itens } = await pool.query(itemsSql, [id]);

    res.json({ ...h[0], itens });
  } catch (e) { next(e); }
});

/** POST /agendamentos (com itens e validação) */
r.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      pet_id, cliente_id, staff_id = null,
      inicio, fim, status = 'marcado', observacoes = null,
      itens = []
    } = req.body || {};

    const dIni = toDate(inicio);
    const dFim = toDate(fim);
    if (!Number.isInteger(Number(pet_id))) return res.status(400).json({ error: 'pet_id inválido' });
    if (!Number.isInteger(Number(cliente_id))) return res.status(400).json({ error: 'cliente_id inválido' });
    if (!dIni || !dFim || dIni >= dFim) return res.status(400).json({ error: 'intervalo de datas inválido' });

    await client.query('BEGIN');

    // conflito?
    const conflito = await temConflito(client, {
      pet_id: Number(pet_id),
      staff_id: staff_id ? Number(staff_id) : null,
      inicio: dIni.toISOString(),
      fim:    dFim.toISOString()
    });
    if (conflito) {
      await client.query('ROLLBACK');
      const msg = conflito.who === 'pet'
        ? 'Conflito de horário: o pet já possui agendamento nesse intervalo.'
        : 'Conflito de horário: o profissional já possui agendamento nesse intervalo.';
      return res.status(409).json({ error: msg });
    }

    const insertHead = `
      INSERT INTO agendamentos (pet_id, cliente_id, staff_id, inicio, fim, status, observacoes)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, pet_id, cliente_id, staff_id, inicio, fim, status, observacoes, created_at, updated_at
    `;
    const { rows: [ag] } = await client.query(insertHead, [
      Number(pet_id), Number(cliente_id), staff_id || null,
      dIni.toISOString(), dFim.toISOString(), status, observacoes
    ]);

    for (const item of (Array.isArray(itens) ? itens : [])) {
      const servicoId = Number(item.servico_id);
      if (!Number.isInteger(servicoId)) throw new Error('servico_id inválido em itens');
      const qtd = Number(item.quantidade || 1);
      if (!Number.isInteger(qtd) || qtd <= 0) throw new Error('quantidade inválida');

      let preco = item.preco_unitario;
      if (preco === undefined || preco === null) {
        const { rows: s } = await client.query('SELECT preco_padrao FROM servicos WHERE id=$1', [servicoId]);
        if (!s.length) throw new Error(`servico ${servicoId} não existe`);
        preco = s[0].preco_padrao;
      }
      const desc = Number(item.desconto || 0);

      await client.query(
        `INSERT INTO agendamento_servicos (agendamento_id, servico_id, quantidade, preco_unitario, desconto)
         VALUES ($1,$2,$3,$4,$5)`,
        [ag.id, servicoId, qtd, preco, desc]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(ag);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    next(e);
  } finally {
    client.release();
  }
});

/** PUT /agendamentos/:id (valida conflito se mudar janela/staff/pet) */
r.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    // valores atuais
    const { rows: curRows } = await pool.query(
      'select pet_id, staff_id, inicio, fim from agendamentos where id = $1', [id]
    );
    if (!curRows.length) return res.status(404).json({ error: 'agendamento não encontrado' });
    const cur = curRows[0];

    const novoPet   = (req.body.pet_id   !== undefined) ? Number(req.body.pet_id)   : Number(cur.pet_id);
    const novoStaff = (req.body.staff_id !== undefined) ? (req.body.staff_id===null ? null : Number(req.body.staff_id)) : (cur.staff_id===null ? null : Number(cur.staff_id));
    const novoIni   = (req.body.inicio   !== undefined) ? toDate(req.body.inicio) : new Date(cur.inicio);
    const novoFim   = (req.body.fim      !== undefined) ? toDate(req.body.fim)    : new Date(cur.fim);

    if (!novoIni || !novoFim || novoIni >= novoFim) {
      return res.status(400).json({ error: 'intervalo de datas inválido' });
    }

    // conflito?
    const conflitoU = await temConflito(pool, {
      idExcluir: id,
      pet_id: novoPet,
      staff_id: novoStaff,
      inicio: novoIni.toISOString(),
      fim:    novoFim.toISOString()
    });
    if (conflitoU) {
      const msg = conflitoU.who === 'pet'
        ? 'Conflito de horário: o pet já possui agendamento nesse intervalo.'
        : 'Conflito de horário: o profissional já possui agendamento nesse intervalo.';
      return res.status(409).json({ error: msg });
    }

    // montar update
    const fields = [];
    const values = [];
    let i = 1;
    const set = (k, v) => { fields.push(`${k} = $${i++}`); values.push(v); };

    const { status, observacoes } = req.body || {};
    set('pet_id', novoPet);
    set('staff_id', novoStaff);
    set('inicio', novoIni.toISOString());
    set('fim', novoFim.toISOString());
    if (status !== undefined) set('status', status);
    if (observacoes !== undefined) set('observacoes', observacoes);
    set('updated_at', new Date());
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE agendamentos SET ${fields.join(', ')} WHERE id=$${i}
       RETURNING id, pet_id, cliente_id, staff_id, inicio, fim, status, observacoes, created_at, updated_at`,
      values
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

/** POST /agendamentos/:id/servicos (substitui itens) */
r.post('/:id/servicos', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });
    const arr = Array.isArray(req.body?.itens) ? req.body.itens : [];

    await client.query('BEGIN');

    const { rowCount } = await client.query('SELECT 1 FROM agendamentos WHERE id=$1', [id]);
    if (!rowCount) throw new Error('agendamento não encontrado');

    await client.query('DELETE FROM agendamento_servicos WHERE agendamento_id=$1', [id]);

    for (const item of arr) {
      const sid = Number(item.servico_id);
      if (!Number.isInteger(sid)) throw new Error('servico_id inválido');
      const qtd = Number(item.quantidade || 1);
      if (!Number.isInteger(qtd) || qtd <= 0) throw new Error('quantidade inválida');

      let preco = item.preco_unitario;
      if (preco === undefined || preco === null) {
        const { rows: s } = await client.query('SELECT preco_padrao FROM servicos WHERE id=$1', [sid]);
        if (!s.length) throw new Error(`servico ${sid} não existe`);
        preco = s[0].preco_padrao;
      }
      const desc = Number(item.desconto || 0);

      await client.query(
        `INSERT INTO agendamento_servicos (agendamento_id, servico_id, quantidade, preco_unitario, desconto)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, sid, qtd, preco, desc]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true, id, itens_count: arr.length });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    next(e);
  } finally {
    client.release();
  }
});

/** DELETE /agendamentos/:id -> status=cancelado */
r.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

    const { rows } = await pool.query(
      `UPDATE agendamentos SET status='cancelado', updated_at=now()
       WHERE id=$1 RETURNING id, status`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'agendamento não encontrado' });
    res.json({ ok: true, agendamento: rows[0] });
  } catch (e) { next(e); }
});

export default r;
