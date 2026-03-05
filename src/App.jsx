import { useState, useEffect, useCallback } from "react";
import * as api from "./api.js";

const fmt = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

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
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ type: "entrada", desc: "", value: "", date: today(), tag: "" });
  const [saving, setSaving] = useState(false);

  const total = cash.reduce((s, c) => c.type === "entrada" ? s + c.value : s - c.value, 0);
  const entradas = cash.filter(c => c.type === "entrada").reduce((s, c) => s + c.value, 0);
  const saidas = cash.filter(c => c.type === "saida").reduce((s, c) => s + c.value, 0);

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
    .filter(c => filter === "todos" || c.type === filter)
    .filter(c => c.desc.toLowerCase().includes(search.toLowerCase()) || (c.tag || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const TAGS = [...new Set(cash.map(c => c.tag).filter(Boolean))];

  const inputStyle = { background: "#1a1a28", border: "1px solid #2a2a40", color: "#e8e8f0", borderRadius: 8, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", fontFamily: "var(--font-body)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <KpiCard label="Saldo Atual" value={loading ? "…" : fmt(total)} icon="🏦" accent={total >= 0 ? "#4ade80" : "#f87171"} />
        <KpiCard label="Total Entradas" value={loading ? "…" : fmt(entradas)} icon="📥" accent="#4ade80" sub={`${cash.filter(c => c.type === "entrada").length} lançamentos`} />
        <KpiCard label="Total Saídas" value={loading ? "…" : fmt(saidas)} icon="📤" accent="#f87171" sub={`${cash.filter(c => c.type === "saida").length} lançamentos`} />
        <KpiCard label="Resultado" value={loading ? "…" : (entradas > 0 ? ((entradas - saidas) / entradas * 100).toFixed(1) : "0.0") + "%"} icon="📊" accent="#7c6af7" sub="margem líquida" />
      </div>

      <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 14, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#6b6b8a" }}>
          <span>Entradas <strong style={{ color: "#4ade80" }}>{fmt(entradas)}</strong></span>
          <span>Saídas <strong style={{ color: "#f87171" }}>{fmt(saidas)}</strong></span>
        </div>
        <div style={{ height: 10, background: "#1a1a28", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: entradas > 0 ? `${Math.min(100, (entradas - saidas) / entradas * 100)}%` : "0%", background: "linear-gradient(90deg,#4ade80,#7c6af7)", borderRadius: 10 }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder="🔍  Buscar lançamento..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 260 }} />
        {["todos", "entrada", "saida"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? (f === "saida" ? "#f87171" : f === "entrada" ? "#4ade80" : "#7c6af7") : "#1a1a28", color: filter === f ? "#fff" : "#6b6b8a", border: "1px solid #2a2a40", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {f === "todos" ? "Todos" : f === "entrada" ? "📥 Entradas" : "📤 Saídas"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn onClick={() => { setForm({ type: "entrada", desc: "", value: "", date: today(), tag: "" }); setModal(true); }} color="#7c6af7">＋ Novo Lançamento</Btn>
      </div>

      <div style={{ background: "#13131c", border: "1px solid #2a2a40", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#6b6b8a" }}><Spinner /> Carregando...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a40" }}>
                  {["Data", "Descrição", "Tag", "Tipo", "Valor", ""].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #2a2a40", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#6b6b8a" }}>{fmtDate(c.date)}</td>
                    <td style={{ padding: "13px 16px", fontWeight: 500, color: "#e8e8f0" }}>{c.desc}</td>
                    <td style={{ padding: "13px 16px" }}>{c.tag && <span style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#e8e8f0" }}>{c.tag}</span>}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600, ...(c.type === "entrada" ? { background: "rgba(74,222,128,.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,.25)" } : { background: "rgba(248,113,113,.12)", color: "#f87171", border: "1px solid rgba(248,113,113,.25)" }) }}>
                        {c.type === "entrada" ? "📥 Entrada" : "📤 Saída"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-mono)", fontWeight: 600, color: c.type === "entrada" ? "#4ade80" : "#f87171" }}>
                      {c.type === "entrada" ? "+" : "-"}{fmt(c.value)}
                    </td>
                    <td style={{ padding: "13px 16px" }}><Btn sm outline onClick={() => del(c.id)} color="#f87171">✕</Btn></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#6b6b8a" }}>Nenhum lançamento encontrado</td></tr>
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
                {["entrada", "saida"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ padding: "10px", borderRadius: 10, fontWeight: 600, fontSize: 14, border: `2px solid ${form.type === t ? (t === "entrada" ? "#4ade80" : "#f87171") : "#2a2a40"}`, background: form.type === t ? (t === "entrada" ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)") : "#1a1a28", color: form.type === t ? (t === "entrada" ? "#4ade80" : "#f87171") : "#6b6b8a", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    {t === "entrada" ? "📥 Entrada" : "📤 Saída"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Descrição"><input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Ex: Venda de produtos" style={inputStyle} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Valor (R$)"><input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" style={inputStyle} /></Field>
              <Field label="Data"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></Field>
            </div>
            <Field label="Tag / Categoria">
              <input list="tags" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="Ex: Vendas, Fixo, Estoque..." style={inputStyle} />
              <datalist id="tags">{TAGS.map(t => <option key={t} value={t} />)}</datalist>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn full onClick={save} color={form.type === "entrada" ? "#4ade80" : "#f87171"} disabled={saving}>{saving ? "Registrando…" : "Registrar"}</Btn>
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

export default function App() {
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
  ];

  const lowCount = products.filter(p => p.qty <= p.minQty).length;
  const saldo = cash.reduce((s, c) => c.type === "entrada" ? s + c.value : s - c.value, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "#13131c", borderBottom: "1px solid #2a2a40", padding: "0 28px", display: "flex", alignItems: "center", gap: 20, position: "sticky", top: 0, zIndex: 100, height: 62 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#7c6af7,#f76a8a)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, lineHeight: 1, color: "#e8e8f0" }}>StockFlow</h1>
            <p style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.4 }}>Gestão de Estoque & Caixa</p>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4, marginLeft: 28 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "rgba(124,106,247,.15)" : "transparent", color: tab === t.id ? "#7c6af7" : "#6b6b8a", border: tab === t.id ? "1px solid rgba(124,106,247,.3)" : "1px solid transparent", borderRadius: 9, padding: "7px 16px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", position: "relative", fontFamily: "var(--font-body)" }}>
              {t.icon} {t.label}
              {t.id === "estoque" && lowCount > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#f87171", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{lowCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: error ? "#f87171" : "#4ade80" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: error ? "#f87171" : "#4ade80", display: "inline-block" }} />
            {error ? "Sem conexão" : "Sincronizado"}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#6b6b8a" }}>Saldo</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: saldo >= 0 ? "#4ade80" : "#f87171" }}>{fmt(saldo)}</p>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: "rgba(248,113,113,.1)", borderBottom: "1px solid rgba(248,113,113,.3)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#f87171" }}>⚠️ Não foi possível conectar ao servidor.</span>
          <Btn sm onClick={loadData} color="#f87171">Tentar novamente</Btn>
        </div>
      )}

      <main style={{ flex: 1, padding: "28px", maxWidth: 1200, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
        {tab === "dashboard" && <Dashboard products={products} cash={cash} loading={loading} />}
        {tab === "estoque" && <Estoque products={products} setProducts={setProducts} setCash={setCash} loading={loading} />}
        {tab === "caixa" && <Caixa cash={cash} setCash={setCash} loading={loading} />}
      </main>

      <footer style={{ borderTop: "1px solid #2a2a40", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#6b6b8a" }}>StockFlow © 2025 — Controle de Estoque & Caixa</span>
        <span style={{ fontSize: 12, color: "#6b6b8a", fontFamily: "var(--font-mono)" }}>{products.length} produtos · {cash.length} lançamentos</span>
      </footer>
    </div>
  );
}
