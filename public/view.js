const listEl = document.getElementById("list");
const detailEl = document.getElementById("detail");

let allPronos = [];

// Sécurité affichage HTML
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString("fr-FR");
}

// Charger tous les pronos depuis l’API
async function loadPronos() {
  listEl.innerHTML = "Chargement…";
  detailEl.innerHTML = "Clique sur un nom pour afficher son prono.";

  try {
    const res = await fetch("/pronos");
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    allPronos = Array.isArray(data) ? data : [];

    if (allPronos.length === 0) {
      listEl.innerHTML = "<i>Aucun prono pour le moment.</i>";
      return;
    }

    // Plus récents en premier
    allPronos.sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );

    renderList();
  } catch (err) {
    console.error(err);
    listEl.innerHTML =
      "<span style='color:red'>Erreur chargement pronos</span>";
  }
}

// Affiche la liste des noms
function renderList() {
  listEl.innerHTML = "";

  allPronos.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "prono-item";
    div.style.cursor = "pointer";
    div.style.padding = "6px 0";

    div.innerHTML = `
      <b>${escapeHtml(p.name || "Sans nom")}</b>
      <small style="color:#666">
        ${p.createdAt ? " — " + formatDate(p.createdAt) : ""}
      </small>
    `;

    div.onclick = () => showDetail(index);
    listEl.appendChild(div);
  });
}

// Affiche le détail d’un prono
function showDetail(index) {
  const p = allPronos[index];
  if (!p) return;

  detailEl.innerHTML = `
    <h3>${escapeHtml(p.name || "Sans nom")}</h3>
    <small style="color:#666">
      ${p.createdAt ? formatDate(p.createdAt) : ""}
    </small>
    <pre style="
      background:#111;
      color:#eee;
      padding:10px;
      border-radius:6px;
      margin-top:10px;
      overflow:auto;
    ">${escapeHtml(JSON.stringify(p.selections, null, 2))}</pre>
  `;
}

// Chargement automatique au démarrage
loadPronos();
