const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "pronos.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

// Enregistrer (ou remplacer) le prono d’un nom
app.post("/submit", (req, res) => {
  try {
    const { name, selections } = req.body || {};
    if (!name || !selections) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const pronos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    // 1 prono par nom (remplace si existe)
    const cleanName = String(name).trim();
    const filtered = pronos.filter(p => (p.name || "").trim() !== cleanName);

    filtered.push({
      name: cleanName,
      selections,
      createdAt: new Date().toISOString(),
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), "utf8");
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/pronos", (req, res) => {
  try {
    const pronos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    res.json(pronos);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server running on port", PORT);
});
