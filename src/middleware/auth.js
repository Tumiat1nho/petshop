// src/middleware/auth.js
import { createRemoteJWKSet, jwtVerify, decodeProtectedHeader } from 'jose';
import pool from '../db.js';

const REF = process.env.SUPABASE_PROJECT_REF;
const JWKS_URL =
  process.env.SUPABASE_JWKS_URL
  || (process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.replace(/\/$/,'')}/auth/v1/keys` : null)
  || (REF ? `https://${REF}.supabase.co/auth/v1/keys` : null);

const jwks = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL)) : null;
const LEGACY_SECRET = process.env.SUPABASE_JWT_SECRET
  ? new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
  : null;

const OWNER_EMAILS = (process.env.OWNER_EMAILS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// Verifica o token aceitando RS256 (JWKS) ou HS256 (legacy secret)
async function verifySupabaseJWT(token) {
  const { alg } = decodeProtectedHeader(token);
  // HS* -> usa secret
  if (alg?.startsWith('HS')) {
    if (!LEGACY_SECRET) throw new Error('LEGACY secret not configured');
    return jwtVerify(token, LEGACY_SECRET);
  }
  // RS* -> usa JWKS
  if (jwks) return jwtVerify(token, jwks);
  // fallback: se não tem JWKS mas tem secret, tenta secret
  if (LEGACY_SECRET) return jwtVerify(token, LEGACY_SECRET);
  throw new Error('no verifier configured');
}

export default function requireAuth() {
  return async (req, res, next) => {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'missing bearer token' });

      const { payload } = await verifySupabaseJWT(token);

      const userId = payload.sub;
      const email  = (payload.email || payload.user_metadata?.email || '').toLowerCase();
      if (!userId) return res.status(401).json({ error: 'invalid token (no sub)' });

      // upsert no app_users
      let userRow;
      const got = await pool.query(
        'select id, email, role, display_name from app_users where id = $1',
        [userId]
      );
      if (got.rowCount === 0) {
        const role = OWNER_EMAILS.includes(email) ? 'admin' : 'worker';
        const ins = await pool.query(
          `insert into app_users (id, email, display_name, role)
           values ($1,$2,$3,$4)
           returning id, email, role, display_name`,
          [userId, email || null, email || null, role]
        );
        userRow = ins.rows[0];
      } else {
        userRow = got.rows[0];
        if (email && OWNER_EMAILS.includes(email) && userRow.role !== 'admin') {
          const up = await pool.query(
            `update app_users set role = 'admin' where id = $1
             returning id, email, role, display_name`,
            [userId]
          );
          userRow = up.rows[0];
        }
      }

      req.user = {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
        display_name: userRow.display_name,
      };
      next();
    } catch (err) {
      console.error('auth error', err);
      return res.status(401).json({ error: 'invalid or expired token' });
    }
  };
}
