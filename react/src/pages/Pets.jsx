import { useEffect, useState } from 'react';
import { api } from '/src/lib/api.js';

export default function Pets(){
  const [clientes, setClientes] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [pets, setPets] = useState([]);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    nome: '',
    especie_id: '',
    raca: '',
    cliente_id: ''
  });

  // helpers robustos para aceitar array ou {rows:[...]}
  const asArray = (data) =>
    Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : []);

  async function loadClientes(){
    try { setErr(''); setClientes(asArray(await api('/clientes'))); }
    catch(e){ setClientes([]); setErr(e.message || 'Erro ao listar clientes'); }
  }

  async function loadEspecies(){
    try { setErr(''); setEspecies(asArray(await api('/especies'))); }
    catch(e){ setEspecies([]); setErr(e.message || 'Erro ao listar espécies'); }
  }

  async function loadPets(){
    try { setErr(''); setPets(asArray(await api('/pets'))); }
    catch(e){ setPets([]); setErr(e.message || 'Erro ao listar pets'); }
  }

  useEffect(()=>{ loadClientes(); loadEspecies(); loadPets(); },[]);

  async function create(e){
    e.preventDefault(); setErr('');
    try {
      const payload = {
        nome: (form.nome || '').trim(),
        especie_id: Number(form.especie_id),
        raca: (form.raca || '').trim() || null,
        cliente_id: Number(form.cliente_id)
      };
      if (!payload.nome || !payload.cliente_id || !payload.especie_id) {
        throw new Error('Informe nome, cliente e espécie.');
      }
      await api('/pets', { method:'POST', body: JSON.stringify(payload) });
      setForm({ nome:'', especie_id:'', raca:'', cliente_id:'' });
      await loadPets();
    } catch(e){
      setErr(e.message || 'Erro ao criar pet');
    }
  }

  async function remove(id){
    if (!confirm('Remover este pet?')) return;
    try { await api(`/pets/${id}`, { method:'DELETE' }); await loadPets(); }
    catch(e){ alert(e.message || 'Erro ao remover'); }
  }

  return (
    <div style={{padding:20}}>
      <h2>Pets</h2>

      <form onSubmit={create} style={{display:'grid', gap:8, maxWidth:560}}>
        <input
          placeholder="Nome do pet"
          value={form.nome}
          onChange={e=>setForm(f=>({...f, nome:e.target.value}))}
        />

        <div style={{display:'flex', gap:8}}>
          <select
            value={form.especie_id}
            onChange={e=>setForm(f=>({...f, especie_id:e.target.value}))}
            style={{flex:1}}
          >
            <option value="">Selecione a espécie</option>
            {especies.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>

          <input
            placeholder="Raça (opcional)"
            value={form.raca}
            onChange={e=>setForm(f=>({...f, raca:e.target.value}))}
            style={{flex:1}}
          />
        </div>

        <select
          value={form.cliente_id}
          onChange={e=>setForm(f=>({...f, cliente_id:e.target.value}))}
        >
          <option value="">Selecione o cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>

        <button>Adicionar pet</button>
      </form>

      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}

      <table cellPadding="6" style={{borderCollapse:'collapse', width:'100%', marginTop:16}}>
        <thead>
          <tr>
            <th style={{textAlign:'left'}}>ID</th>
            <th style={{textAlign:'left'}}>Nome</th>
            <th style={{textAlign:'left'}}>Espécie</th>
            <th style={{textAlign:'left'}}>Raça</th>
            <th style={{textAlign:'left'}}>Cliente</th>
            <th style={{textAlign:'left'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pets.map(p => (
            <tr key={p.id} style={{borderTop:'1px solid #ddd'}}>
              <td>{p.id}</td>
              <td>{p.nome}</td>
              <td>{p.especie || '-'}</td>
              <td>{p.raca || '-'}</td>
              <td>{p.cliente_nome ? `${p.cliente_nome} (#${p.cliente_id})` : `#${p.cliente_id}`}</td>
              <td><button onClick={()=>remove(p.id)}>Excluir</button></td>
            </tr>
          ))}
          {pets.length === 0 && (
            <tr><td colSpan="6" style={{padding:12, color:'#666'}}>Nenhum pet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
