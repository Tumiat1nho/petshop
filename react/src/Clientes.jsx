// react/src/Clientes.jsx
import { useEffect, useState } from 'react';
import { api } from '/src/lib/api.js';

export default function Clientes(){
  const [clientes, setClientes] = useState([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ nome:'', telefone:'', email:'' });

  const asArray = (d) => Array.isArray(d) ? d : (Array.isArray(d?.rows) ? d.rows : []);

  async function loadClientes(){
    try {
      setErr('');
      const data = await api('/clientes');
      setClientes(asArray(data));
    } catch (e) {
      console.error('loadClientes error:', e);
      setClientes([]); // garante array para não quebrar o .map
      setErr(e.message || 'Erro ao listar clientes');
    }
  }

  useEffect(()=>{ loadClientes(); },[]);

  async function create(e){
    e.preventDefault(); setErr('');
    try {
      const payload = {
        nome: (form.nome||'').trim(),
        telefone: (form.telefone||'').trim() || null,
        email: (form.email||'').trim() || null,
      };
      if (!payload.nome) throw new Error('Informe o nome do cliente.');
      await api('/clientes', { method:'POST', body: JSON.stringify(payload) });
      setForm({ nome:'', telefone:'', email:'' });
      await loadClientes();
    } catch (e) {
      setErr(e.message || 'Erro ao criar cliente');
    }
  }

  async function remove(id){
    if (!confirm('Remover este cliente? Isso pode remover pets e agendamentos relacionados.')) return;
    try { await api(`/clientes/${id}`, { method:'DELETE' }); await loadClientes(); }
    catch(e){ alert(e.message || 'Erro ao remover'); }
  }

  return (
    <div style={{padding:20}}>
      <h2>Clientes</h2>

      <form onSubmit={create} style={{display:'grid', gap:8, maxWidth:560}}>
        <input placeholder="Nome" value={form.nome} onChange={e=>setForm(f=>({...f, nome:e.target.value}))} />
        <div style={{display:'flex', gap:8}}>
          <input placeholder="Telefone (opcional)" value={form.telefone} onChange={e=>setForm(f=>({...f, telefone:e.target.value}))} style={{flex:1}} />
          <input placeholder="E-mail (opcional)" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} style={{flex:1}} />
        </div>
        <button>Adicionar cliente</button>
      </form>

      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}

      <table cellPadding="6" style={{borderCollapse:'collapse', width:'100%', marginTop:16}}>
        <thead>
          <tr>
            <th style={{textAlign:'left'}}>ID</th>
            <th style={{textAlign:'left'}}>Nome</th>
            <th style={{textAlign:'left'}}>Telefone</th>
            <th style={{textAlign:'left'}}>E-mail</th>
            <th style={{textAlign:'left'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(clientes) ? clientes : []).map(c => (
            <tr key={c.id} style={{borderTop:'1px solid #ddd'}}>
              <td>{c.id}</td>
              <td>{c.nome}</td>
              <td>{c.telefone || '-'}</td>
              <td>{c.email || '-'}</td>
              <td><button onClick={()=>remove(c.id)}>Excluir</button></td>
            </tr>
          ))}
          {(!Array.isArray(clientes) || clientes.length === 0) && (
            <tr><td colSpan="5" style={{padding:12, color:'#666'}}>Nenhum cliente.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
