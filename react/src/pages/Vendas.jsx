// react/src/pages/Vendas.jsx
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

function LinhaVenda({ v, onPagar }) {
  return (
    <tr>
      <td>{v.id}</td>
      <td>{v.cliente_nome}</td>
      <td>{v.pet_nome || '-'}</td>
      <td>R$ {Number(v.total).toFixed(2)}</td>
      <td>{v.status}</td>
      <td>{new Date(v.created_at).toLocaleString()}</td>
      <td>
        {v.status === 'aberta' && <button onClick={() => onPagar(v.id)}>Marcar paga</button>}
      </td>
    </tr>
  );
}

export default function Vendas() {
  const [clientes, setClientes] = useState([]);
  const [pets, setPets] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);

  const [form, setForm] = useState({
    cliente_id: '',
    pet_id: '',
    itemTipo: 'servico',
    itemRef: '',
    itemQtd: '1',
    itens: [], // { tipo, ref_id, nome, preco, quantidade }
  });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function loadBases() {
    try {
      const [cs, ps, ss, pr, vs] = await Promise.all([
        api('/clientes'), api('/pets'), api('/servicos'), api('/produtos'), api('/vendas')
      ]);
      setClientes(Array.isArray(cs) ? cs : []);
      setPets(Array.isArray(ps) ? ps : []);
      setServicos(Array.isArray(ss) ? ss : []);
      setProdutos(Array.isArray(pr) ? pr : []);
      setVendas(Array.isArray(vs) ? vs : []);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { loadBases(); }, []);

  const total = useMemo(() => {
    return form.itens.reduce((s, it) => s + Number(it.preco) * Number(it.quantidade), 0);
  }, [form.itens]);

  function addItem() {
    setErr(''); setOk('');
    const tipo = form.itemTipo;
    const ref  = Number(form.itemRef);
    const qtd  = Number(form.itemQtd);
    if (!['servico','produto'].includes(tipo)) return setErr('tipo inválido');
    if (!Number.isInteger(ref)) return setErr('selecione o item');
    if (!Number.isFinite(qtd) || qtd <= 0) return setErr('quantidade inválida');

    const fonte = tipo === 'servico' ? servicos : produtos;
    const found = fonte.find(x => x.id === ref);
    if (!found) return setErr('item não encontrado');

    const novo = {
      tipo,
      ref_id: ref,
      nome: found.nome,
      preco: Number(found.preco),
      quantidade: qtd
    };
    setForm(f => ({ ...f, itens: [...f.itens, novo], itemRef:'', itemQtd:'1' }));
  }

  function removeItem(idx) {
    setForm(f => ({ ...f, itens: f.itens.filter((_,i)=>i!==idx) }));
  }

  async function criarVenda(e) {
    e.preventDefault();
    setErr(''); setOk('');

    const cliente_id = Number(form.cliente_id) || null;
    const pet_id = form.pet_id ? Number(form.pet_id) : null;
    if (!cliente_id) return setErr('cliente é obrigatório');
    if (form.itens.length === 0) return setErr('adicione itens');

    try {
      const payload = {
        cliente_id,
        pet_id,
        itens: form.itens.map(it => ({
          tipo: it.tipo,
          ref_id: it.ref_id,
          quantidade: it.quantidade
        }))
      };
      const venda = await api('/vendas', { method:'POST', body: JSON.stringify(payload) });
      setOk(`Venda #${venda.id} criada! Total R$ ${Number(venda.total).toFixed(2)}`);
      setForm({ cliente_id:'', pet_id:'', itemTipo:'servico', itemRef:'', itemQtd:'1', itens: [] });
      setVendas(v => [venda, ...v]); // prepend
    } catch (e) {
      setErr(e.message);
    }
  }

  async function pagar(id) {
    setErr(''); setOk('');
    try {
      const v = await api(`/vendas/${id}/pagar`, { method:'POST' });
      setOk(`Venda #${v.id} marcada como paga`);
      setVendas(list => list.map(x => x.id === v.id ? { ...x, status: v.status } : x));
    } catch (e) { setErr(e.message); }
  }

  return (
    <div style={{maxWidth:1000, margin:'20px auto'}}>
      <h2>Vendas / Ordem de Serviço</h2>

      <form onSubmit={criarVenda} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
        <select value={form.cliente_id} onChange={e=>setForm({...form, cliente_id:e.target.value})}>
          <option value="">Selecione cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select value={form.pet_id} onChange={e=>setForm({...form, pet_id:e.target.value})}>
          <option value="">(opcional) selecione pet</option>
          {pets.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>

        <div style={{gridColumn:'1 / -1', display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr auto', gap:8, alignItems:'center'}}>
          <select value={form.itemTipo} onChange={e=>setForm({...form, itemTipo:e.target.value})}>
            <option value="servico">Serviço</option>
            <option value="produto">Produto</option>
          </select>

          <select value={form.itemRef} onChange={e=>setForm({...form, itemRef:e.target.value})}>
            <option value="">Selecione item</option>
            {(form.itemTipo === 'servico' ? servicos : produtos).map(i => (
              <option key={i.id} value={i.id}>
                {i.nome} — R$ {Number(i.preco).toFixed(2)}
              </option>
            ))}
          </select>

          <input placeholder="qtd" value={form.itemQtd} onChange={e=>setForm({...form, itemQtd:e.target.value})} />
          <div style={{fontWeight:'bold'}}>Total: R$ {total.toFixed(2)}</div>
          <button type="button" onClick={addItem}>+ adicionar</button>
        </div>

        <div style={{gridColumn:'1 / -1'}}>
          <table width="100%" cellPadding="6" style={{borderCollapse:'collapse', marginTop:8}}>
            <thead>
              <tr style={{background:'#eee'}}>
                <th>Tipo</th><th>Item</th><th>Qtd</th><th>Preço</th><th>Subtotal</th><th></th>
              </tr>
            </thead>
            <tbody>
              {form.itens.length === 0 && <tr><td colSpan="6" style={{color:'#666'}}>Nenhum item.</td></tr>}
              {form.itens.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.tipo}</td>
                  <td>{it.nome}</td>
                  <td>{it.quantidade}</td>
                  <td>R$ {Number(it.preco).toFixed(2)}</td>
                  <td>R$ {(Number(it.preco) * Number(it.quantidade)).toFixed(2)}</td>
                  <td><button type="button" onClick={() => removeItem(idx)} style={{color:'crimson'}}>remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{gridColumn:'1 / -1', display:'flex', gap:10, alignItems:'center'}}>
          <button>Criar venda</button>
          <div style={{marginLeft:8, fontSize:18}}>TOTAL: <b>R$ {total.toFixed(2)}</b></div>
        </div>
      </form>

      {err && <div style={{color:'crimson', marginBottom:12}}>{err}</div>}
      {ok  && <div style={{color:'green', marginBottom:12}}>{ok}</div>}

      <h3>Últimas vendas</h3>
      <table width="100%" cellPadding="6" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#eee'}}>
            <th>ID</th><th>Cliente</th><th>Pet</th><th>Total</th><th>Status</th><th>Quando</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vendas.length === 0 && <tr><td colSpan="7" style={{color:'#666'}}>Sem vendas.</td></tr>}
          {vendas.map(v => <LinhaVenda key={v.id} v={v} onPagar={pagar} />)}
        </tbody>
      </table>
    </div>
  );
}
