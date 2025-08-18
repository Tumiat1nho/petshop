// react/src/pages/Clientes.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function Linha({ c, onEdit, onDelete }) {
  return (
    <tr>
      <td>{c.id}</td>
      <td>{c.nome}</td>
      <td>{c.telefone || '-'}</td>
      <td>{c.email || '-'}</td>
      <td style={{display:'flex', gap:8}}>
        <button onClick={() => onEdit(c)}>Editar</button>
        <button onClick={() => onDelete(c.id)} style={{color:'crimson'}}>Excluir</button>
      </td>
    </tr>
  );
}

export default function Clientes() {
  const [lista, setLista]   = useState([]);
  const [err, setErr]       = useState('');
  const [form, setForm]     = useState({ id:null, nome:'', telefone:'', email:'' });

  async function load() {
    setErr('');
    try {
      const dados = await api('/clientes');
      // garante array, mesmo que venha objeto
      setLista(Array.isArray(dados) ? dados : []);
    } catch (e) {
      setErr(e.message || 'erro ao carregar clientes');
      setLista([]);
    }
  }

  useEffect(() => { load(); }, []);

  function onEdit(c) {
    setForm({
      id: c.id,
      nome: c.nome || '',
      telefone: c.telefone || '',
      email: c.email || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onDelete(id) {
    if (!confirm('Excluir este cliente?')) return;
    setErr('');
    try {
      await api(`/clientes/${id}`, { method:'DELETE' });
      await load();
    } catch (e) { setErr(e.message); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
    };
    try {
      if (!payload.nome) throw new Error('nome é obrigatório');

      if (form.id) {
        await api(`/clientes/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/clientes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setForm({ id:null, nome:'', telefone:'', email:'' });
      await load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div style={{maxWidth:900, margin:'20px auto'}}>
      <h2>Clientes</h2>

      <form onSubmit={onSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
        <input
          placeholder="nome*"
          value={form.nome}
          onChange={e=>setForm({...form, nome:e.target.value})}
        />
        <input
          placeholder="telefone"
          value={form.telefone}
          onChange={e=>setForm({...form, telefone:e.target.value})}
        />
        <input
          placeholder="email"
          value={form.email}
          onChange={e=>setForm({...form, email:e.target.value})}
          style={{gridColumn:'1 / -1'}}
        />
        <div style={{gridColumn:'1 / -1', display:'flex', gap:8}}>
          <button>{form.id ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
          {form.id && (
            <button type="button" onClick={() => setForm({ id:null, nome:'', telefone:'', email:'' })}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {err && <div style={{color:'crimson', marginBottom:12}}>{err}</div>}

      <table width="100%" cellPadding="6" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#eee'}}>
            <th>ID</th>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 && (
            <tr><td colSpan="5" style={{color:'#666'}}>Nenhum cliente cadastrado.</td></tr>
          )}
          {lista.map(c => (
            <Linha key={c.id} c={c} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
