const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Dossier data
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "pronos.json");

// Crée le dossier/fichier si absent
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

// ✅ API: enregistrer un prono
app.post("/submit", (req, res) => {
  const payload = req.body;

  if (!payload || !payload.name || !payload.selections) {
    return res.status(400).json({ error: "Données invalides" });
  }

  const pronos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  pronos.push({
    ...payload,
    createdAt: new Date().toISOString(),
  });

  fs.writeFileSync(DATA_FILE, JSON.stringify(pronos, null, 2));

  res.json({ success: true });
});

// ✅ API: voir tous les pronos
app.get("/pronos", (req, res) => {
  const pronos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  res.json(pronos);
});

// Fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server running on port", PORT);
});
