// src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import clientesRoutes from './routes/clientes.js';
import petsRoutes from './routes/pets.js';
import especiesRoutes from './routes/especies.js';
import agendamentosRoutes from './routes/agendamentos.js';
import servicosRoutes from './routes/servicos.js';
import produtosRoutes from './routes/produtos.js';
import estoqueRoutes from './routes/estoque.js';
import vendasRoutes from './routes/vendas.js';        // <-- NOVO
import consultorRoutes from './routes/consultor.js';

import requireAuth from './middleware/auth.js';

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());


const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5173';
const PORT = Number(process.env.PORT || 3000);

app.use(cors({ origin: FRONT_URL }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'petshop-api', env: process.env.NODE_ENV || 'development', time: new Date().toISOString() });
});
app.get('/__health', (_req, res) => res.status(204).end());

app.get('/auth/me', requireAuth(), (req, res) => res.json(req.user));

app.use('/clientes',     requireAuth(), clientesRoutes);
app.use('/pets',         requireAuth(), petsRoutes);
app.use('/especies',     requireAuth(), especiesRoutes);
app.use('/agendamentos', requireAuth(), agendamentosRoutes);
app.use('/servicos',     requireAuth(), servicosRoutes);
app.use('/produtos',     requireAuth(), produtosRoutes);
app.use('/estoque',      requireAuth(), estoqueRoutes);
app.use('/vendas',       requireAuth(), vendasRoutes);
app.use('/consultor', requireAuth(), consultorRoutes);

app.use((req, res, _next) => res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, _next) => {
  console.error('UNHANDLED ERROR:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: err?.message || 'internal error' });
});


app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(`CORS liberado para: ${FRONT_URL}`);
});

export default app;
