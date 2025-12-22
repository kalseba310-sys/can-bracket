const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Route principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Test API
app.post("/team", (req, res) => {
  res.json({ success: true });
});

// Start server (OBLIGATOIRE pour Railway)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
