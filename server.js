import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Pour Railway / production
const PORT = process.env.PORT || 8080;

// Fix __dirname avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Route principale → affiche index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API : ajouter une équipe (exemple)
app.post("/team", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Nom requis" });
  }

  res.json({ success: true, name });
});

// Lancement du serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
