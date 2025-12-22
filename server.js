import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080; // ✅ OBLIGATOIRE pour Railway

// Database
const db = new Database("can2025.db");

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`).run();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/team", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Nom requis" });
  }
  db.prepare("INSERT INTO teams (name) VALUES (?)").run(name);
  res.json({ success: true });
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
