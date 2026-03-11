import { useState, useEffect, useCallback } from "react";
import * as api from "./api.js";

const fmt = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const SENHA = "439222";
const AUTH_KEY = "sf_auth";

function Login({ onLogin }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [shake, setShake] = useState(false);

  const tentar = () => {
    if (senha === SENHA) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onLogin();
    } else {
      setErro(true);
      setShake(true);
      setSenha("");
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") tentar(); };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, animation: shake ? "shake .4s ease" : "fadeIn .3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#7c6af7,#f76a8a)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>📊</div>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: "#e8e8f0" }}>StockFlow</h1>
          <p style={{ fontSize: 14, color: "#6b6b8a", marginTop: 6 }}>Gestão de Estoque & Caixa</p>
        </div>
        <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 20, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Senha de acesso</p>
          <input
            type="password"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro(false); }}
            onKeyDown={handleKey}
            placeholder="••••••"
            autoFocus
            style={{ background: "#1a1a28", border: erro ? "1px solid #f87171" : "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 10, padding: "12px 16px", fontSize: 20, outline: "none", width: "100%", fontFamily: "var(--font-mono)", letterSpacing: 6, marginBottom: 8, textAlign: "center" }}
          />
          {erro && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, textAlign: "center" }}>Senha incorreta. Tente novamente.</p>}
          <button onClick={tentar} style={{ width: "100%", background: "linear-gradient(135deg,#7c6af7,#f76a8a)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8, fontFamily: "var(--font-body)" }}>
            Entrar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-8px)}
          80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
}


function KpiCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#13131c,#1a1a28)", border: "1px solid #2a2a40", borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "16px 16px 0 0" }} />
      <span style={{ fontSize: 22, marginBottom: 2 }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500, color: accent }}>{value}</span>
      <span style={{ fontSize: 13, color: "#6b6b8a", fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ fontSize: 12, color: "#6b6b8a" }}>{sub}</span>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700, color: "#e8e8f0" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#1a1a28", color: "#6b6b8a", border: "1px solid #2a2a40", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, color = "#7c6af7", full, sm, outline, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: outline ? "transparent" : color, color: outline ? color : "#fff", border: outline ? `1px solid ${color}` : "none", borderRadius: 10, padding: sm ? "7px 14px" : "10px 20px", fontWeight: 600, fontSize: sm ? 13 : 14, width: full ? "100%" : "auto", cursor: "pointer", opacity: disabled ? 0.5 : 1, fontFamily: "var(--font-body)" }}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</label>
      {children}
    </div>
  );
}

