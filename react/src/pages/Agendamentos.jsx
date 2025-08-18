import { useEffect, useState } from 'react';
import { api } from '/src/lib/api.js';

export default function Agendamentos(){
  const [clientes, setClientes] = useState([]);
  const [pets, setPets] = useState([]);
  const [lista, setLista] = useState([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    cliente_id: '', pet_id: '', servico: '', data: '', hora: ''
  });

  const asArray = (d) => Array.isArray(d) ? d : (Array.isArray(d?.rows) ? d.rows : []);

  async function loadClientes(){
    try { setErr(''); setClientes(asArray(await api('/clientes'))); }
    catch(e){ setClientes([]); setErr(e.message || 'Erro ao listar clientes'); }
  }
  async function loadLista(){
    try { setErr(''); setLista(asArray(await api('/agendamentos'))); }
    catch(e){ setLista([]); setErr(e.message || 'Erro ao listar agendamentos'); }
  }
  async function loadPetsDoCliente(clienteId){
    try {
      if (!clienteId) return setPets([]);
      setErr(''); setPets(asArray(await api(`/pets?cliente_id=${clienteId}`)));
    } catch(e){ setPets([]); setErr(e.message || 'Erro ao listar pets do cliente'); }
  }

  useEffect(()=>{ loadClientes(); loadLista(); },[]);
  useEffect(()=>{ loadPetsDoCliente(form.cliente_id); }, [form.cliente_id]);

  async function create(e){
    e.preventDefault(); setErr('');
    try {
      if (!form.cliente_id || !form.servico || !form.data || !form.hora)
        throw new Error('Preencha cliente, serviço, data e hora.');

      const dataHora = new Date(`${form.data}T${form.hora}:00`); // local -> ISO
      const payload = {
        cliente_id: Number(form.cliente_id),
        pet_id: form.pet_id ? Number(form.pet_id) : null,
        servico: form.servico.trim(),
        data_hora: dataHora.toISOString()
      };

      await api('/agendamentos', { method:'POST', body: JSON.stringify(payload) });
      setForm({ cliente_id:'', pet_id:'', servico:'', data:'', hora:'' });
      await loadLista();
    } catch (e) {
      setErr(e.message || 'Erro ao agendar');
    }
  }

  async function remove(id){
    if (!confirm('Cancelar este agendamento?')) return;
    try { await api(`/agendamentos/${id}`, { method:'DELETE' }); await loadLista(); }
    catch(e){ alert(e.message || 'Erro ao remover'); }
  }

  return (
    <div style={{padding:20}}>
      <h2>Agendamentos</h2>

      <form onSubmit={create} style={{display:'grid', gap:8, maxWidth:640}}>
        <div style={{display:'flex', gap:8}}>
          <select
            value={form.cliente_id}
            onChange={e=>setForm(f=>({...f, cliente_id:e.target.value, pet_id:''}))}
            style={{flex:1}}
          >
            <option value="">Selecione o cliente</option>
            {(Array.isArray(clientes) ? clientes : []).map(c =>
              <option key={c.id} value={c.id}>{c.nome}</option>
            )}
          </select>

          <select
            value={form.pet_id}
            onChange={e=>setForm(f=>({...f, pet_id:e.target.value}))}
            style={{flex:1}}
            disabled={!form.cliente_id}
          >
            <option value="">{form.cliente_id ? 'Selecione o pet (opcional)' : 'Escolha um cliente primeiro'}</option>
            {(Array.isArray(pets) ? pets : []).map(p =>
              <option key={p.id} value={p.id}>{p.nome}</option>
            )}
          </select>
        </div>

        <input placeholder="Serviço (ex.: Banho e tosa)" value={form.servico} onChange={e=>setForm(f=>({...f, servico:e.target.value}))} />
        <div style={{display:'flex', gap:8}}>
          <input type="date" value={form.data} onChange={e=>setForm(f=>({...f, data:e.target.value}))} />
          <input type="time" value={form.hora} onChange={e=>setForm(f=>({...f, hora:e.target.value}))} />
        </div>
        <button>Agendar</button>
      </form>

      {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}

      <table cellPadding="6" style={{borderCollapse:'collapse', width:'100%', marginTop:16}}>
        <thead>
          <tr>
            <th style={{textAlign:'left'}}>Data/Hora</th>
            <th style={{textAlign:'left'}}>Cliente</th>
            <th style={{textAlign:'left'}}>Pet</th>
            <th style={{textAlign:'left'}}>Serviço</th>
            <th style={{textAlign:'left'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(lista) ? lista : []).map(a => (
            <tr key={a.id} style={{borderTop:'1px solid #ddd'}}>
              <td>{a.data_hora ? new Date(a.data_hora).toLocaleString() : '-'}</td>
              <td>{a.cliente_nome || (a.cliente_id ? `#${a.cliente_id}` : '-')}</td>
              <td>{a.pet_nome || (a.pet_id ? `#${a.pet_id}` : '-')}</td>
              <td>{a.servico || '-'}</td>
              <td><button onClick={()=>remove(a.id)}>Cancelar</button></td>
            </tr>
          ))}
          {(!Array.isArray(lista) || lista.length === 0) && (
            <tr><td colSpan="5" style={{padding:12, color:'#666'}}>Nenhum agendamento.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
