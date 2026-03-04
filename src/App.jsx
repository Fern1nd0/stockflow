import { useState, useEffect, useCallback } from "react";
import * as api from "./api.js";

// ─── Fonts ───────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

// ─── CSS ─────────────────────────────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f; --panel: #13131c; --panel2: #1a1a28; --border: #2a2a40;
    --accent: #7c6af7; --accent2: #f76a8a; --green: #4ade80; --red: #f87171;
    --yellow: #fbbf24; --text: #e8e8f0; --muted: #6b6b8a;
    --font-head: 'Syne', sans-serif; --font-mono: 'DM Mono', monospace; --font-body: 'Outfit', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  input, select, textarea {
    background: var(--panel2); border: 1px solid var(--border); color: var(--text);
    font-family: var(--font-body); border-radius: 8px; padding: 9px 13px;
    font-size: 14px; outline: none; width: 100%; transition: border-color .2s;
  }
  input:focus, select:focus { border-color: var(--accent); }
  button { cursor: pointer; font-family: var(--font-body); border: none; outline: none; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--panel); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
  .badge-low { background: rgba(248,113,113,.15); color: var(--red); border: 1px solid rgba(248,113,113,.3); }
  .badge-ok  { background: rgba(74,222,128,.15); color: var(--green); border: 1px solid rgba(74,222,128,.3); }
  .badge-warn { background: rgba(251,191,36,.15); color: var(--yellow); border: 1px solid rgba(251,191,36,.3); }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .fade-in { animation: fadeIn .25s ease forwards; }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
  .pulse { animation: pulse 2s infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; display: inline-block; }
