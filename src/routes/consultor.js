// src/routes/consultor.js
import { Router } from "express";
import { query } from "../db.js"; // sua função utilitária do pool

const router = Router();

/**
 * GET /consultor/aniversarios
 * Retorna próximos aniversários de pets nos próximos 30 dias,
 * com nome do pet, tutor e dias restantes.
 */
router.get("/aniversarios", async (req, res, next) => {
  try {
    const sql = `
      with base as (
        select
          p.id,
          p.nome as pet_nome,
          c.nome as cliente_nome,
          p.nascimento,
          -- calcula o próximo aniversário (ano corrente ou próximo)
          make_date(
            date_part('year', current_date)::int
              + case when to_char(p.nascimento, 'MMDD') < to_char(current_date, 'MMDD') then 1 else 0 end,
            date_part('month', p.nascimento)::int,
            date_part('day', p.nascimento)::int
          ) as proximo_aniversario
        from public.pets p
        join public.clientes c on c.id = p.cliente_id
        where p.nascimento is not null
      )
      select
        id,
        pet_nome,
        cliente_nome,
        nascimento,
        proximo_aniversario,
        (proximo_aniversario - current_date) as dias
      from base
      where (proximo_aniversario - current_date) between 0 and 30
      order by dias asc, pet_nome asc
      limit 200;
    `;

    const { rows } = await query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
