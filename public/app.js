/* =========================================================
   CAN 2025 — Bracket (24 pays en 8e uniquement + propagation auto)
   Format sauvegardé en serveur:
   POST /submit { name, selections: { bracket, metaVersion:2 } }
   ========================================================= */

const COUNTRIES = [
  "Maroc", "Mali", "Zambie", "Comores",
  "Égypte", "Afrique du Sud", "Angola", "Zimbabwe",
  "Nigeria", "Tunisie", "Ouganda", "Tanzanie",
  "Sénégal", "RD Congo", "Bénin", "Botswana",
  "Algérie", "Burkina Faso", "Guinée équatoriale", "Soudan",
  "Côte d'Ivoire", "Cameroun", "Gabon", "Mozambique"
];

// Labels "tableau"
const R16_SLOTS = [
  { id:"m1", homeLabel:"1D", awayLabel:"3B/3E/3F" },
  { id:"m2", homeLabel:"2A", awayLabel:"2C" },
  { id:"m3", homeLabel:"1A", awayLabel:"3C/3D/3E" },
  { id:"m4", homeLabel:"2B", awayLabel:"2F" },
  { id:"m5", homeLabel:"1B", awayLabel:"3A/3C/3D" },
  { id:"m6", homeLabel:"1F", awayLabel:"2E" },
  { id:"m7", homeLabel:"1E", awayLabel:"2D" },
  { id:"m8", homeLabel:"1C", awayLabel:"3A/3B/3F" },
];

function deepClone(x){ return JSON.parse(JSON.stringify(x)); }

// Bracket v2
function makeEmptyBracket() {
  return {
    r16: {
      m1:{home:"",away:"",winner:""},
      m2:{home:"",away:"",winner:""},
      m3:{home:"",away:"",winner:""},
      m4:{home:"",away:"",winner:""},
      m5:{home:"",away:"",winner:""},
      m6:{home:"",away:"",winner:""},
      m7:{home:"",away:"",winner:""},
      m8:{home:"",away:"",winner:""},
    },
    qf: {
      m1:{home:"",away:"",winner:"", homeFrom:"r16.m1", awayFrom:"r16.m2"},
      m2:{home:"",away:"",winner:"", homeFrom:"r16.m3", awayFrom:"r16.m4"},
      m3:{home:"",away:"",winner:"", homeFrom:"r16.m5", awayFrom:"r16.m6"},
      m4:{home:"",away:"",winner:"", homeFrom:"r16.m7", awayFrom:"r16.m8"},
    },
    sf: {
      m1:{home:"",away:"",winner:"", homeFrom:"qf.m1", awayFrom:"qf.m2"},
      m2:{home:"",away:"",winner:"", homeFrom:"qf.m3", awayFrom:"qf.m4"},
    },
    final: {
      m1:{home:"",away:"",winner:"", homeFrom:"sf.m1", awayFrom:"sf.m2"},
    },
    third: {
      m1:{home:"",away:"",winner:""} // rempli depuis perdants des demis
    }
  };
}

let state = {
  name: "",
  bracket: makeEmptyBracket()
};

function $(id){ return document.getElementById(id); }

function saveLocal() {
  try {
    localStorage.setItem("can2025_state_v2", JSON.stringify(state));
  } catch {}
}

function loadLocal() {
  try {
    const raw = localStorage.getItem("can2025_state_v2");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.bracket?.r16) state = parsed;
  } catch {}
}

function getWinner(ref, bracket) {
  // ref ex: "r16.m1"
  const [stage, mid] = ref.split(".");
  return bracket?.[stage]?.[mid]?.winner || "";
}

function autoFillParticipants() {
  const b = state.bracket;

  // Quarts participants = gagnants des 8e
  for (const [id, m] of Object.entries(b.qf)) {
    m.home = getWinner(m.homeFrom, b);
    m.away = getWinner(m.awayFrom, b);
    // si winner devenu invalide (ex: équipe changée) → reset
    if (m.winner && m.winner !== m.home && m.winner !== m.away) m.winner = "";
  }

  // Demis participants = gagnants des quarts
  for (const [id, m] of Object.entries(b.sf)) {
    m.home = getWinner(m.homeFrom, b);
    m.away = getWinner(m.awayFrom, b);
    if (m.winner && m.winner !== m.home && m.winner !== m.away) m.winner = "";
  }

  // Finale participants = gagnants des demis
  {
    const m = b.final.m1;
    m.home = getWinner(m.homeFrom, b);
    m.away = getWinner(m.awayFrom, b);
    if (m.winner && m.winner !== m.home && m.winner !== m.away) m.winner = "";
  }

  // Match 3e place = perdants des demis
  {
    const sf1 = b.sf.m1, sf2 = b.sf.m2;
    const sf1Loser = sf1.winner ? (sf1.winner === sf1.home ? sf1.away : sf1.home) : "";
    const sf2Loser = sf2.winner ? (sf2.winner === sf2.home ? sf2.away : sf2.home) : "";
    b.third.m1.home = sf1Loser || "";
    b.third.m1.away = sf2Loser || "";
    if (b.third.m1.winner && b.third.m1.winner !== b.third.m1.home && b.third.m1.winner !== b.third.m1.away) {
      b.third.m1.winner = "";
    }
  }
}

