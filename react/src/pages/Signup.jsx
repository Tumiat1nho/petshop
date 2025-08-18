import { useState } from 'react';
import { supabase } from '/src/lib/supabase.js';
import { api } from '/src/lib/api.js';

export default function Signup(){
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [err, setErr]             = useState('');
  const [okMsg, setOkMsg]         = useState('');

  async function onSubmit(e){
    e.preventDefault(); setErr(''); setOkMsg('');

    if (!name.trim()) return setErr('Informe seu nome');
    if (!email.trim()) return setErr('Informe o e-mail');
    if (password.length < 6) return setErr('Senha precisa ter 6+ caracteres');
    if (password !== confirm) return setErr('As senhas não conferem');

    // URL para redirecionar após confirmar o email (se confirmação estiver ativa no Supabase)
    const emailRedirectTo = `${window.location.origin}/login`;

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo }
    });
    if (error) { setErr(error.message); return; }

    // Se confirmação de e-mail estiver DESATIVADA, já teremos sessão
    const session = data.session;
    if (session) {
      try {
        await api('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ display_name: name })
        });
      } catch { /* ignore */ }
      window.location.href = '/';
      return;
    }

    // Se confirmação estiver ATIVADA, não há sessão
    setOkMsg('Cadastro criado! Verifique seu e-mail para confirmar a conta e depois faça login.');
    setName(''); setEmail(''); setPassword(''); setConfirm('');
  }

  return (
    <div style={{maxWidth:420, margin:'60px auto'}}>
      <h2>Criar conta</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:8}}>
        <input placeholder="Seu nome" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Seu e-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
        <input type="password" placeholder="Confirme a senha" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        <button>Criar conta</button>
      </form>
      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}
      {okMsg && <div style={{color:'green', marginTop:8}}>{okMsg}</div>}
      <div style={{marginTop:12}}>
        Já tem conta? <a href="/login">Entrar</a>
      </div>
    </div>
  );
}
