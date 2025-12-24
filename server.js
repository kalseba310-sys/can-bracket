import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Railway Postgres
// Railway fournit DATABASE_URL (tu l'as déjà mise)
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL manquant. Ajoute la variable sur Railway.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // utile sur certains hébergeurs ; si ça casse chez toi, mets false
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(express.json());

// Static
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ✅ créer table si absent
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pronos (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      selections JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✅ DB ready (table pronos OK)");
}

// ✅ API: enregistrer un prono
app.post("/submit", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.name || !payload.selections) {
      return res.status(400).json({ error: "Données invalides" });
    }

    // On garde seulement { name, selections }
    await pool.query(
      "INSERT INTO pronos (name, selections) VALUES ($1, $2)",
      [payload.name, payload.selections]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ /submit error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ API: voir tous les pronos (le nom le plus probable côté front)
app.get("/submissions", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, selections, created_at FROM pronos ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ /submissions error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Alias si ton front appelle /pronos
app.get("/pronos", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, selections, created_at FROM pronos ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ /pronos error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Fallback SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start
initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log("✅ Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  });
