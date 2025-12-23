// server.js
const path = require("path");
const fs = require("fs");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// Railway donne le port via process.env.PORT
const PORT = process.env.PORT || 8080;

// ---- DB PATH (persistant sur Railway si volume, sinon ça repart à zéro à chaque redeploy)
const DATA_DIR = process.env.DB_DIR || path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "can_bracket.sqlite");
const db = new sqlite3.Database(DB_PATH);

// ---- Init DB
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pronos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 1 prono par nom (écrase si même nom)
  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pronos_name ON pronos(name)
  `);
});

// ---- Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---- Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view.html"));
});

// ---- API : enregistrer un prono
app.post("/submit", (req, res) => {
  const name = (req.body?.name || "").trim();
  const selections = req.body?.selections;

  if (!name) return res.status(400).json({ error: "Nom requis" });
  if (!selections) return res.status(400).json({ error: "Données manquantes" });

  const payload = JSON.stringify(selections);

  // upsert (insert or update) via INSERT OR REPLACE
  db.run(
    `
    INSERT OR REPLACE INTO pronos(name, payload, created_at)
    VALUES(?, ?, datetime('now'))
  `,
    [name, payload],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "DB error" });
      }
      res.json({ success: true });
    }
  );
});

// ---- API : liste des pronos (pour view)
app.get("/pronos", (req, res) => {
  db.all(
    `
    SELECT name, payload, created_at
    FROM pronos
    ORDER BY datetime(created_at) DESC
  `,
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "DB error" });
      }
      const parsed = rows.map((r) => ({
        name: r.name,
        created_at: r.created_at,
        selections: safeJsonParse(r.payload),
      }));
      res.json({ items: parsed });
    }
  );
});

// ---- API : récupérer le prono d'une personne
app.get("/pronos/:name", (req, res) => {
  const name = (req.params.name || "").trim();
  db.get(
    `SELECT name, payload, created_at FROM pronos WHERE name = ?`,
    [name],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json({
        name: row.name,
        created_at: row.created_at,
        selections: safeJsonParse(row.payload),
      });
    }
  );
});

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ DB: ${DB_PATH}`);
});