function Spinner() {
  return <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 20 }}>⟳</span>;
}

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <KpiCard label="Itens em Estoque" value={loading ? "…" : products.reduce((s, p) => s + p.qty, 0)} icon="📦" accent="#7c6af7" sub={`${products.length} produtos`} />
        <KpiCard label="Valor em Estoque" value={loading ? "…" : fmt(stockValue)} icon="💰" accent="#4ade80" />
        <KpiCard label="Estoque Baixo" value={loading ? "…" : lowStock} icon="⚠️" accent={lowStock > 0 ? "#f87171" : "#4ade80"} sub="abaixo do mínimo" />
        <KpiCard label="Margem Média" value={loading ? "…" : (() => { const avg = products.reduce((s, p) => s + ((p.price - p.cost) / p.price * 100), 0) / (products.length || 1); return avg.toFixed(1) + "%"; })()} icon="📈" accent="#f76a8a" />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍  Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280, background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", fontFamily: "var(--font-body)" }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ maxWidth: 160, background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", fontFamily: "var(--font-body)" }}>
          <option value="name">Ordenar: Nome</option>
          <option value="qty">Ordenar: Quantidade</option>
          <option value="price">Ordenar: Preço</option>
        </select>
        <div style={{ flex: 1 }} />
        <Btn onClick={openAdd} color="#7c6af7">＋ Novo Produto</Btn>
      </div>

      <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#6b6b8a" }}><Spinner /> Carregando...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a40" }}>
                  {["Produto", "Categoria", "Qtd", "Mín", "Custo", "Preço", "Margem", "Status", "Ações"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
                  const isLow = p.qty <= p.minQty;
                  const isWarn = p.qty <= p.minQty * 1.5 && !isLow;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #2a2a40", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}>
                      <td style={{ padding: "13px 16px", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>{p.name}</td>
                      <td style={{ padding: "13px 16px" }}><span style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 6, padding: "3px 9px", fontSize: 12, color: "#e8e8f0" }}>{p.category || "—"}</span></td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontWeight: 500, color: isLow ? "#f87171" : isWarn ? "#fbbf24" : "#e8e8f0" }}>{p.qty}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", color: "#6b6b8a" }}>{p.minQty}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", color: "#e8e8f0" }}>{fmt(p.cost)}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "#4ade80" }}>{fmt(p.price)}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", color: "#e8e8f0" }}>{margin}%</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600, ...(isLow ? { background: "rgba(248,113,113,.15)", color: "#f87171", border: "1px solid rgba(248,113,113,.3)" } : isWarn ? { background: "rgba(251,191,36,.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.3)" } : { background: "rgba(74,222,128,.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,.3)" }) }}>
                          {isLow ? "⚠ Baixo" : isWarn ? "↓ Atenção" : "✓ OK"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn sm onClick={() => openMov(p)} color="#4ade80">↕ Mov.</Btn>
                          <Btn sm outline onClick={() => openEdit(p)} color="#7c6af7">✏</Btn>
                          <Btn sm outline onClick={() => deleteProduct(p.id)} color="#f87171">✕</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6b6b8a" }}>Nenhum produto encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Novo Produto" : "Editar Produto"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Nome do Produto"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Camiseta Básica" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
            </div>
            <Field label="Categoria"><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Roupas" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
            <Field label="Qtd. Atual"><input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
            <Field label="Qtd. Mínima"><input type="number" value={form.minQty} onChange={e => setForm(f => ({ ...f, minQty: e.target.value }))} placeholder="0" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
            <Field label="Preço de Custo (R$)"><input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0,00" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
            <Field label="Preço de Venda (R$)"><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn full onClick={saveProduct} color="#7c6af7" disabled={saving}>{saving ? "Salvando…" : "Salvar Produto"}</Btn>
            <Btn full outline onClick={() => setModal(null)} color="#6b6b8a">Cancelar</Btn>
          </div>
        </Modal>
      )}

      {modal === "mov" && sel && (
        <Modal title={`Movimentação — ${sel.name}`} onClose={() => setModal(null)}>
          <p style={{ color: "#6b6b8a", fontSize: 13, marginBottom: 18 }}>
            Estoque atual: <strong style={{ color: "#e8e8f0", fontFamily: "var(--font-mono)" }}>{sel.qty} unidades</strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Tipo de Movimentação">
              <select value={mov.type} onChange={e => setMov(m => ({ ...m, type: e.target.value }))} style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }}>
                <option value="entrada">📥 Entrada (Compra / Reposição)</option>
                <option value="saida">📤 Saída (Venda / Uso)</option>
              </select>
            </Field>
            <Field label="Quantidade"><input type="number" value={mov.qty} onChange={e => setMov(m => ({ ...m, qty: e.target.value }))} placeholder="0" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
            <Field label="Observação (opcional)"><input value={mov.desc} onChange={e => setMov(m => ({ ...m, desc: e.target.value }))} placeholder="Ex: compra de fornecedor" style={{ background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} /></Field>
          </div>
          {mov.type === "saida" && mov.qty > 0 && (
            <p style={{ marginTop: 14, fontSize: 13, color: "#4ade80", background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 8, padding: "8px 12px" }}>
              💵 Venda registrada automaticamente no caixa: <strong>{fmt(sel.price * +mov.qty)}</strong>
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn full onClick={saveMov} color={mov.type === "entrada" ? "#4ade80" : "#f76a8a"} disabled={saving}>
              {saving ? "Salvando…" : mov.type === "entrada" ? "↓ Registrar Entrada" : "↑ Registrar Saída"}
            </Btn>
            <Btn full outline onClick={() => setModal(null)} color="#6b6b8a">Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Caixa({ cash, setCash, loading }) {
  const CUTOFF = "2026-03-11"; // A partir desta data, registrar forma de pagamento

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [filterPgto, setFilterPgto] = useState("todos");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ type: "entrada", desc: "", value: "", date: today(), tag: "", pgto: "dinheiro" });
  const [saving, setSaving] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState({});

  // ── Totais gerais ──────────────────────────────────────────────────────────
  const entradas = cash.filter(c => c.type === "entrada").reduce((s, c) => s + c.value, 0);
  const saidas   = cash.filter(c => c.type === "saida").reduce((s, c) => s + c.value, 0);
  const total    = entradas - saidas;

  // ── Saldo separado — apenas lançamentos a partir do CUTOFF ─────────────────
  const novos = cash.filter(c => c.date >= CUTOFF);
  const entDinheiro = novos.filter(c => c.type === "entrada" && c.pgto === "dinheiro").reduce((s, c) => s + c.value, 0);
  const entConta    = novos.filter(c => c.type === "entrada" && (c.pgto === "cartao" || c.pgto === "pix")).reduce((s, c) => s + c.value, 0);
  const saiDinheiro = novos.filter(c => c.type === "saida"   && (!c.pgto || c.pgto === "dinheiro")).reduce((s, c) => s + c.value, 0);
  const saiConta    = novos.filter(c => c.type === "saida"   && (c.pgto === "cartao" || c.pgto === "pix")).reduce((s, c) => s + c.value, 0);
  const saldoDinheiro = entDinheiro - saiDinheiro;
  const saldoConta    = entConta    - saiConta;
  const temNovos = novos.length > 0;

  const PGTO_LABELS = { dinheiro: "💵 Dinheiro", cartao: "💳 Cartão", pix: "📱 Pix" };
  const PGTO_COLORS = { dinheiro: "#fbbf24", cartao: "#7c6af7", pix: "#4ade80" };

  const openNew = () => {
    setEditId(null);
    setForm({ type: "entrada", desc: "", value: "", date: today(), tag: "", pgto: "dinheiro" });
    setModal(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({ type: c.type, desc: c.desc, value: String(c.value), date: c.date, tag: c.tag || "", pgto: c.pgto || "dinheiro" });
    setModal(true);
  };

  const save = async () => {
    if (!form.desc || !form.value) return;
    setSaving(true);
    const isNew = form.date >= CUTOFF;
    const entry = { ...form, value: +form.value, pgto: isNew ? form.pgto : undefined };
    if (editId) {
      const updated = { ...cash.find(c => c.id === editId), ...entry };
      await api.updateCashEntry(updated);
      setCash(cs => cs.map(c => c.id === editId ? updated : c));
    } else {
      const created = await api.addCashEntry({ ...entry, id: uid() });
      setCash(cs => [created, ...cs]);
    }
    setSaving(false);
    setModal(false);
  };

  const del = async (id) => {
    await api.deleteCashEntry(id);
    setCash(cs => cs.filter(c => c.id !== id));
  };

  const toggleDay = (day) => setCollapsedDays(d => ({ ...d, [day]: !d[day] }));

  const filtered = cash
    .filter(c => filter === "todos" || c.type === filter)
    .filter(c => filterPgto === "todos" || (c.pgto || "") === filterPgto)
    .filter(c => c.desc.toLowerCase().includes(search.toLowerCase()) || (c.tag || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const grouped = filtered.reduce((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const TAGS = [...new Set(cash.map(c => c.tag).filter(Boolean))];
  const inputStyle = { background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" };
  const fmtDayLabel = (d) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── KPIs totais (todos os lançamentos) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
        <KpiCard label="Saldo Total" value={loading ? "…" : fmt(total)} icon="🏦" accent={total >= 0 ? "#4ade80" : "#f87171"} />
        <KpiCard label="Total Entradas" value={loading ? "…" : fmt(entradas)} icon="📥" accent="#4ade80" sub={`${cash.filter(c => c.type === "entrada").length} lançamentos`} />
        <KpiCard label="Total Saídas" value={loading ? "…" : fmt(saidas)} icon="📤" accent="#f87171" sub={`${cash.filter(c => c.type === "saida").length} lançamentos`} />
        <KpiCard label="Margem" value={loading ? "…" : (entradas > 0 ? ((entradas - saidas) / entradas * 100).toFixed(1) : "0.0") + "%"} icon="📊" accent="#7c6af7" />
      </div>

      {/* ── Saldo separado — só aparece quando há lançamentos novos ── */}
      {temNovos && (
        <div>
          <p style={{ fontSize: 11, color: "#6b6b8a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            Breakdown por forma de pagamento — a partir de 11/03/2026
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#fbbf24", borderRadius: "16px 16px 0 0" }} />
              <p style={{ fontSize: 12, color: "#6b6b8a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>💵 Caixa Físico</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: saldoDinheiro >= 0 ? "#fbbf24" : "#f87171" }}>{fmt(saldoDinheiro)}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "#6b6b8a" }}>
                <span>Ent: <strong style={{ color: "#4ade80" }}>{fmt(entDinheiro)}</strong></span>
                <span>Saí: <strong style={{ color: "#f87171" }}>{fmt(saiDinheiro)}</strong></span>
              </div>
            </div>
            <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#7c6af7", borderRadius: "16px 16px 0 0" }} />
              <p style={{ fontSize: 12, color: "#6b6b8a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>💳 Conta Bancária (Cartão + Pix)</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: saldoConta >= 0 ? "#7c6af7" : "#f87171" }}>{fmt(saldoConta)}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "#6b6b8a" }}>
                <span>Ent: <strong style={{ color: "#4ade80" }}>{fmt(entConta)}</strong></span>
                <span>Saí: <strong style={{ color: "#f87171" }}>{fmt(saiConta)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Barra progresso ── */}
      <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 14, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#6b6b8a" }}>
          <span>Entradas <strong style={{ color: "#4ade80" }}>{fmt(entradas)}</strong></span>
          <span>Saídas <strong style={{ color: "#f87171" }}>{fmt(saidas)}</strong></span>
        </div>
        <div style={{ height: 10, background: "#1a1a28", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: entradas > 0 ? `${Math.min(100, (entradas - saidas) / entradas * 100)}%` : "0%", background: "linear-gradient(90deg,#4ade80,#7c6af7)", borderRadius: 10 }} />
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="🔍  Buscar lançamento..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }} />
        {["todos", "entrada", "saida"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? (f === "saida" ? "#f87171" : f === "entrada" ? "#4ade80" : "#7c6af7") : "#1a1a28", color: filter === f ? "#fff" : "#6b6b8a", border: "1px solid #2a2a40", borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {f === "todos" ? "Todos" : f === "entrada" ? "📥 Entrada" : "📤 Saída"}
          </button>
        ))}
        {["dinheiro", "cartao", "pix"].map(p => (
          <button key={p} onClick={() => setFilterPgto(filterPgto === p ? "todos" : p)} style={{ background: filterPgto === p ? PGTO_COLORS[p] : "#1a1a28", color: filterPgto === p ? "#0a0a0f" : "#6b6b8a", border: "1px solid #2a2a40", borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {PGTO_LABELS[p]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn onClick={openNew} color="#7c6af7">＋ Novo Lançamento</Btn>
      </div>

      {/* ── Lista agrupada por dia ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#6b6b8a", background: "#13131c", borderRadius: 16, border: "1px solid #2a2a40" }}><Spinner /> Carregando...</div>
      ) : days.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6b6b8a", background: "#13131c", borderRadius: 16, border: "1px solid #2a2a40" }}>Nenhum lançamento encontrado</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {days.map(day => {
            const items = grouped[day];
            const dayEnt   = items.filter(c => c.type === "entrada").reduce((s, c) => s + c.value, 0);
            const daySai   = items.filter(c => c.type === "saida").reduce((s, c) => s + c.value, 0);
            const daySaldo = dayEnt - daySai;
            const isNew    = day >= CUTOFF;
            const isCollapsed = collapsedDays[day];
            return (
              <div key={day} style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, overflow: "hidden" }}>
                <div onClick={() => toggleDay(day)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", cursor: "pointer", borderBottom: isCollapsed ? "none" : "1px solid #2a2a40", background: "#1a1a28" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 14 }}>{isCollapsed ? "▶" : "▼"}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#e8e8f0", textTransform: "capitalize" }}>{fmtDayLabel(day)}</p>
                      <p style={{ fontSize: 12, color: "#6b6b8a", marginTop: 2 }}>{items.length} lançamento{items.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 13, color: "#4ade80", fontFamily: "var(--font-mono)" }}>+{fmt(dayEnt)}</span>
                    <span style={{ fontSize: 13, color: "#f87171", fontFamily: "var(--font-mono)" }}>-{fmt(daySai)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: daySaldo >= 0 ? "#4ade80" : "#f87171", background: daySaldo >= 0 ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", border: `1px solid ${daySaldo >= 0 ? "rgba(74,222,128,.25)" : "rgba(248,113,113,.25)"}`, borderRadius: 8, padding: "4px 10px" }}>
                      {daySaldo >= 0 ? "+" : ""}{fmt(daySaldo)}
                    </span>
                  </div>
                </div>
                {!isCollapsed && (
                  <div>
                    {items.map((c, i) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: i < items.length - 1 ? "1px solid #2a2a40" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)", flexWrap: "wrap" }}>
                        <span style={{ borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", ...(c.type === "entrada" ? { background: "rgba(74,222,128,.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,.25)" } : { background: "rgba(248,113,113,.12)", color: "#f87171", border: "1px solid rgba(248,113,113,.25)" }) }}>
                          {c.type === "entrada" ? "📥" : "📤"}
                        </span>
                        {/* Badge forma de pagamento — só nos novos */}
                        {isNew && c.pgto && (
                          <span style={{ borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: `${PGTO_COLORS[c.pgto]}22`, color: PGTO_COLORS[c.pgto], border: `1px solid ${PGTO_COLORS[c.pgto]}55` }}>
                            {PGTO_LABELS[c.pgto]}
                          </span>
                        )}
                        <span style={{ flex: 1, fontWeight: 500, color: "#e8e8f0", fontSize: 14, minWidth: 80 }}>{c.desc}</span>
                        {c.tag && <span style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 6, padding: "2px 7px", fontSize: 11, color: "#6b6b8a", whiteSpace: "nowrap" }}>{c.tag}</span>}
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: c.type === "entrada" ? "#4ade80" : "#f87171", whiteSpace: "nowrap" }}>
                          {c.type === "entrada" ? "+" : "-"}{fmt(c.value)}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn sm outline onClick={() => openEdit(c)} color="#7c6af7">✏</Btn>
                          <Btn sm outline onClick={() => del(c.id)} color="#f87171">✕</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <Modal title={editId ? "Editar Lançamento" : "Novo Lançamento"} onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Tipo">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["entrada", "saida"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ padding: "10px", borderRadius: 10, fontWeight: 600, fontSize: 14, border: `2px solid ${form.type === t ? (t === "entrada" ? "#4ade80" : "#f87171") : "#2a2a40"}`, background: form.type === t ? (t === "entrada" ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)") : "#1a1a28", color: form.type === t ? (t === "entrada" ? "#4ade80" : "#f87171") : "#6b6b8a", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    {t === "entrada" ? "📥 Entrada" : "📤 Saída"}
                  </button>
                ))}
              </div>
            </Field>
            {/* Forma de pagamento — só aparece se a data for >= CUTOFF */}
            {form.date >= CUTOFF && (
              <Field label="Forma de Pagamento">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {["dinheiro", "cartao", "pix"].map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, pgto: p }))} style={{ padding: "10px 6px", borderRadius: 10, fontWeight: 600, fontSize: 13, border: `2px solid ${form.pgto === p ? PGTO_COLORS[p] : "#2a2a40"}`, background: form.pgto === p ? `${PGTO_COLORS[p]}18` : "#1a1a28", color: form.pgto === p ? PGTO_COLORS[p] : "#6b6b8a", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "center" }}>
                      {PGTO_LABELS[p]}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <Field label="Descrição"><input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Ex: Venda hambúrguer" style={inputStyle} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Valor (R$)"><input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" style={inputStyle} /></Field>
              <Field label="Data"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></Field>
            </div>
            <Field label="Tag / Categoria">
              <input list="tags" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="Ex: Vendas, Fixo..." style={inputStyle} />
              <datalist id="tags">{TAGS.map(t => <option key={t} value={t} />)}</datalist>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn full onClick={save} color={form.type === "entrada" ? "#4ade80" : "#f87171"} disabled={saving}>{saving ? "Salvando…" : editId ? "Salvar Alterações" : "Registrar"}</Btn>
            <Btn full outline onClick={() => setModal(false)} color="#6b6b8a">Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}


function Dashboard({ products, cash, loading }) {
  const total = cash.reduce((s, c) => c.type === "entrada" ? s + c.value : s - c.value, 0);
  const entradas = cash.filter(c => c.type === "entrada").reduce((s, c) => s + c.value, 0);
  const saidas = cash.filter(c => c.type === "saida").reduce((s, c) => s + c.value, 0);
  const stockVal = products.reduce((s, p) => s + p.qty * p.cost, 0);
  const lowStock = products.filter(p => p.qty <= p.minQty);
  const tags = {};
  cash.filter(c => c.type === "saida").forEach(c => { tags[c.tag || "Outros"] = (tags[c.tag || "Outros"] || 0) + c.value; });
  const topProds = [...products].sort((a, b) => (b.qty * b.price) - (a.qty * a.price)).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <KpiCard label="Saldo em Caixa" value={loading ? "…" : fmt(total)} icon="💳" accent={total >= 0 ? "#4ade80" : "#f87171"} />
        <KpiCard label="Valor em Estoque" value={loading ? "…" : fmt(stockVal)} icon="📦" accent="#7c6af7" sub={`${products.length} produtos`} />
        <KpiCard label="Receita Total" value={loading ? "…" : fmt(entradas)} icon="📈" accent="#4ade80" />
        <KpiCard label="Despesas Total" value={loading ? "…" : fmt(saidas)} icon="📉" accent="#f87171" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16, color: "#e8e8f0", display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ Estoque em Alerta
          </h3>
          {loading ? <div style={{ color: "#6b6b8a" }}><Spinner /> Carregando...</div> :
            lowStock.length === 0 ? <p style={{ color: "#6b6b8a", fontSize: 14 }}>✅ Todos os produtos estão OK!</p> :
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lowStock.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#e8e8f0" }}>{p.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#f87171", fontSize: 13 }}>{p.qty} / {p.minQty} mín</span>
                  </div>
                ))}
              </div>
          }
        </div>

        <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16, color: "#e8e8f0" }}>🏆 Top Produtos (Valor)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topProds.map((p, i) => {
              const pct = topProds[0]?.qty * topProds[0]?.price > 0 ? (p.qty * p.price) / (topProds[0].qty * topProds[0].price) * 100 : 0;
              return (
                <div key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: "#e8e8f0" }}>{i + 1}. {p.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#7c6af7" }}>{fmt(p.qty * p.price)}</span>
                  </div>
                  <div style={{ height: 4, background: "#1a1a28", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#7c6af7", borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16, color: "#e8e8f0" }}>📊 Despesas por Categoria</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([tag, val]) => {
              const pct = saidas > 0 ? val / saidas * 100 : 0;
              const colors = ["#7c6af7", "#f76a8a", "#fbbf24", "#4ade80", "#6b6b8a"];
              const ci = Object.keys(tags).indexOf(tag) % colors.length;
              return (
                <div key={tag}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: "#e8e8f0" }}>{tag}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: colors[ci] }}>{fmt(val)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 4, background: "#1a1a28", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: colors[ci], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(tags).length === 0 && <p style={{ color: "#6b6b8a", fontSize: 14 }}>Nenhuma saída registrada</p>}
          </div>
        </div>

        <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, marginBottom: 16, color: "#e8e8f0" }}>🕐 Últimos Lançamentos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cash.slice(0, 6).map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a2a40" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e8f0" }}>{c.desc}</p>
                  <p style={{ fontSize: 11, color: "#6b6b8a" }}>{fmtDate(c.date)}</p>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: c.type === "entrada" ? "#4ade80" : "#f87171" }}>
                  {c.type === "entrada" ? "+" : "-"}{fmt(c.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Relatorios({ cash, loading }) {
  const today2 = new Date();
  const firstOfMonth = new Date(today2.getFullYear(), today2.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr = today2.toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);
  const [periodo, setPeriodo] = useState("mes");

  const inputStyle = { background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", fontFamily: "var(--font-body)" };

  const applyPeriodo = (p) => {
    setPeriodo(p);
    const now = new Date();
    if (p === "hoje") {
      const d = now.toISOString().slice(0, 10);
      setDateFrom(d); setDateTo(d);
    } else if (p === "semana") {
      const day = now.getDay();
      const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      setDateFrom(monday.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (p === "mes") {
      setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (p === "mes_ant") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(first.toISOString().slice(0, 10));
      setDateTo(last.toISOString().slice(0, 10));
    } else if (p === "ano") {
      setDateFrom(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    }
  };

  // Filtra lançamentos no período
  const filtered = cash.filter(c => c.date >= dateFrom && c.date <= dateTo);
  const entradas = filtered.filter(c => c.type === "entrada");
  const saidas = filtered.filter(c => c.type === "saida");
  const totalEntradas = entradas.reduce((s, c) => s + c.value, 0);
  const totalSaidas = saidas.reduce((s, c) => s + c.value, 0);
  const lucro = totalEntradas - totalSaidas;
  const margem = totalEntradas > 0 ? (lucro / totalEntradas * 100) : 0;

  // Vendas por dia (para o gráfico de barras manual)
  const byDay = {};
  filtered.forEach(c => {
    if (!byDay[c.date]) byDay[c.date] = { entradas: 0, saidas: 0 };
    if (c.type === "entrada") byDay[c.date].entradas += c.value;
    else byDay[c.date].saidas += c.value;
  });
  const days = Object.keys(byDay).sort();
  const maxVal = Math.max(...days.map(d => byDay[d].entradas + byDay[d].saidas), 1);

  // Tags/categorias de saída
  const tagsSaida = {};
  saidas.forEach(c => { tagsSaida[c.tag || "Outros"] = (tagsSaida[c.tag || "Outros"] || 0) + c.value; });

  // Tags/categorias de entrada
  const tagsEntrada = {};
  entradas.forEach(c => { tagsEntrada[c.tag || "Outros"] = (tagsEntrada[c.tag || "Outros"] || 0) + c.value; });

  // Maior dia de faturamento
  const melhorDia = days.reduce((best, d) => byDay[d].entradas > (byDay[best]?.entradas || 0) ? d : best, days[0]);
  const mediaEntradas = days.length > 0 ? totalEntradas / days.length : 0;

  const PERIODOS = [
    { id: "hoje", label: "Hoje" },
    { id: "semana", label: "Esta semana" },
    { id: "mes", label: "Este mês" },
    { id: "mes_ant", label: "Mês anterior" },
    { id: "ano", label: "Este ano" },
    { id: "custom", label: "Personalizado" },
  ];

  const fmtDayShort = (d) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Seletor de período */}
      <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Período de análise</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {PERIODOS.map(p => (
            <button key={p.id} onClick={() => applyPeriodo(p.id)} style={{ background: periodo === p.id ? "#7c6af7" : "#1a1a28", color: periodo === p.id ? "#fff" : "#6b6b8a", border: "1px solid #2a2a40", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              {p.label}
            </button>
          ))}
          {periodo === "custom" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 4 }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, width: 150 }} />
              <span style={{ color: "#6b6b8a" }}>até</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, width: 150 }} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#6b6b8a", background: "#13131c", borderRadius: 16, border: "1px solid #2a2a40" }}><Spinner /> Carregando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
            <KpiCard label="Receita" value={fmt(totalEntradas)} icon="📥" accent="#4ade80" sub={`${entradas.length} lançamentos`} />
            <KpiCard label="Despesas" value={fmt(totalSaidas)} icon="📤" accent="#f87171" sub={`${saidas.length} lançamentos`} />
            <KpiCard label="Lucro Líquido" value={fmt(lucro)} icon="💰" accent={lucro >= 0 ? "#4ade80" : "#f87171"} />
            <KpiCard label="Margem" value={margem.toFixed(1) + "%"} icon="📊" accent="#7c6af7" />
            <KpiCard label="Média por Dia" value={fmt(mediaEntradas)} icon="📅" accent="#fbbf24" sub={`${days.length} dias`} />
            <KpiCard label="Melhor Dia" value={melhorDia ? fmt(byDay[melhorDia]?.entradas) : "—"} icon="🏆" accent="#f76a8a" sub={melhorDia ? fmtDayShort(melhorDia) : ""} />
          </div>

          {/* Gráfico de barras por dia */}
          {days.length > 0 && (
            <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, color: "#e8e8f0", marginBottom: 20 }}>📊 Faturamento por Dia</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, overflowX: "auto", paddingBottom: 8 }}>
                {days.map(d => {
                  const entPct = byDay[d].entradas / maxVal * 100;
                  const saiPct = byDay[d].saidas / maxVal * 100;
                  const isHover = d === melhorDia;
                  return (
                    <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44, flex: "0 0 44px" }} title={`${fmtDayShort(d)}\nEntradas: ${fmt(byDay[d].entradas)}\nSaídas: ${fmt(byDay[d].saidas)}`}>
                      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 120 }}>
                        <div style={{ width: 16, height: `${entPct}%`, minHeight: 4, background: isHover ? "#22c55e" : "#4ade80", borderRadius: "4px 4px 0 0", transition: "height .3s" }} />
                        <div style={{ width: 16, height: `${saiPct}%`, minHeight: 4, background: "#f87171", borderRadius: "4px 4px 0 0", transition: "height .3s" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#6b6b8a", whiteSpace: "nowrap" }}>{fmtDayShort(d)}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6b8a" }}>
                  <span style={{ width: 12, height: 12, background: "#4ade80", borderRadius: 3, display: "inline-block" }} /> Entradas
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6b8a" }}>
                  <span style={{ width: 12, height: 12, background: "#f87171", borderRadius: 3, display: "inline-block" }} /> Saídas
                </span>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Entradas por categoria */}
            <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, color: "#e8e8f0", marginBottom: 16 }}>📥 Entradas por Categoria</h3>
              {Object.keys(tagsEntrada).length === 0 ? (
                <p style={{ color: "#6b6b8a", fontSize: 14 }}>Sem entradas no período</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(tagsEntrada).sort((a, b) => b[1] - a[1]).map(([tag, val], i) => {
                    const pct = totalEntradas > 0 ? val / totalEntradas * 100 : 0;
                    const colors = ["#4ade80", "#7c6af7", "#fbbf24", "#f76a8a", "#6b6b8a"];
                    return (
                      <div key={tag}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 500, color: "#e8e8f0" }}>{tag}</span>
                          <span style={{ fontFamily: "var(--font-mono)", color: colors[i % colors.length] }}>{fmt(val)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: 6, background: "#1a1a28", borderRadius: 4 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: colors[i % colors.length], borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saídas por categoria */}
            <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, color: "#e8e8f0", marginBottom: 16 }}>📤 Saídas por Categoria</h3>
              {Object.keys(tagsSaida).length === 0 ? (
                <p style={{ color: "#6b6b8a", fontSize: 14 }}>Sem saídas no período</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(tagsSaida).sort((a, b) => b[1] - a[1]).map(([tag, val], i) => {
                    const pct = totalSaidas > 0 ? val / totalSaidas * 100 : 0;
                    const colors = ["#f87171", "#f76a8a", "#fbbf24", "#7c6af7", "#6b6b8a"];
                    return (
                      <div key={tag}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 500, color: "#e8e8f0" }}>{tag}</span>
                          <span style={{ fontFamily: "var(--font-mono)", color: colors[i % colors.length] }}>{fmt(val)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: 6, background: "#1a1a28", borderRadius: 4 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: colors[i % colors.length], borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumo do período */}
            <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, color: "#e8e8f0", marginBottom: 16 }}>📋 Resumo do Período</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Total de dias", value: days.length + " dias" },
                  { label: "Lançamentos", value: filtered.length },
                  { label: "Receita bruta", value: fmt(totalEntradas), color: "#4ade80" },
                  { label: "Total despesas", value: fmt(totalSaidas), color: "#f87171" },
                  { label: "Lucro líquido", value: fmt(lucro), color: lucro >= 0 ? "#4ade80" : "#f87171" },
                  { label: "Margem de lucro", value: margem.toFixed(1) + "%", color: "#7c6af7" },
                  { label: "Ticket médio/dia", value: fmt(mediaEntradas), color: "#fbbf24" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a2a40" }}>
                    <span style={{ fontSize: 13, color: "#6b6b8a" }}>{row.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: row.color || "#e8e8f0" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top lançamentos do período */}
            <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, color: "#e8e8f0", marginBottom: 16 }}>🏅 Maiores Entradas do Período</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entradas.sort((a, b) => b.value - a.value).slice(0, 6).map((c, i) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a2a40" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", minWidth: 20 }}>#{i + 1}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e8f0" }}>{c.desc}</p>
                        <p style={{ fontSize: 11, color: "#6b6b8a" }}>{fmtDate(c.date)}{c.tag ? ` · ${c.tag}` : ""}</p>
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" }}>+{fmt(c.value)}</span>
                  </div>
                ))}
                {entradas.length === 0 && <p style={{ color: "#6b6b8a", fontSize: 14 }}>Sem entradas no período</p>}
              </div>
            </div>
          </div>

          {/* Tabela detalhada */}
          <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a40", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, color: "#e8e8f0" }}>📄 Todos os Lançamentos do Período</h3>
              <span style={{ fontSize: 12, color: "#6b6b8a", fontFamily: "var(--font-mono)" }}>{filtered.length} registros</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2a40" }}>
                    {["Data", "Descrição", "Categoria", "Tipo", "Valor"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #2a2a40", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)" }}>
                      <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#6b6b8a", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500, color: "#e8e8f0" }}>{c.desc}</td>
                      <td style={{ padding: "11px 16px" }}>{c.tag && <span style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#6b6b8a" }}>{c.tag}</span>}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600, ...(c.type === "entrada" ? { background: "rgba(74,222,128,.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,.25)" } : { background: "rgba(248,113,113,.12)", color: "#f87171", border: "1px solid rgba(248,113,113,.25)" }) }}>
                          {c.type === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono)", fontWeight: 700, color: c.type === "entrada" ? "#4ade80" : "#f87171", whiteSpace: "nowrap" }}>
                        {c.type === "entrada" ? "+" : "-"}{fmt(c.value)}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#6b6b8a" }}>Nenhum lançamento no período selecionado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StockApp({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [cash, setCash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    { id: "relatorios", label: "Relatórios", icon: "📈" },
  ];

  const lowCount = products.filter(p => p.qty <= p.minQty).length;
  const saldo = cash.reduce((s, c) => c.type === "entrada" ? s + c.value : s - c.value, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column" }}>

      {/* HEADER — logo + nav desktop + saldo */}
      <header style={{ background: "#13131c", borderBottom: "1px solid #2a2a40", padding: "0 20px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100, height: 62 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#7c6af7,#f76a8a)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>📊</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, lineHeight: 1, color: "#e8e8f0" }}>StockFlow</h1>
            <p style={{ fontSize: 10, color: "#6b6b8a", lineHeight: 1.4 }}>Estoque & Caixa</p>
          </div>
        </div>

        {/* Nav — só desktop */}
        <nav className="desktop-nav" style={{ display: "flex", gap: 3, marginLeft: 16, flex: 1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "rgba(124,106,247,.15)" : "transparent", color: tab === t.id ? "#7c6af7" : "#6b6b8a", border: tab === t.id ? "1px solid rgba(124,106,247,.3)" : "1px solid transparent", borderRadius: 9, padding: "7px 13px", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", position: "relative", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
              {t.icon} {t.label}
              {t.id === "estoque" && lowCount > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: "#f87171", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{lowCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Saldo + status + logout */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: error ? "#f87171" : "#4ade80" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: error ? "#f87171" : "#4ade80", display: "inline-block" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "#6b6b8a" }}>Saldo</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: saldo >= 0 ? "#4ade80" : "#f87171" }}>{fmt(saldo)}</p>
          </div>
          <button onClick={() => { sessionStorage.removeItem(AUTH_KEY); onLogout(); }} style={{ background: "transparent", border: "1px solid #2a2a40", borderRadius: 8, color: "#6b6b8a", fontSize: 12, padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }} title="Sair">🔒</button>
        </div>
      </header>

      {error && (
        <div style={{ background: "rgba(248,113,113,.1)", borderBottom: "1px solid rgba(248,113,113,.3)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#f87171" }}>⚠️ Sem conexão com o servidor.</span>
          <Btn sm onClick={loadData} color="#f87171">Tentar novamente</Btn>
        </div>
      )}

      <main style={{ flex: 1, padding: "16px", maxWidth: 1200, width: "100%", margin: "0 auto", alignSelf: "stretch", boxSizing: "border-box" }}>
        {tab === "dashboard" && <Dashboard products={products} cash={cash} loading={loading} />}
        {tab === "estoque" && <Estoque products={products} setProducts={setProducts} setCash={setCash} loading={loading} />}
        {tab === "caixa" && <Caixa cash={cash} setCash={setCash} loading={loading} />}
        {tab === "relatorios" && <Relatorios cash={cash} loading={loading} />}
      </main>

      {/* Espaço para o bottom nav não cobrir conteúdo no mobile */}
      <div className="mobile-spacer" style={{ height: 70 }} />

      {/* BOTTOM NAV — só mobile */}
      <nav className="mobile-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#13131c", borderTop: "1px solid #2a2a40", display: "flex", zIndex: 200, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 4px", background: "transparent", border: "none", cursor: "pointer", position: "relative", borderTop: tab === t.id ? "2px solid #7c6af7" : "2px solid transparent" }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.id ? "#7c6af7" : "#6b6b8a", fontFamily: "var(--font-body)" }}>{t.label}</span>
            {t.id === "estoque" && lowCount > 0 && (
              <span style={{ position: "absolute", top: 6, right: "calc(50% - 18px)", background: "#f87171", color: "#fff", borderRadius: "50%", width: 15, height: 15, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{lowCount}</span>
            )}
          </button>
        ))}
      </nav>

      <footer style={{ borderTop: "1px solid #2a2a40", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#6b6b8a" }}>StockFlow © 2025</span>
        <span style={{ fontSize: 11, color: "#6b6b8a", fontFamily: "var(--font-mono)" }}>{products.length} produtos · {cash.length} lançamentos</span>
      </footer>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  return <StockApp onLogout={() => setAuthed(false)} />;
}
