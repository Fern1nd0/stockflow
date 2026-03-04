import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, "db.json");

app.use(cors());
app.use(express.json());

// ─── Lê o banco de dados ───────────────────────────────────────────────────
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return { products: [], cash: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ─── Rotas: Products ──────────────────────────────────────────────────────
app.get("/products", (req, res) => {
  res.json(readDB().products);
});

app.post("/products", (req, res) => {
  const db = readDB();
  db.products.push(req.body);
  writeDB(db);
  res.status(201).json(req.body);
});

app.put("/products/:id", (req, res) => {
  const db = readDB();
  db.products = db.products.map(p => p.id === req.params.id ? req.body : p);
  writeDB(db);
  res.json(req.body);
});

app.delete("/products/:id", (req, res) => {
  const db = readDB();
  db.products = db.products.filter(p => p.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

// ─── Rotas: Cash ──────────────────────────────────────────────────────────
app.get("/cash", (req, res) => {
  res.json(readDB().cash);
});

app.post("/cash", (req, res) => {
  const db = readDB();
  db.cash.unshift(req.body);
  writeDB(db);
  res.status(201).json(req.body);
});

app.delete("/cash/:id", (req, res) => {
  const db = readDB();
  db.cash = db.cash.filter(c => c.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

// ─── Serve o frontend (build do Vite) ─────────────────────────────────────
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`✅ StockFlow rodando na porta ${PORT}`));