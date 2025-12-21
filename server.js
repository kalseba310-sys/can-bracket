import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database(path.join(__dirname, "can2025.db"));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
});

function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

app.get("/api/predictions", (req, res) => {
  db.all(
    `SELECT id, username, created_at FROM predictions ORDER BY datetime(created_at) DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    }
  );
});

app.get("/api/predictions/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  db.get(
    `SELECT id, username, payload, created_at FROM predictions WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json({ ...row, payload: JSON.parse(row.payload) });
    }
  );
});

app.post("/api/predictions", (req, res) => {
  const { username, payload } = req.body;

  if (!isNonEmptyString(username)) {
    return res.status(400).json({ error: "username required" });
  }
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "payload required" });
  }

  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO predictions (username, payload, created_at) VALUES (?, ?, ?)`,
    [username.trim(), JSON.stringify(payload), createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

// IMPORTANT pour Railway + téléphone
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
