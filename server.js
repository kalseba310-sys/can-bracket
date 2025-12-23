import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// === Dossier data (Volume Railway) ===
const DATA_DIR = "/app/data";
const DATA_FILE = path.join(DATA_DIR, "pronos.json");

// Crée le dossier si inexistant
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Crée le fichier si inexistant
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// === Middlewares ===
app.use(express.json());
app.use(express.static("public"));

// === API : enregistrer un prono ===
app.post("/submit", (req, res) => {
  try {
    const prono = req.body;

    if (!prono.name || !prono.matches) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const allPronos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

    allPronos.push({
      ...prono,
      date: new Date().toISOString()
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(allPronos, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// === API : voir tous les pronos ===
app.get("/pronos", (req, res) => {
  const allPronos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  res.json(allPronos);
});

// === Fallback SPA ===
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// === START ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
