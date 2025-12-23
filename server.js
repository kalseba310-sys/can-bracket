import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Railway fournit PORT. En local, 8080
const PORT = process.env.PORT || 8080;

// DB (fichier dans le projet)
const db = new Database(path.join(__dirname, "can2025.db"));

// Table pronos
db.prepare(`
  CREATE TABLE IF NOT EXISTS pronos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view.html"));
});

// API: enregistrer un prono
app.post("/api/pronos", (req, res) => {
  try {
    const { name, picks } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Nom requis" });
    }
    if (!picks || typeof picks !== "object") {
      return res.status(400).json({ error: "Picks manquants" });
    }

    const createdAt = new Date().toISOString();
    const stmt = db.prepare(
      "INSERT INTO pronos (name, data, created_at) VALUES (?, ?, ?)"
    );
    const info = stmt.run(name.trim(), JSON.stringify(picks), createdAt);

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// API: liste des pronos
app.get("/api/pronos", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT id, name, created_at FROM pronos ORDER BY id DESC")
      .all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// API: détail d’un prono
app.get("/api/pronos/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = db
      .prepare("SELECT id, name, data, created_at FROM pronos WHERE id = ?")
      .get(id);

    if (!row) return res.status(404).json({ error: "Introuvable" });

    res.json({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      picks: JSON.parse(row.data),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
