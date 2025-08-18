// react/src/pages/Servicos.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function Linha({ s, onEdit, onDelete }) {
  return (
    <tr>
      <td>{s.id}</td>
      <td>{s.nome}</td>
      <td>{s.descricao || '-'}</td>
      <td>R$ {s.preco.toFixed(2)}</td>
      <td>{s.ativo}</td>
      <td style={{display:'flex', gap:8}}>
        <button onClick={() => onEdit(s)}>Editar</button>
        <button onClick={() => onDelete(s.id)} style={{color:'crimson'}}>Excluir</button>
      </td>
    </tr>
  );
}

export default function Servicos() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ id:null, nome:'', descricao:'', preco:'', ativo:'ativo' });
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const r = await api('/servicos');
      setLista(Array.isArray(r) ? r : []);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  function onEdit(s) {
    setForm({ id:s.id, nome:s.nome, descricao:s.descricao||'', preco:String(s.preco), ativo:s.ativo });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onDelete(id) {
    if (!confirm('Excluir este serviço?')) return;
    try { await api(`/servicos/${id}`, { method:'DELETE' }); await load(); }
    catch (e) { setErr(e.message); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      preco: Number(form.preco),
      ativo: form.ativo
    };
    try {
      if (form.id) await api(`/servicos/${form.id}`, { method:'PUT', body: JSON.stringify(payload) });
      else await api('/servicos', { method:'POST', body: JSON.stringify(payload) });

      setForm({ id:null, nome:'', descricao:'', preco:'', ativo:'ativo' });
      await load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div style={{maxWidth:900, margin:'20px auto'}}>
      <h2>Serviços</h2>

      <form onSubmit={onSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
        <input placeholder="nome" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} />
        <input placeholder="preço (ex.: 79.9)" value={form.preco} onChange={e=>setForm({...form, preco:e.target.value})} />
        <input style={{gridColumn:'1 / -1'}} placeholder="descrição" value={form.descricao} onChange={e=>setForm({...form, descricao:e.target.value})} />
        <select value={form.ativo} onChange={e=>setForm({...form, ativo:e.target.value})}>
          <option value="ativo">ativo</option>
          <option value="inativo">inativo</option>
        </select>
        <div style={{gridColumn:'1 / -1', display:'flex', gap:8}}>
          <button>{form.id ? 'Salvar alterações' : 'Criar serviço'}</button>
          {form.id && <button type="button" onClick={() => setForm({ id:null, nome:'', descricao:'', preco:'', ativo:'ativo' })}>Cancelar</button>}
        </div>
      </form>

      {err && <div style={{color:'crimson', marginBottom:12}}>{err}</div>}

      <table width="100%" cellPadding="6" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#eee'}}>
            <th>ID</th><th>Nome</th><th>Descrição</th><th>Preço</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 && <tr><td colSpan="6" style={{color:'#666'}}>Nenhum serviço.</td></tr>}
          {lista.map(s => <Linha key={s.id} s={s} onEdit={onEdit} onDelete={onDelete} />)}
        </tbody>
      </table>
    </div>
  );
}