function optionList(values, current) {
  const opts = [`<option value="">—</option>`]
    .concat(values.map(v => `<option value="${escapeHtml(v)}" ${v===current?"selected":""}>${escapeHtml(v)}</option>`));
  return opts.join("");
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function render() {
  autoFillParticipants();
  saveLocal();

  // Important: ton index.html doit avoir ces containers:
  // <div id="bracket"></div>
  // <input id="name" />
  // <button id="resetBtn">Réinitialiser</button>
  // <button id="submitBtn">Soumettre mon prono</button>

  if ($("name")) $("name").value = state.name || "";

  const root = $("bracket");
  if (!root) return;

  root.innerHTML = "";

  root.appendChild(roundR16());
  root.appendChild(roundQF());
  root.appendChild(roundSF());
  root.appendChild(roundFinal());
  root.appendChild(roundThird());
}

function mkCard(title, countText) {
  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.style.border = "1px solid #e5e7eb";
  wrap.style.borderRadius = "12px";
  wrap.style.padding = "12px";
  wrap.style.marginBottom = "12px";
  wrap.style.background = "#fff";

  const h = document.createElement("div");
  h.style.display = "flex";
  h.style.justifyContent = "space-between";
  h.style.alignItems = "center";
  h.style.marginBottom = "10px";

  const t = document.createElement("div");
  t.textContent = title;
  t.style.fontWeight = "800";

  const pill = document.createElement("div");
  pill.textContent = countText;
  pill.style.fontSize = "12px";
  pill.style.background = "#111827";
  pill.style.color = "#fff";
  pill.style.padding = "2px 8px";
  pill.style.borderRadius = "999px";

  h.appendChild(t); h.appendChild(pill);
  wrap.appendChild(h);

  return wrap;
}

function mkMatchBlock(label) {
  const m = document.createElement("div");
  m.className = "match";
  m.style.border = "1px solid #e5e7eb";
  m.style.borderRadius = "12px";
  m.style.padding = "10px";
  m.style.marginBottom = "10px";

  const l = document.createElement("div");
  l.textContent = label;
  l.style.fontSize = "12px";
  l.style.color = "#6b7280";
  l.style.marginBottom = "8px";

  m.appendChild(l);
  return m;
}

function mkSelect(html, onChange) {
  const s = document.createElement("select");
  s.innerHTML = html;
  s.style.width = "100%";
  s.style.padding = "10px";
  s.style.border = "1px solid #e5e7eb";
  s.style.borderRadius = "10px";
  s.style.marginBottom = "8px";
  s.addEventListener("change", onChange);
  return s;
}

function mkDisabledInput(value) {
  const i = document.createElement("input");
  i.value = value || "—";
  i.disabled = true;
  i.style.width = "100%";
  i.style.padding = "10px";
  i.style.border = "1px solid #e5e7eb";
  i.style.borderRadius = "10px";
  i.style.marginBottom = "8px";
  i.style.background = "#f9fafb";
  return i;
}

function roundR16() {
  const card = mkCard("Huitièmes de finale", "8 matchs");

  for (const slot of R16_SLOTS) {
    const match = state.bracket.r16[slot.id];
    const block = mkMatchBlock(`${slot.id.toUpperCase()} — ${slot.homeLabel} vs ${slot.awayLabel}`);

    // ✅ ici: 24 pays pour home/away (SEULEMENT en 8e)
    const homeSel = mkSelect(optionList(COUNTRIES, match.home), () => {
      match.home = homeSel.value;
      if (match.winner && match.winner !== match.home && match.winner !== match.away) match.winner = "";
      render();
    });
    const awaySel = mkSelect(optionList(COUNTRIES, match.away), () => {
      match.away = awaySel.value;
      if (match.winner && match.winner !== match.home && match.winner !== match.away) match.winner = "";
      render();
    });

    // Winner = seulement 2 options (home/away) quand présents
    const winOptions = [];
    if (match.home) winOptions.push(match.home);
    if (match.away && match.away !== match.home) winOptions.push(match.away);

    const winnerSel = mkSelect(optionList(winOptions, match.winner), () => {
      match.winner = winnerSel.value;
      render();
    });

    block.appendChild(homeSel);
    block.appendChild(awaySel);
    block.appendChild(winnerSel);

    card.appendChild(block);
  }

  return card;
}

function roundQF() {
  const card = mkCard("Quarts de finale", "4 matchs");
  const ids = ["m1","m2","m3","m4"];

  ids.forEach((id, idx) => {
    const match = state.bracket.qf[id];
    const block = mkMatchBlock(`Quart #${idx+1}`);

    // ❌ plus de liste 24 pays : participants auto
    block.appendChild(mkDisabledInput(match.home));
    block.appendChild(mkDisabledInput(match.away));

    const winOptions = [];
    if (match.home) winOptions.push(match.home);
    if (match.away && match.away !== match.home) winOptions.push(match.away);

    const winnerSel = mkSelect(optionList(winOptions, match.winner), () => {
      match.winner = winnerSel.value;
      render();
    });

    block.appendChild(winnerSel);
    card.appendChild(block);
  });

  return card;
}

function roundSF() {
  const card = mkCard("Demi-finales", "2 matchs");
  const ids = ["m1","m2"];

  ids.forEach((id, idx) => {
    const match = state.bracket.sf[id];
    const block = mkMatchBlock(`Demi #${idx+1}`);

    block.appendChild(mkDisabledInput(match.home));
    block.appendChild(mkDisabledInput(match.away));

    const winOptions = [];
    if (match.home) winOptions.push(match.home);
    if (match.away && match.away !== match.home) winOptions.push(match.away);

    const winnerSel = mkSelect(optionList(winOptions, match.winner), () => {
      match.winner = winnerSel.value;
      render();
    });

    block.appendChild(winnerSel);
    card.appendChild(block);
  });

  return card;
}

function roundFinal() {
  const card = mkCard("Finale", "1 match");
  const match = state.bracket.final.m1;
  const block = mkMatchBlock("Finale");

  block.appendChild(mkDisabledInput(match.home));
  block.appendChild(mkDisabledInput(match.away));

  const winOptions = [];
  if (match.home) winOptions.push(match.home);
  if (match.away && match.away !== match.home) winOptions.push(match.away);

  const winnerSel = mkSelect(optionList(winOptions, match.winner), () => {
    match.winner = winnerSel.value;
    render();
  });

  block.appendChild(winnerSel);
  card.appendChild(block);
  return card;
}

function roundThird() {
  const card = mkCard("3e place", "1 match");
  const match = state.bracket.third.m1;
  const block = mkMatchBlock("3e place");

  block.appendChild(mkDisabledInput(match.home));
  block.appendChild(mkDisabledInput(match.away));

  const winOptions = [];
  if (match.home) winOptions.push(match.home);
  if (match.away && match.away !== match.home) winOptions.push(match.away);

  const winnerSel = mkSelect(optionList(winOptions, match.winner), () => {
    match.winner = winnerSel.value;
    render();
  });

  block.appendChild(winnerSel);
  card.appendChild(block);
  return card;
}

async function submitToServer() {
  const name = (state.name || "").trim();
  if (!name) {
    alert("Entre ton nom avant de soumettre.");
    return;
  }

  const payload = {
    name,
    selections: {
      metaVersion: 2,
      bracket: state.bracket
    }
  };

  const res = await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${t}`);
  }
}

function resetAll() {
  state.bracket = makeEmptyBracket();
  saveLocal();
  render();
}

/* ====== INIT ====== */
function wireUI() {
  loadLocal();
  render();

  if ($("name")) {
    $("name").addEventListener("input", (e) => {
      state.name = e.target.value;
      saveLocal();
    });
  }

  if ($("resetBtn")) {
    $("resetBtn").addEventListener("click", () => {
      if (confirm("Réinitialiser ton prono ?")) resetAll();
    });
  }

  if ($("submitBtn")) {
    $("submitBtn").addEventListener("click", async () => {
      try {
        await submitToServer();
        alert("✅ Prono enregistré !");
      } catch (err) {
        console.error(err);
        alert("Erreur: impossible d’enregistrer sur le serveur.");
      }
    });
  }
}

wireUI();
