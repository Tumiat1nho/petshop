import { useEffect, useState } from 'react';
import { supabase } from '/src/lib/supabase.js';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      // 1) casos PKCE (code=...) – tenta trocar code por sessão
      const url = new URL(window.location.href);
      if (url.searchParams.get('code')) {
        try { await supabase.auth.exchangeCodeForSession(url.href); } catch {}
      }
      // 2) espera evento de recuperação ou sessão já válida
      const { data: s } = await supabase.auth.getSession();
      if (s?.session) setReady(true);

      const sub = supabase.auth.onAuthStateChange((event, sess) => {
        if (event === 'PASSWORD_RECOVERY' || sess) setReady(true);
      });
      unsub = () => sub.data.subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  async function onSubmit(e) {
    e.preventDefault(); setErr(''); setOk('');
    if (password.length < 6) return setErr('Senha precisa ter ao menos 6 caracteres.');
    if (password !== confirm) return setErr('As senhas não conferem.');

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setErr(error.message);

    setOk('Senha alterada com sucesso. Você já pode entrar.');
    setTimeout(() => { window.location.href = '/login'; }, 1200);
  }

  if (!ready) return <div style={{maxWidth:420, margin:'60px auto'}}>Validando link…</div>;

  return (
    <div style={{maxWidth:420, margin:'60px auto'}}>
      <h2>Definir nova senha</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:8}}>
        <input type="password" placeholder="Nova senha" value={password} onChange={e=>setPassword(e.target.value)} />
        <input type="password" placeholder="Repita a senha" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        <button>Salvar nova senha</button>
      </form>
      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}
      {ok && <div style={{color:'green', marginTop:8}}>{ok}</div>}
    </div>
  );
}
