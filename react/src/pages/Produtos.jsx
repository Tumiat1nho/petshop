// react/src/pages/Produtos.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function Linha({ p, onEdit, onDelete }) {
  return (
    <tr>
      <td>{p.id}</td>
      <td>{p.nome}</td>
      <td>{p.descricao || '-'}</td>
      <td>R$ {Number(p.preco).toFixed(2)}</td>
      <td>{p.unidade}</td>
      <td>{p.ativo}</td>
      <td style={{display:'flex', gap:8}}>
        <button onClick={() => onEdit(p)}>Editar</button>
        <button onClick={() => onDelete(p.id)} style={{color:'crimson'}}>Excluir</button>
      </td>
    </tr>
  );
}

export default function Produtos() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ id:null, nome:'', descricao:'', preco:'', unidade:'UN', ativo:'ativo' });
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    try {
      const r = await api('/produtos');
      setLista(Array.isArray(r) ? r : []);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  function onEdit(p) {
    setForm({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao || '',
      preco: String(p.preco),
      unidade: p.unidade,
      ativo: p.ativo
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onDelete(id) {
    if (!confirm('Excluir este produto?')) return;
    try { await api(`/produtos/${id}`, { method:'DELETE' }); await load(); }
    catch (e) { setErr(e.message); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      preco: Number(form.preco),
      unidade: form.unidade,
      ativo: form.ativo
    };
    try {
      if (form.id)
        await api(`/produtos/${form.id}`, { method:'PUT', body: JSON.stringify(payload) });
      else
        await api('/produtos', { method:'POST', body: JSON.stringify(payload) });

      setForm({ id:null, nome:'', descricao:'', preco:'', unidade:'UN', ativo:'ativo' });
      await load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div style={{maxWidth:900, margin:'20px auto'}}>
      <h2>Produtos</h2>

      <form onSubmit={onSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
        <input placeholder="nome" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} />
        <input placeholder="preço (ex.: 189.90)" value={form.preco} onChange={e=>setForm({...form, preco:e.target.value})} />
        <input style={{gridColumn:'1 / -1'}} placeholder="descrição" value={form.descricao} onChange={e=>setForm({...form, descricao:e.target.value})} />
        <select value={form.unidade} onChange={e=>setForm({...form, unidade:e.target.value})}>
          <option value="UN">UN</option>
          <option value="KG">KG</option>
          <option value="L">L</option>
        </select>
        <select value={form.ativo} onChange={e=>setForm({...form, ativo:e.target.value})}>
          <option value="ativo">ativo</option>
          <option value="inativo">inativo</option>
        </select>
        <div style={{gridColumn:'1 / -1', display:'flex', gap:8}}>
          <button>{form.id ? 'Salvar alterações' : 'Criar produto'}</button>
          {form.id && <button type="button" onClick={() => setForm({ id:null, nome:'', descricao:'', preco:'', unidade:'UN', ativo:'ativo' })}>Cancelar</button>}
        </div>
      </form>

      {err && <div style={{color:'crimson', marginBottom:12}}>{err}</div>}

      <table width="100%" cellPadding="6" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#eee'}}>
            <th>ID</th><th>Nome</th><th>Descrição</th><th>Preço</th><th>Unid.</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 && <tr><td colSpan="7" style={{color:'#666'}}>Nenhum produto.</td></tr>}
          {lista.map(p => <Linha key={p.id} p={p} onEdit={onEdit} onDelete={onDelete} />)}
        </tbody>
      </table>
    </div>
  );
}
