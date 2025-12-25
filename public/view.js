async function getPronos() {
  const res = await fetch("/pronos", { cache: "no-store" });
  if (!res.ok) throw new Error("Impossible de charger /pronos");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString("fr-FR");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * On supporte 2 formats possibles, selon ton app :
 * - v2 (recommandé): selections.bracket.r16.m1.home/away/winner ...
 * - v1 (ancien): selections.slots + selections.winners (fallback lisible)
 */
function getBracket(prono) {
  const sel = prono?.selections;
  if (!sel) return null;

  // v2
  if (sel.bracket?.r16?.m1) return { type: "v2", bracket: sel.bracket };

  // parfois selections EST le state complet
  if (sel?.bracket?.r16?.m1) return { type: "v2", bracket: sel.bracket };

  // v1 fallback
  if (sel.slots || sel.winners) return { type: "v1", slots: sel.slots || {}, winners: sel.winners || {} };

  return null;
}

function matchHTML(label, home, away, winner) {
  const h = home?.trim() ? home : "—";
  const a = away?.trim() ? away : "—";
  const w = winner?.trim() ? winner : "";

  const homeWin = w && w === h;
  const awayWin = w && w === a;

  return `
    <div class="match">
      <div class="label">${escapeHtml(label)}</div>
      <div class="team ${homeWin ? "win" : ""}">
        <div class="tname">${escapeHtml(h)}</div>
        <div class="tag">${homeWin ? "Gagnant" : ""}</div>
      </div>
      <div class="team ${awayWin ? "win" : ""}">
        <div class="tname">${escapeHtml(a)}</div>
        <div class="tag">${awayWin ? "Gagnant" : ""}</div>
      </div>
      <div class="winnerLine">Gagnant : <b>${escapeHtml(w || "—")}</b></div>
    </div>
  `;
}

function renderV2(bracket) {
  const r16Labels = [
    "8e #1 (1D vs 3B/3E/3F)",
    "8e #2 (2A vs 2C)",
    "8e #3 (1A vs 3C/3D/3E)",
    "8e #4 (2B vs 2F)",
    "8e #5 (1B vs 3A/3C/3D)",
    "8e #6 (1F vs 2E)",
    "8e #7 (1E vs 2D)",
    "8e #8 (1C vs 3A/3B/3F)",
  ];

  const r16Ids = ["m1","m2","m3","m4","m5","m6","m7","m8"];
  const qfIds  = ["m1","m2","m3","m4"];
  const sfIds  = ["m1","m2"];

  const r16 = r16Ids.map((id, i) => {
    const m = bracket.r16?.[id] || {};
    return matchHTML(r16Labels[i], m.home, m.away, m.winner);
  }).join("");

  const qf = qfIds.map((id, i) => {
    const m = bracket.qf?.[id] || {};
    return matchHTML(`Quart #${i+1}`, m.home, m.away, m.winner);
  }).join("");

  const sf = sfIds.map((id, i) => {
    const m = bracket.sf?.[id] || {};
    return matchHTML(`Demi #${i+1}`, m.home, m.away, m.winner);
  }).join("");

  const fin = (() => {
    const m = bracket.final?.m1 || {};
    return matchHTML("Finale", m.home, m.away, m.winner);
  })();

  const third = (() => {
    const m = bracket.third?.m1 || {};
    return matchHTML("Match 3e place", m.home, m.away, m.winner);
  })();

  return `
    <div class="bracket">
      <div class="round">
        <h3><span>Huitièmes</span><span class="pill">8</span></h3>
        ${r16}
      </div>
      <div class="round">
        <h3><span>Quarts</span><span class="pill">4</span></h3>
        ${qf}
      </div>
      <div class="round">
        <h3><span>Demi-finales</span><span class="pill">2</span></h3>
        ${sf}
      </div>
      <div class="round">
        <h3><span>Finale</span><span class="pill">1</span></h3>
        ${fin}
      </div>
      <div class="round">
        <h3><span>3e place</span><span class="pill">1</span></h3>
        ${third}
      </div>
    </div>
  `;
}

function renderV1(slots, winners) {
  // fallback lisible si ton ancien format existe encore
  // On affiche simplement ce qu'on a, groupé
  const keys = Object.keys(slots || {}).sort();
  const lines = keys.map(k => {
    const v = slots[k];
    return `<div class="team"><div class="tname">${escapeHtml(k)}</div><div class="tag">${escapeHtml(v || "—")}</div></div>`;
  }).join("");

  const wkeys = Object.keys(winners || {}).sort();
  const wlines = wkeys.map(k => {
    const v = winners[k];
    return `<div class="team win"><div class="tname">${escapeHtml(k)}</div><div class="tag">${escapeHtml(v || "—")}</div></div>`;
  }).join("");

  return `
    <div class="bracket">
      <div class="round" style="grid-column:1/-1">
        <h3><span>Affichage (ancien format)</span><span class="pill">v1</span></h3>
        <div class="match">
          <div class="label">Choix enregistrés</div>
          ${lines || "<div class='meta'>Aucun slot</div>"}
        </div>
        <div class="match">
          <div class="label">Gagnants</div>
          ${wlines || "<div class='meta'>Aucun gagnant</div>"}
        </div>
      </div>
    </div>
  `;
}

let ALL = [];
let ACTIVE_ID = null;

function renderList(items) {
  const listEl = document.getElementById("list");
  const emptyEl = document.getElementById("empty");
  listEl.innerHTML = "";

  if (!items.length) {
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";

  items.forEach((p) => {
    const div = document.createElement("div");
    div.className = "item" + (p._id === ACTIVE_ID ? " active" : "");
    div.innerHTML = `
      <div class="name">${escapeHtml(p.name || "Sans nom")}</div>
      <div class="meta">${fmtDate(p.updatedAt || p.createdAt || p.updated_at || p.created_at)}</div>
    `;
    div.onclick = () => {
      ACTIVE_ID = p._id;
      renderList(items);
      renderDetail(p);
    };
    listEl.appendChild(div);
  });
}

function renderDetail(prono) {
  const metaEl = document.getElementById("meta");
  const detailEl = document.getElementById("detail");

  const d = prono.updatedAt || prono.createdAt || prono.updated_at || prono.created_at;
  metaEl.textContent = `Nom : ${prono.name || "—"} • Date : ${fmtDate(d)}`;

  const br = getBracket(prono);
  if (!br) {
    detailEl.innerHTML = `<div class="empty">Aucune donnée exploitable pour ce prono.</div>`;
    return;
  }

  if (br.type === "v2") {
    detailEl.innerHTML = renderV2(br.bracket);
    return;
  }

  detailEl.innerHTML = renderV1(br.slots, br.winners);
}

function applyFilter() {
  const q = (document.getElementById("q").value || "").toLowerCase().trim();
  const filtered = ALL.filter(p => (p.name || "").toLowerCase().includes(q));
  renderList(filtered);

  // si l’actif a disparu du filtre, on sélectionne le premier
  if (filtered.length && !filtered.find(x => x._id === ACTIVE_ID)) {
    ACTIVE_ID = filtered[0]._id;
    renderList(filtered);
    renderDetail(filtered[0]);
  }
}

async function main() {
  const countEl = document.getElementById("count");
  document.getElementById("q").addEventListener("input", applyFilter);

  try {
    const pronos = await getPronos();

    ALL = pronos.map((p, i) => ({
      ...p,
      _id: `${i}-${p.name}-${p.updatedAt || p.createdAt || p.updated_at || p.created_at || ""}`
    }));

    // tri par date
    ALL.sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || a.updated_at || a.created_at || 0).getTime();
      const db = new Date(b.updatedAt || b.createdAt || b.updated_at || b.created_at || 0).getTime();
      return db - da;
    });

    countEl.textContent = `${ALL.length} pronos`;

    renderList(ALL);

    if (ALL.length) {
      ACTIVE_ID = ALL[0]._id;
      renderList(ALL);
      renderDetail(ALL[0]);
    }
  } catch (e) {
    countEl.textContent = "Erreur";
    document.getElementById("list").innerHTML = `<div class="empty">Impossible de charger /pronos.</div>`;
  }
}

main();
