import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Banco de dados persistente ───────────────────────────────────────────────
// No Render, usa /tmp que sobrevive enquanto o servidor está vivo
// Localmente usa db.json na raiz do projeto
const IS_PROD = process.env.NODE_ENV === "production" || process.env.RENDER;
const DB_FILE = IS_PROD ? "/tmp/db.json" : path.join(__dirname, "db.json");

const DB_INITIAL = {
  products: [],
  cash: []
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Tenta copiar o db.json do projeto como seed inicial
      const seed = path.join(__dirname, "db.json");
      if (fs.existsSync(seed)) {
        fs.copyFileSync(seed, DB_FILE);
      } else {
        fs.writeFileSync(DB_FILE, JSON.stringify(DB_INITIAL, null, 2));
      }
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return DB_INITIAL;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Erro ao salvar banco:", e);
  }
}

app.use(cors());
app.use(express.json());

// ─── Products ──────────────────────────────────────────────────────────────────
app.get("/products", (req, res) => res.json(readDB().products));

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

// ─── Cash ──────────────────────────────────────────────────────────────────────
app.get("/cash", (req, res) => res.json(readDB().cash));

app.post("/cash", (req, res) => {
  const db = readDB();
  db.cash.unshift(req.body);
  writeDB(db);
  res.status(201).json(req.body);
});

app.put("/cash/:id", (req, res) => {
  const db = readDB();
  db.cash = db.cash.map(c => c.id === req.params.id ? req.body : c);
  writeDB(db);
  res.json(req.body);
});

app.delete("/cash/:id", (req, res) => {
  const db = readDB();
  db.cash = db.cash.filter(c => c.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

// ─── Frontend ──────────────────────────────────────────────────────────────────
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
} else {
  app.get("*", (req, res) => res.status(500).send("Build não encontrado."));
}

app.listen(PORT, () => console.log(`✅ StockFlow na porta ${PORT} | DB: ${DB_FILE}`));