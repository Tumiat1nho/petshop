import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import pool from '../db.js';

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('select id, nome from especies order by nome');
  res.json(rows);
}));

export default router;
