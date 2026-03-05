import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL;

app.use(cors());
app.use(express.json());

let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db("stockflow");
  console.log("✅ MongoDB conectado!");
}

// ─── Products ─────────────────────────────────────────────────────────────────
app.get("/products", async (req, res) => {
  const items = await db.collection("products").find().toArray();
  res.json(items.map(({ _id, ...rest }) => rest));
});

app.post("/products", async (req, res) => {
  await db.collection("products").insertOne(req.body);
  res.status(201).json(req.body);
});

app.put("/products/:id", async (req, res) => {
  const { _id, ...data } = req.body;
  await db.collection("products").updateOne({ id: req.params.id }, { $set: data });
  res.json(req.body);
});

app.delete("/products/:id", async (req, res) => {
  await db.collection("products").deleteOne({ id: req.params.id });
  res.status(204).end();
});

// ─── Cash ─────────────────────────────────────────────────────────────────────
app.get("/cash", async (req, res) => {
  const items = await db.collection("cash").find().sort({ date: -1 }).toArray();
  res.json(items.map(({ _id, ...rest }) => rest));
});

app.post("/cash", async (req, res) => {
  await db.collection("cash").insertOne(req.body);
  res.status(201).json(req.body);
});

app.put("/cash/:id", async (req, res) => {
  const { _id, ...data } = req.body;
  await db.collection("cash").updateOne({ id: req.params.id }, { $set: data });
  res.json(req.body);
});

app.delete("/cash/:id", async (req, res) => {
  await db.collection("cash").deleteOne({ id: req.params.id });
  res.status(204).end();
});

// ─── Frontend ─────────────────────────────────────────────────────────────────
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
} else {
  app.get("*", (req, res) => res.status(500).send("Build não encontrado."));
}

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 StockFlow na porta ${PORT}`));
}).catch(err => {
  console.error("Erro ao conectar MongoDB:", err);
  process.exit(1);
});