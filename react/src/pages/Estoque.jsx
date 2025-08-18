// react/src/pages/Estoque.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [movs, setMovs] = useState([]);
  const [form, setForm] = useState({ produto_id:'', tipo:'entrada', quantidade:'', obs:'' });
  const [saldo, setSaldo] = useState(null);
  const [err, setErr] = useState('');

  async function loadProdutos() {
    try { setProdutos(await api('/produtos')); }
    catch (e) { setErr(e.message); }
  }
  async function loadMovs() {
    try { setMovs(await api('/estoque/movimentos')); }
    catch (e) { setErr(e.message); }
  }

  useEffect(() => { loadProdutos(); loadMovs(); }, []);

  async function fetchSaldo(id) {
    if (!id) return setSaldo(null);
    try {
      const r = await api(`/estoque/saldo/${id}`);
      setSaldo(r.saldo);
    } catch { setSaldo(null); }
  }

  useEffect(() => { fetchSaldo(form.produto_id); }, [form.produto_id]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const payload = {
        produto_id: Number(form.produto_id),
        tipo: form.tipo,
        quantidade: Number(form.quantidade),
        obs: form.obs.trim() || null
      };
      await api('/estoque/movimentos', { method:'POST', body: JSON.stringify(payload) });
      setForm({ produto_id:'', tipo:'entrada', quantidade:'', obs:'' });
      await loadMovs();
      await fetchSaldo(payload.produto_id);
    } catch (e) { setErr(e.message); }
  }

  return (
    <div style={{maxWidth:900, margin:'20px auto'}}>
      <h2>Estoque</h2>

      <form onSubmit={onSubmit} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8, marginBottom:16}}>
        <select value={form.produto_id} onChange={e=>setForm({...form, produto_id:e.target.value})}>
          <option value="">Selecione um produto</option>
          {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
          <option value="entrada">entrada</option>
          <option value="saida">saída</option>
        </select>
        <input placeholder="quantidade" value={form.quantidade} onChange={e=>setForm({...form, quantidade:e.target.value})} />
        <input style={{gridColumn:'1 / -1'}} placeholder="observação" value={form.obs} onChange={e=>setForm({...form, obs:e.target.value})} />
        <div style={{gridColumn:'1 / -1', display:'flex', gap:8}}>
          <button>Lançar</button>
          {saldo !== null && <div style={{marginLeft:12}}>Saldo atual: <b>{saldo}</b></div>}
        </div>
      </form>

      {err && <div style={{color:'crimson', marginBottom:12}}>{err}</div>}

      <h3>Últimos lançamentos</h3>
      <table width="100%" cellPadding="6" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#eee'}}>
            <th>ID</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Obs</th><th>Quando</th>
          </tr>
        </thead>
        <tbody>
          {movs.length === 0 && <tr><td colSpan="6" style={{color:'#666'}}>Sem movimentações.</td></tr>}
          {movs.map(m => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.produto_nome}</td>
              <td>{m.tipo}</td>
              <td>{m.quantidade}</td>
              <td>{m.obs || '-'}</td>
              <td>{new Date(m.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
