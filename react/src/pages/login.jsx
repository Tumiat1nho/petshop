// react/src/pages/login.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '/src/lib/supabase.js';
import { api } from '/src/lib/api.js';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Se já estiver logado, manda pra home
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate('/', { replace: true });
    })();
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setErr('');
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error('Informe e-mail e senha.');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // dispara /auth/me para o backend criar/regatar app_users (role, display_name)
      try { await api('/auth/me'); } catch {}

      // redireciona (se vier de rota protegida, volta pra ela)
      const from = (location.state && location.state.from) || '/';
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message || 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'100vh', display:'grid', placeItems:'center', background:'#f7f7f7'}}>
      <div style={{width:380, maxWidth:'92vw', background:'#fff', padding:20, borderRadius:12, boxShadow:'0 6px 24px rgba(0,0,0,.08)'}}>
        <h2 style={{margin:'0 0 12px'}}>Entrar</h2>
        <p style={{margin:'0 0 16px', color:'#666', fontSize:14}}>
          Use seu e-mail e senha do sistema.
        </p>

        <form onSubmit={onSubmit} style={{display:'grid', gap:10}}>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'#555'}}>E-mail</span>
            <input
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}
            />
          </label>

          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'#555'}}>Senha</span>
            <div style={{display:'flex', gap:8}}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8, flex:1}}
              />
              <button
                type="button"
                onClick={()=>setShowPass(s=>!s)}
                style={{padding:'0 12px', border:'1px solid #ddd', borderRadius:8, background:'#fafafa'}}
                title={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </label>

          {err && <div style={{color:'crimson', fontSize:13}}>{err}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop:6, padding:'10px 12px', border:'none',
              background: loading ? '#888' : '#2563eb',
              color:'#fff', borderRadius:8, cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div style={{display:'flex', justifyContent:'space-between', marginTop:12, fontSize:14}}>
          <Link to="/forgot">Esqueci minha senha</Link>
          <Link to="/signup">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
