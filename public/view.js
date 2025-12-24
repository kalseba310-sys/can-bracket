async function apiGet(path) {
  const res = await fetch(path, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Supporte 2 formats:
 * - v2: selections.bracket (recommandé)
 * - v1: selections = { slots, winners } (ancien)
 */
function normalizeToBracket(prono) {
  const sel = prono?.selections;
  if (!sel) return null;

  // v2
  if (sel.bracket && sel.bracket.r16) return sel.bracket;

  // v1 → on tente une conversion minimale (si tu as encore l'ancien format)
  // Si ton ancien code utilise sel.slots + sel.winners, ça affichera au moins les infos.
  if (sel.slots || sel.winners) {
    return {
      __legacy: true,
      slots: sel.slots || {},
      winners: sel.winners || {}
    };
  }

  return null;
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return n;
}

/* ======== BRACKET RENDER (v2) ======== */

const R16_LABELS = [
  "8e #1 (1D vs 3B/3E/3F)",
  "8e #2 (2A vs 2C)",
  "8e #3 (1A vs 3C/3D/3E)",
  "8e #4 (2B vs 2F)",
  "8e #5 (1B vs 3A/3C/3D)",
  "8e #6 (1F vs 2E)",
  "8e #7 (1E vs 2D)",
  "8e #8 (1C vs 3A/3B/3F)",
];

function renderMatchReadOnly(match, label) {
  const home = match?.home || "—";
  const away = match?.away || "—";
  const w = match?.winner || "";

  const homeWin = w && home === w;
  const awayWin = w && away === w;

  return el("div", { class: "match" }, [
    el("div", { class: "label" }, [
      el("span", {}, [label]),
      el("span", { class: "pill" }, [w ? "OK" : "—"])
    ]),
    el("div", { class: "team" + (homeWin ? " win" : "") }, [
      el("div", { class: "tname" }, [home]),
      el("div", { class: "tag" }, [homeWin ? "Gagnant" : ""])
    ]),
    el("div", { class: "team" + (awayWin ? " win" : "") }, [
      el("div", { class: "tname" }, [away]),
      el("div", { class: "tag" }, [awayWin ? "Gagnant" : ""])
    ]),
    el("div", { class: "winnerLine" }, [
      "Gagnant : ",
      el("b", {}, [w || "—"])
    ])
  ]);
}

function renderBracketV2(bracket) {
  // Rounds containers
  const r16 = el("div", { class: "round" }, [
    el("h3", {}, [el("span", {}, ["Huitièmes"]), el("span", { class: "pill" }, ["8 matchs"])])
  ]);
  const qf = el("div", { class: "round" }, [
    el("h3", {}, [el("span", {}, ["Quarts"]), el("span", { class: "pill" }, ["4 matchs"])])
  ]);
  const sf = el("div", { class: "round" }, [
    el("h3", {}, [el("span", {}, ["Demi-finales"]), el("span", { class: "pill" }, ["2 matchs"])])
  ]);
  const fin = el("div", { class: "round" }, [
    el("h3", {}, [el("span", {}, ["Finale"]), el("span", { class: "pill" }, ["1 match"])])
  ]);
  const third = el("div", { class: "round" }, [
    el("h3", {}, [el("span", {}, ["3e place"]), el("span", { class: "pill" }, ["1 match"])])
  ]);

  const r16Ids = ["m1","m2","m3","m4","m5","m6","m7","m8"];
  r16Ids.forEach((id, i) => r16.appendChild(renderMatchReadOnly(bracket.r16?.[id], R16_LABELS[i])));

  const qfIds = ["m1","m2","m3","m4"];
  qfIds.forEach((id, i) => qf.appendChild(renderMatchReadOnly(bracket.qf?.[id], `Quart #${i+1}`)));

  const sfIds = ["m1","m2"];
  sfIds.forEach((id, i) => sf.appendChild(renderMatchReadOnly(bracket.sf?.[id], `Demi #${i+1}`)));

  fin.appendChild(renderMatchReadOnly(bracket.final?.m1, "Finale"));
  third.appendChild(renderMatchReadOnly(bracket.third?.m1, "3e place"));

  return el("div", { class: "bracket" }, [r16, qf, sf, fin, third]);
}

function renderLegacy(sel) {
  // fallback lisible même si c’est l’ancien format
  return el("div", { class: "round" }, [
    el("h3", {}, [el("span", {}, ["Ancien format"]), el("span", { class: "pill" }, ["JSON"]) ]),
    el("div", { class: "match" }, [
      el("div", { class: "label" }, ["Données brutes"]),
      el("pre", {}, [JSON.stringify(sel, null, 2)])
    ])
  ]);
}

/* ======== PAGE LOGIC ======== */

let ALL = [];
let ACTIVE_ID = null;

function renderList(items) {
  const list = document.getElementById("list");
  const empty = document.getElementById("listEmpty");
  list.innerHTML = "";

  if (!items.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const p of items) {
    const id = p._id;
    const node = el("div", { class: "item" + (id === ACTIVE_ID ? " active" : "") }, [
      el("div", { class: "name" }, [p.name || "Sans nom"]),
      el("div", { class: "meta" }, [p.createdAt ? fmtDate(p.createdAt) : ""])
    ]);
    node.addEventListener("click", () => {
      ACTIVE_ID = id;
      renderList(items);
      renderDetail(p);
    });
    list.appendChild(node);
  }
}

function renderDetail(prono) {
  const meta = document.getElementById("meta");
  const detail = document.getElementById("detail");

  meta.textContent = `Nom : ${prono.name || "—"}  •  Date : ${prono.createdAt ? fmtDate(prono.createdAt) : "—"}`;
  detail.innerHTML = "";

  const bracket = normalizeToBracket(prono);

  if (!bracket) {
    detail.appendChild(el("div", { class: "empty" }, ["Aucune donnée exploitable dans ce prono."]));
    return;
  }

  if (bracket.__legacy) {
    detail.appendChild(renderLegacy(bracket));
    return;
  }

  detail.appendChild(renderBracketV2(bracket));
}

function applySearch() {
  const q = (document.getElementById("q").value || "").toLowerCase().trim();
  const filtered = ALL.filter(p => (p.name || "").toLowerCase().includes(q));
  renderList(filtered);
}

async function main() {
  const badge = document.getElementById("countBadge");
  try {
    const pronos = await apiGet("/pronos");
    // on fabrique un id stable local (index+date)
    ALL = (pronos || [])
      .map((p, idx) => ({ ...p, _id: `${idx}-${p.createdAt || ""}` }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    badge.textContent = `${ALL.length} pronos`;
    renderList(ALL);
    document.getElementById("q").addEventListener("input", applySearch);
  } catch (e) {
    badge.textContent = `Erreur`;
    document.getElementById("listEmpty").style.display = "block";
    document.getElementById("listEmpty").textContent = "Impossible de charger /pronos. Vérifie que ton serveur tourne.";
  }
}

main();
