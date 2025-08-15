import express from 'express';
import pool from './db.js';
import clientes from './routes/clientes.js';
import pets from './routes/pets.js';
import agendamentos from './routes/agendamentos.js';
import cors from 'cors';


const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // porta padrão do Vite
app.use(express.json());
app.use(express.json());

// Health
app.get('/health', async (_req, res) => {
  const { rows } = await pool.query('select now()');
  res.json({ ok: true, now: rows[0].now });
});

// Rotas
app.use('/clientes', clientes);
app.use('/pets', pets);
app.use('/agendamentos', agendamentos);

// 404 / erros
app.use((req,res)=>res.status(404).json({error:'rota não encontrada'}));
app.use((err,_req,res,_next)=>{
  console.error(err);
  res.status(500).json({ error: 'erro interno', detail: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
