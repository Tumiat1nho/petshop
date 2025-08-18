// react/src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Recupera o token salvo pelo seu fluxo de login.
 * - Se você usa Supabase, normalmente o access_token está em localStorage
 *   em "sb-<project-ref>-auth-token".
 * - Se já tem outra função utilitária, pode trocar por ela.
 */
function getAccessToken() {
  // tente achar qualquer token salvo previamente
  const knownKeys = Object.keys(localStorage).filter((k) =>
    k.includes("-auth-token")
  );
  for (const k of knownKeys) {
    try {
      const raw = localStorage.getItem(k);
      const json = JSON.parse(raw);
      // supabase salva { currentSession: { access_token } } em versões antigas,
      // e { access_token } em versões mais novas. Tentamos ambos:
      const token =
        json?.access_token ||
        json?.currentSession?.access_token ||
        json?.currentSession?.accessToken;
      if (token) return token;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Chamada HTTP genérica
 * api("/pets")            -> GET
 * api("/pets", {method:"POST", body:{...}})
 */
export async function api(path, opts = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    // tenta ler mensagem de erro do servidor
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error || json.message || text;
    } catch {/* noop */}
    throw new Error(message || `HTTP ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}

// também como default pra poder importar "import api from '../lib/api'"
export default api;
