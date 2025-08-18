import { useEffect, useState } from 'react';
import { api } from '/src/lib/api.js';

export default function AdminUsers(){
  const [rows,setRows]   = useState([]);
  const [err,setErr]     = useState('');
  const [q,setQ]         = useState('');
  const [saving, setSaving] = useState(new Set());

  async function load(search=''){
    try {
      setErr('');
      const data = await api(`/admin/usuarios${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      setRows(data);
    } catch(e) {
      setErr(e.message || 'Erro ao carregar');
    }
  }

  useEffect(()=>{ load(); },[]);

  async function changeRole(id, role){
    const s = new Set(saving); s.add(id); setSaving(s);
    try {
      const updated = await api(`/admin/usuarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
      setRows(list => list.map(r => r.id === id ? updated : r));
    } catch(e) {
      alert(e.message || 'Falha ao atualizar papel');
    } finally {
      const s2 = new Set(saving); s2.delete(id); setSaving(s2);
    }
  }

  return (
    <div style={{padding:20}}>
      <h2>Usuários (Admin)</h2>

      <div style={{display:'flex', gap:8, margin:'12px 0'}}>
        <input
          placeholder="buscar por nome/email"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={{minWidth:260}}
        />
        <button onClick={()=>load(q)}>Buscar</button>
        <button onClick={()=>{ setQ(''); load(''); }}>Limpar</button>
      </div>

      {err && <div style={{color:'crimson', marginBottom:12}}>{err}</div>}

      {rows.length === 0 ? (
        <p>Nenhum usuário.</p>
      ) : (
        <table cellPadding="6" style={{borderCollapse:'collapse', width:'100%'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left'}}>ID</th>
              <th style={{textAlign:'left'}}>Nome</th>
              <th style={{textAlign:'left'}}>Papel</th>
              <th style={{textAlign:'left'}}>Criado em</th>
              <th style={{textAlign:'left'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{borderTop:'1px solid #ddd'}}>
                <td style={{fontFamily:'monospace'}}>{r.id}</td>
                <td>{r.display_name || '-'}</td>
                <td>
                  <select
                    value={r.role}
                    onChange={e=>changeRole(r.id, e.target.value)}
                    disabled={saving.has(r.id)}
                  >
                    <option value="worker">worker</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{saving.has(r.id) ? 'Salvando…' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