`;
document.head.appendChild(style);

// ─── Subcomponents ────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: "linear-gradient(135deg, var(--panel) 0%, var(--panel2) 100%)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "16px 16px 0 0" }} />
      <span style={{ fontSize: 22, marginBottom: 2 }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500, color: accent }}>{value}</span>
      <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</span>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "var(--panel2)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, color = "var(--accent)", full, sm, outline, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: outline ? "transparent" : color, color: outline ? color : "#fff", border: outline ? `1px solid ${color}` : "none", borderRadius: 10, padding: sm ? "7px 14px" : "10px 20px", fontWeight: 600, fontSize: sm ? 13 : 14, width: full ? "100%" : "auto", transition: "opacity .15s, transform .1s", opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = ".85")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = "1")}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={e => !disabled && (e.currentTarget.style.transform = "scale(1)")}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</label>
      {children}
    </div>
  );
}

function Spinner() {
  return <span className="spin" style={{ fontSize: 20 }}>⟳</span>;
}

// ─── ESTOQUE ──────────────────────────────────────────────────────────────────
function Estoque({ products, setProducts, setCash, loading }) {
  const [modal, setModal] = useState(null);
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", category: "", qty: "", minQty: "", price: "", cost: "" });
  const [mov, setMov] = useState({ type: "entrada", qty: "", desc: "" });
  const [sortBy, setSortBy] = useState("name");
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ name: "", category: "", qty: "", minQty: "", price: "", cost: "" }); setModal("add"); };
  const openEdit = (p) => { setSel(p); setForm({ ...p, qty: String(p.qty), minQty: String(p.minQty), price: String(p.price), cost: String(p.cost) }); setModal("edit"); };
  const openMov = (p) => { setSel(p); setMov({ type: "entrada", qty: "", desc: "" }); setModal("mov"); };

  const saveProduct = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const p = { ...form, qty: +form.qty || 0, minQty: +form.minQty || 0, price: +form.price, cost: +form.cost || 0 };
    if (modal === "add") {
      const created = await api.addProduct({ ...p, id: uid() });
      setProducts(ps => [...ps, created]);
    } else {
      const updated = await api.updateProduct({ ...sel, ...p });
      setProducts(ps => ps.map(x => x.id === sel.id ? updated : x));
    }
    setSaving(false);
    setModal(null);
  };

  const deleteProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts(ps => ps.filter(x => x.id !== id));
  };

  const saveMov = async () => {
    if (!mov.qty || +mov.qty <= 0) return;
    setSaving(true);
    const q = +mov.qty;
    const newQty = mov.type === "entrada" ? sel.qty + q : Math.max(0, sel.qty - q);
    const updated = await api.updateProduct({ ...sel, qty: newQty });
    setProducts(ps => ps.map(p => p.id === sel.id ? updated : p));
    if (mov.type === "saida") {
      const entry = { id: uid(), type: "entrada", desc: `Venda: ${sel.name} (${q}x)`, value: sel.price * q, date: today(), tag: "Vendas" };
      const created = await api.addCashEntry(entry);
      setCash(cs => [...cs, created]);
    }
    setSaving(false);
    setModal(null);
  };

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "qty" ? a.qty - b.qty : sortBy === "price" ? b.price - a.price : a.name.localeCompare(b.name));

  const stockValue = products.reduce((s, p) => s + p.qty * p.cost, 0);
  const lowStock = products.filter(p => p.qty <= p.minQty).length;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <KpiCard label="Itens em Estoque" value={loading ? "…" : products.reduce((s,p)=>s+p.qty,0)} icon="📦" accent="var(--accent)" sub={`${products.length} produtos`} />
        <KpiCard label="Valor em Estoque" value={loading ? "…" : fmt(stockValue)} icon="💰" accent="var(--green)" />
        <KpiCard label="Estoque Baixo" value={loading ? "…" : lowStock} icon="⚠️" accent={lowStock > 0 ? "var(--red)" : "var(--green)"} sub="abaixo do mínimo" />
        <KpiCard label="Margem Média" value={loading ? "…" : (() => { const avg = products.reduce((s,p)=>s+((p.price-p.cost)/p.price*100),0)/(products.length||1); return avg.toFixed(1)+"%"; })()} icon="📈" accent="var(--accent2)" />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍  Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="name">Ordenar: Nome</option>
          <option value="qty">Ordenar: Quantidade</option>
          <option value="price">Ordenar: Preço</option>
        </select>
        <div style={{ flex: 1 }} />
        <Btn onClick={openAdd} color="var(--accent)">＋ Novo Produto</Btn>
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}><Spinner /> Carregando...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Produto","Categoria","Qtd","Mín","Custo","Preço","Margem","Status","Ações"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
                  const isLow = p.qty <= p.minQty;
                  const isWarn = p.qty <= p.minQty * 1.5 && !isLow;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: i%2===0?"transparent":"rgba(255,255,255,.02)", transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(124,106,247,.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = i%2===0?"transparent":"rgba(255,255,255,.02)"}>
                      <td style={{ padding: "13px 16px", fontWeight: 600, fontSize: 14 }}>{p.name}</td>
                      <td style={{ padding: "13px 16px" }}><span style={{ background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 9px", fontSize: 12 }}>{p.category||"—"}</span></td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontWeight: 500, color: isLow?"var(--red)":isWarn?"var(--yellow)":"var(--text)" }}>{p.qty}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{p.minQty}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)" }}>{fmt(p.cost)}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--green)" }}>{fmt(p.price)}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)" }}>{margin}%</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span className={isLow?"badge-low":isWarn?"badge-warn":"badge-ok"} style={{ borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600 }}>
                          {isLow?"⚠ Baixo":isWarn?"↓ Atenção":"✓ OK"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn sm onClick={() => openMov(p)} color="var(--green)">↕ Mov.</Btn>
                          <Btn sm outline onClick={() => openEdit(p)} color="var(--accent)">✏</Btn>
                          <Btn sm outline onClick={() => deleteProduct(p.id)} color="var(--red)">✕</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Nenhum produto encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal==="add"||modal==="edit") && (
        <Modal title={modal==="add"?"Novo Produto":"Editar Produto"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Nome do Produto"><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Camiseta Básica" /></Field>
            </div>
            <Field label="Categoria"><input value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} placeholder="Ex: Roupas" /></Field>
            <Field label="Qtd. Atual"><input type="number" value={form.qty} onChange={e => setForm(f=>({...f,qty:e.target.value}))} placeholder="0" /></Field>
            <Field label="Qtd. Mínima"><input type="number" value={form.minQty} onChange={e => setForm(f=>({...f,minQty:e.target.value}))} placeholder="0" /></Field>
            <Field label="Preço de Custo (R$)"><input type="number" value={form.cost} onChange={e => setForm(f=>({...f,cost:e.target.value}))} placeholder="0,00" /></Field>
            <Field label="Preço de Venda (R$)"><input type="number" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} placeholder="0,00" /></Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn full onClick={saveProduct} color="var(--accent)" disabled={saving}>{saving ? "Salvando…" : "Salvar Produto"}</Btn>
            <Btn full outline onClick={() => setModal(null)} color="var(--muted)">Cancelar</Btn>
          </div>
        </Modal>
      )}

      {modal==="mov" && sel && (
        <Modal title={`Movimentação — ${sel.name}`} onClose={() => setModal(null)}>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
            Estoque atual: <strong style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>{sel.qty} unidades</strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Tipo de Movimentação">
              <select value={mov.type} onChange={e => setMov(m=>({...m,type:e.target.value}))}>
                <option value="entrada">📥 Entrada (Compra / Reposição)</option>
                <option value="saida">📤 Saída (Venda / Uso)</option>
              </select>
            </Field>
            <Field label="Quantidade"><input type="number" value={mov.qty} onChange={e => setMov(m=>({...m,qty:e.target.value}))} placeholder="0" /></Field>
            <Field label="Observação (opcional)"><input value={mov.desc} onChange={e => setMov(m=>({...m,desc:e.target.value}))} placeholder="Ex: compra de fornecedor" /></Field>
          </div>
          {mov.type==="saida" && mov.qty>0 && (
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--green)", background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 8, padding: "8px 12px" }}>
              💵 Venda registrada automaticamente no caixa: <strong>{fmt(sel.price * +mov.qty)}</strong>
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn full onClick={saveMov} color={mov.type==="entrada"?"var(--green)":"var(--accent2)"} disabled={saving}>
              {saving ? "Salvando…" : mov.type==="entrada" ? "↓ Registrar Entrada" : "↑ Registrar Saída"}
            </Btn>
            <Btn full outline onClick={() => setModal(null)} color="var(--muted)">Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CAIXA ────────────────────────────────────────────────────────────────────
function Caixa({ cash, setCash, loading }) {
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ type: "entrada", desc: "", value: "", date: today(), tag: "" });
  const [saving, setSaving] = useState(false);

  const total = cash.reduce((s, c) => c.type==="entrada" ? s+c.value : s-c.value, 0);
  const entradas = cash.filter(c=>c.type==="entrada").reduce((s,c)=>s+c.value,0);
  const saidas = cash.filter(c=>c.type==="saida").reduce((s,c)=>s+c.value,0);

  const save = async () => {
    if (!form.desc || !form.value) return;
    setSaving(true);
    const created = await api.addCashEntry({ ...form, id: uid(), value: +form.value });
    setCash(cs => [created, ...cs]);
    setSaving(false);
    setModal(false);
  };

  const del = async (id) => {
    await api.deleteCashEntry(id);
    setCash(cs => cs.filter(c => c.id !== id));
  };

  const filtered = cash
    .filter(c => filter==="todos" || c.type===filter)
    .filter(c => c.desc.toLowerCase().includes(search.toLowerCase()) || (c.tag||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => new Date(b.date)-new Date(a.date));

  const TAGS = [...new Set(cash.map(c=>c.tag).filter(Boolean))];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <KpiCard label="Saldo Atual" value={loading?"…":fmt(total)} icon="🏦" accent={total>=0?"var(--green)":"var(--red)"} />
        <KpiCard label="Total Entradas" value={loading?"…":fmt(entradas)} icon="📥" accent="var(--green)" sub={`${cash.filter(c=>c.type==="entrada").length} lançamentos`} />
        <KpiCard label="Total Saídas" value={loading?"…":fmt(saidas)} icon="📤" accent="var(--red)" sub={`${cash.filter(c=>c.type==="saida").length} lançamentos`} />
        <KpiCard label="Resultado" value={loading?"…":(()=>{const r=entradas>0?((entradas-saidas)/entradas*100).toFixed(1):"0.0";return r+"%";})()}  icon="📊" accent="var(--accent)" sub="margem líquida" />
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "var(--muted)" }}>
          <span>Entradas <strong style={{ color: "var(--green)" }}>{fmt(entradas)}</strong></span>
          <span>Saídas <strong style={{ color: "var(--red)" }}>{fmt(saidas)}</strong></span>
        </div>
        <div style={{ height: 10, background: "var(--panel2)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: entradas>0?`${Math.min(100,(entradas-saidas)/entradas*100)}%`:"0%", background: "linear-gradient(90deg, var(--green), var(--accent))", borderRadius: 10, transition: "width .5s" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder="🔍  Buscar lançamento..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth: 260 }} />
        {["todos","entrada","saida"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter===f?(f==="saida"?"var(--red)":f==="entrada"?"var(--green)":"var(--accent)"):"var(--panel2)", color: filter===f?"#fff":"var(--muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, transition: "all .15s" }}>
            {f==="todos"?"Todos":f==="entrada"?"📥 Entradas":"📤 Saídas"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn onClick={() => { setForm({ type:"entrada", desc:"", value:"", date:today(), tag:"" }); setModal(true); }} color="var(--accent)">＋ Novo Lançamento</Btn>
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}><Spinner /> Carregando...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Data","Descrição","Tag","Tipo","Valor",""].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", background: i%2===0?"transparent":"rgba(255,255,255,.02)", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,106,247,.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = i%2===0?"transparent":"rgba(255,255,255,.02)"}>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)" }}>{fmtDate(c.date)}</td>
                    <td style={{ padding: "13px 16px", fontWeight: 500 }}>{c.desc}</td>
                    <td style={{ padding: "13px 16px" }}>{c.tag && <span style={{ background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>{c.tag}</span>}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600, ...(c.type==="entrada"?{background:"rgba(74,222,128,.12)",color:"var(--green)",border:"1px solid rgba(74,222,128,.25)"}:{background:"rgba(248,113,113,.12)",color:"var(--red)",border:"1px solid rgba(248,113,113,.25)"}) }}>
                        {c.type==="entrada"?"📥 Entrada":"📤 Saída"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontWeight: 600, color: c.type==="entrada"?"var(--green)":"var(--red)" }}>
                      {c.type==="entrada"?"+":"-"}{fmt(c.value)}
                    </td>
                    <td style={{ padding: "13px 16px" }}><Btn sm outline onClick={() => del(c.id)} color="var(--red)">✕</Btn></td>
                  </tr>
                ))}
                {filtered.length===0 && (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Nenhum lançamento encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title="Novo Lançamento" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Tipo">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["entrada","saida"].map(t => (
                  <button key={t} onClick={() => setForm(f=>({...f,type:t}))} style={{ padding: "10px", borderRadius: 10, fontWeight: 600, fontSize: 14, border: `2px solid ${form.type===t?(t==="entrada"?"var(--green)":"var(--red)"):"var(--border)"}`, background: form.type===t?(t==="entrada"?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)"):"var(--panel2)", color: form.type===t?(t==="entrada"?"var(--green)":"var(--red)"):"var(--muted)", transition: "all .15s" }}>
                    {t==="entrada"?"📥 Entrada":"📤 Saída"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Descrição"><input value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Ex: Venda de produtos" /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Valor (R$)"><input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder="0,00" /></Field>
              <Field label="Data"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></Field>
            </div>
            <Field label="Tag / Categoria">
              <input list="tags" value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))} placeholder="Ex: Vendas, Fixo, Estoque..." />
              <datalist id="tags">{TAGS.map(t=><option key={t} value={t}/>)}</datalist>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn full onClick={save} color={form.type==="entrada"?"var(--green)":"var(--red)"} disabled={saving}>{saving?"Registrando…":"Registrar"}</Btn>
            <Btn full outline onClick={() => setModal(false)} color="var(--muted)">Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ products, cash, loading }) {
  const total = cash.reduce((s,c)=>c.type==="entrada"?s+c.value:s-c.value,0);
  const entradas = cash.filter(c=>c.type==="entrada").reduce((s,c)=>s+c.value,0);
  const saidas = cash.filter(c=>c.type==="saida").reduce((s,c)=>s+c.value,0);
  const stockVal = products.reduce((s,p)=>s+p.qty*p.cost,0);
  const lowStock = products.filter(p=>p.qty<=p.minQty);
  const tags = {};
  cash.filter(c=>c.type==="saida").forEach(c => { tags[c.tag||"Outros"]=(tags[c.tag||"Outros"]||0)+c.value; });
  const topProds = [...products].sort((a,b)=>(b.qty*b.price)-(a.qty*a.price)).slice(0,5);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <KpiCard label="Saldo em Caixa" value={loading?"…":fmt(total)} icon="💳" accent={total>=0?"var(--green)":"var(--red)"} />
        <KpiCard label="Valor em Estoque" value={loading?"…":fmt(stockVal)} icon="📦" accent="var(--accent)" sub={`${products.length} produtos`} />
        <KpiCard label="Receita Total" value={loading?"…":fmt(entradas)} icon="📈" accent="var(--green)" />
        <KpiCard label="Despesas Total" value={loading?"…":fmt(saidas)} icon="📉" accent="var(--red)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span className={lowStock.length>0?"pulse":""}>⚠️</span> Estoque em Alerta
          </h3>
          {loading ? <div style={{ color: "var(--muted)" }}><Spinner /> Carregando...</div> :
           lowStock.length===0 ? <p style={{ color: "var(--muted)", fontSize: 14 }}>✅ Todos os produtos estão OK!</p> :
           <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
             {lowStock.map(p => (
               <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 10, padding: "10px 14px" }}>
                 <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                 <span style={{ fontFamily: "var(--font-mono)", color: "var(--red)", fontSize: 13 }}>{p.qty} / {p.minQty} mín</span>
               </div>
             ))}
           </div>
          }
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16 }}>🏆 Top Produtos (Valor)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topProds.map((p,i) => {
              const pct = topProds[0]?.qty*topProds[0]?.price>0?(p.qty*p.price)/(topProds[0].qty*topProds[0].price)*100:0;
              return (
                <div key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{i+1}. {p.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{fmt(p.qty*p.price)}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--panel2)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 4, transition: "width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16 }}>📊 Despesas por Categoria</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(tags).sort((a,b)=>b[1]-a[1]).map(([tag,val]) => {
              const pct = saidas>0?val/saidas*100:0;
              const colors = ["var(--accent)","var(--accent2)","var(--yellow)","var(--green)","var(--muted)"];
              const ci = Object.keys(tags).indexOf(tag)%colors.length;
              return (
                <div key={tag}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{tag}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: colors[ci] }}>{fmt(val)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 4, background: "var(--panel2)", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: colors[ci], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(tags).length===0 && <p style={{ color: "var(--muted)", fontSize: 14 }}>Nenhuma saída registrada</p>}
          </div>
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16 }}>🕐 Últimos Lançamentos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cash.slice(0,6).map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{c.desc}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDate(c.date)}</p>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: c.type==="entrada"?"var(--green)":"var(--red)" }}>
                  {c.type==="entrada"?"+":"-"}{fmt(c.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [cash, setCash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Carrega dados do servidor ao iniciar
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [prods, cashData] = await Promise.all([api.getProducts(), api.getCash()]);
      setProducts(prods);
      setCash(cashData);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh a cada 10 segundos para sincronizar entre dispositivos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [prods, cashData] = await Promise.all([api.getProducts(), api.getCash()]);
        setProducts(prods);
        setCash(cashData);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "⬛" },
    { id: "estoque", label: "Estoque", icon: "📦" },
    { id: "caixa", label: "Caixa", icon: "💰" },
  ];

  const lowCount = products.filter(p => p.qty <= p.minQty).length;
  const saldo = cash.reduce((s,c)=>c.type==="entrada"?s+c.value:s-c.value, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--panel)", borderBottom: "1px solid var(--border)", padding: "0 28px", display: "flex", alignItems: "center", gap: 20, position: "sticky", top: 0, zIndex: 100, height: 62 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, var(--accent), var(--accent2))", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px rgba(124,106,247,.4)" }}>📊</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, lineHeight: 1 }}>StockFlow</h1>
            <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>Gestão de Estoque & Caixa</p>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4, marginLeft: 28 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab===t.id?"rgba(124,106,247,.15)":"transparent", color: tab===t.id?"var(--accent)":"var(--muted)", border: tab===t.id?"1px solid rgba(124,106,247,.3)":"1px solid transparent", borderRadius: 9, padding: "7px 16px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6, transition: "all .15s", position: "relative" }}>
              {t.icon} {t.label}
              {t.id==="estoque" && lowCount>0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "var(--red)", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{lowCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Indicador de sync */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: error?"var(--red)":"var(--green)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: error?"var(--red)":"var(--green)", display: "inline-block", boxShadow: error?"0 0 6px var(--red)":"0 0 6px var(--green)" }} />
            {error ? "Sem conexão" : "Sincronizado"}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>Saldo</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: saldo>=0?"var(--green)":"var(--red)" }}>{fmt(saldo)}</p>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: "rgba(248,113,113,.1)", borderBottom: "1px solid rgba(248,113,113,.3)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--red)" }}>⚠️ Não foi possível conectar ao servidor. Verifique se o JSON Server está rodando.</span>
          <Btn sm onClick={loadData} color="var(--red)">Tentar novamente</Btn>
        </div>
      )}

      <main style={{ flex: 1, padding: "28px 28px", maxWidth: 1200, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
        {tab==="dashboard" && <Dashboard products={products} cash={cash} loading={loading} />}
        {tab==="estoque" && <Estoque products={products} setProducts={setProducts} setCash={setCash} loading={loading} />}
        {tab==="caixa" && <Caixa cash={cash} setCash={setCash} loading={loading} />}
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>StockFlow © 2025 — Controle de Estoque & Caixa</span>
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{products.length} produtos · {cash.length} lançamentos</span>
      </footer>
    </div>
  );
}