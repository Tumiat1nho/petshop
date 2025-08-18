import { useState } from 'react';
import { supabase } from '/src/lib/supabase.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault(); setErr(''); setMsg('');
    if (!email.trim()) return setErr('Informe seu e-mail');

    const redirectTo = `${window.location.origin}/reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return setErr(error.message);

    setMsg('Enviamos um e-mail com o link para redefinir sua senha.');
  }

  return (
    <div style={{maxWidth:420, margin:'60px auto'}}>
      <h2>Esqueci minha senha</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:8}}>
        <input placeholder="Seu e-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <button>Enviar link</button>
      </form>
      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}
      {msg && <div style={{color:'green', marginTop:8}}>{msg}</div>}
      <div style={{marginTop:12}}>
        <a href="/login">Voltar ao login</a>
      </div>
    </div>
  );
}
