const COUNTRIES = [
  "Maroc","Algérie","Tunisie","Égypte","Sénégal","Côte d’Ivoire",
  "Nigeria","Ghana","Cameroun","Mali","Burkina Faso","Guinée",
  "RD Congo","Afrique du Sud","Zambie","Angola","Gabon","Ouganda",
  "Cap-Vert","Guinée équatoriale","Mozambique","Namibie","Comores","Zimbabwe"
];

const R16 = [
  { id:"m1", label:"8e #1 (1D vs 3B/3E/3F)" },
  { id:"m2", label:"8e #2 (2A vs 2C)" },
  { id:"m3", label:"8e #3 (1A vs 3C/3D/3E)" },
  { id:"m4", label:"8e #4 (2B vs 2F)" },
  { id:"m5", label:"8e #5 (1B vs 3A/3C/3D)" },
  { id:"m6", label:"8e #6 (1F vs 2E)" },
  { id:"m7", label:"8e #7 (1E vs 2D)" },
  { id:"m8", label:"8e #8 (1C vs 3A/3B/3F)" }
];

function emptyState() {
  return {
    name: "",
    bracket: {
      r16: Object.fromEntries(R16.map(m => [m.id, { home:"", away:"", winner:"" }])),
      qf: { m1:{home:"",away:"",winner:""}, m2:{home:"",away:"",winner:""}, m3:{home:"",away:"",winner:""}, m4:{home:"",away:"",winner:""} },
      sf: { m1:{home:"",away:"",winner:""}, m2:{home:"",away:"",winner:""} },
      final: { m1:{home:"",away:"",winner:""} },
      third: { m1:{home:"",away:"",winner:""} }
    }
  };
}

let state = emptyState();

const $ = (id) => document.getElementById(id);

function saveLocal() {
  try { localStorage.setItem("can2025_state", JSON.stringify(state)); } catch {}
}
function loadLocal() {
  try {
    const raw = localStorage.getItem("can2025_state");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.bracket?.r16) state = parsed;
  } catch {}
}

function setStatus(msg) {
  const el = $("status");
  if (el) el.textContent = msg || "";
}

function options(values, current, placeholder="—") {
  const safe = (s) => String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  let html = `<option value="">${placeholder}</option>`;
  for (const v of values) {
    html += `<option value="${safe(v)}" ${v===current?"selected":""}>${safe(v)}</option>`;
  }
  return html;
}

function autoPropagate() {
  const b = state.bracket;

  // QF from R16 winners
  b.qf.m1.home = b.r16.m1.winner; b.qf.m1.away = b.r16.m2.winner;
  b.qf.m2.home = b.r16.m3.winner; b.qf.m2.away = b.r16.m4.winner;
  b.qf.m3.home = b.r16.m5.winner; b.qf.m3.away = b.r16.m6.winner;
  b.qf.m4.home = b.r16.m7.winner; b.qf.m4.away = b.r16.m8.winner;

  for (const k of ["m1","m2","m3","m4"]) {
    const m = b.qf[k];
    if (m.winner && m.winner !== m.home && m.winner !== m.away) m.winner = "";
  }

  // SF from QF winners
  b.sf.m1.home = b.qf.m1.winner; b.sf.m1.away = b.qf.m2.winner;
  b.sf.m2.home = b.qf.m3.winner; b.sf.m2.away = b.qf.m4.winner;

  for (const k of ["m1","m2"]) {
    const m = b.sf[k];
    if (m.winner && m.winner !== m.home && m.winner !== m.away) m.winner = "";
  }

  // Final from SF winners
  b.final.m1.home = b.sf.m1.winner;
  b.final.m1.away = b.sf.m2.winner;
  if (b.final.m1.winner && b.final.m1.winner !== b.final.m1.home && b.final.m1.winner !== b.final.m1.away) {
    b.final.m1.winner = "";
  }

  // Third place from SF losers
  const sf1 = b.sf.m1, sf2 = b.sf.m2;
  const sf1Loser = sf1.winner ? (sf1.winner === sf1.home ? sf1.away : sf1.home) : "";
  const sf2Loser = sf2.winner ? (sf2.winner === sf2.home ? sf2.away : sf2.home) : "";
  b.third.m1.home = sf1Loser || "";
  b.third.m1.away = sf2Loser || "";
  if (b.third.m1.winner && b.third.m1.winner !== b.third.m1.home && b.third.m1.winner !== b.third.m1.away) {
    b.third.m1.winner = "";
  }
}

function render() {
  autoPropagate();
  saveLocal();

  // name
  if ($("name")) $("name").value = state.name || "";

  // R16
  const r16El = $("r16");
  r16El.innerHTML = "";
  for (const m of R16) {
    const match = state.bracket.r16[m.id];

    const box = document.createElement("div");
    box.className = "match";

    const title = document.createElement("div");
    title.className = "small";
    title.textContent = m.label;
    box.appendChild(title);

    const selA = document.createElement("select");
    selA.innerHTML = options(COUNTRIES, match.home, "Choisir équipe A");
    selA.addEventListener("change", () => {
      match.home = selA.value;
      if (match.away && match.home && match.away === match.home) match.away = "";
      if (match.winner && match.winner !== match.home && match.winner !== match.away) match.winner = "";
      render();
    });

    const selB = document.createElement("select");
    selB.innerHTML = options(COUNTRIES, match.away, "Choisir équipe B");
    selB.addEventListener("change", () => {
      match.away = selB.value;
      if (match.away && match.home && match.away === match.home) match.away = "";
      if (match.winner && match.winner !== match.home && match.winner !== match.away) match.winner = "";
      render();
    });

    const choices = [];
    if (match.home) choices.push(match.home);
    if (match.away && match.away !== match.home) choices.push(match.away);

    const selW = document.createElement("select");
    selW.innerHTML = options(choices, match.winner, "Choisir le gagnant");
    selW.addEventListener("change", () => {
      match.winner = selW.value;
      render();
    });

    box.appendChild(selA);
    box.appendChild(selB);
    box.appendChild(selW);

    r16El.appendChild(box);
  }

  // Next rounds
  const next = $("nextRounds");
  next.innerHTML = "";
  next.appendChild(roundBlock("Quarts", state.bracket.qf, 4));
  next.appendChild(roundBlock("Demi-finales", state.bracket.sf, 2));
  next.appendChild(finalBlock());
  next.appendChild(thirdBlock());
}

function roundBlock(title, roundObj, n) {
  const wrap = document.createElement("div");
  wrap.style.marginBottom = "12px";

  const h = document.createElement("div");
  h.style.fontWeight = "800";
  h.style.marginBottom = "8px";
  h.textContent = title;
  wrap.appendChild(h);

  for (let i=1;i<=n;i++) {
    const id = "m"+i;
    const m = roundObj[id];

    const box = document.createElement("div");
    box.className = "match";

    const t = document.createElement("div");
    t.className = "small";
    t.textContent = `${title.slice(0,-1)} #${i}`;
    box.appendChild(t);

    const a = document.createElement("input");
    a.disabled = true; a.className="disabled"; a.value = m.home || "—";
    a.style.width="100%"; a.style.padding="10px 12px"; a.style.border="1px solid #e5e7eb"; a.style.borderRadius="10px"; a.style.marginBottom="8px";
    const b = document.createElement("input");
    b.disabled = true; b.className="disabled"; b.value = m.away || "—";
    b.style.width="100%"; b.style.padding="10px 12px"; b.style.border="1px solid #e5e7eb"; b.style.borderRadius="10px"; b.style.marginBottom="8px";

    const choices = [];
    if (m.home) choices.push(m.home);
    if (m.away && m.away !== m.home) choices.push(m.away);

    const w = document.createElement("select");
    w.innerHTML = options(choices, m.winner, "Choisir le gagnant");
    w.addEventListener("change", () => {
      m.winner = w.value;
      render();
    });

    box.appendChild(a);
    box.appendChild(b);
    box.appendChild(w);

    wrap.appendChild(box);
  }

  return wrap;
}

function finalBlock() {
  const wrap = document.createElement("div");
  wrap.style.marginBottom = "12px";

  const h = document.createElement("div");
  h.style.fontWeight = "800";
  h.style.marginBottom = "8px";
  h.textContent = "Finale";
  wrap.appendChild(h);

  const m = state.bracket.final.m1;
  const box = document.createElement("div");
  box.className = "match";

  const a = document.createElement("input");
  a.disabled = true; a.className="disabled"; a.value = m.home || "—";
  a.style.width="100%"; a.style.padding="10px 12px"; a.style.border="1px solid #e5e7eb"; a.style.borderRadius="10px"; a.style.marginBottom="8px";
  const b = document.createElement("input");
  b.disabled = true; b.className="disabled"; b.value = m.away || "—";
  b.style.width="100%"; b.style.padding="10px 12px"; b.style.border="1px solid #e5e7eb"; b.style.borderRadius="10px"; b.style.marginBottom="8px";

  const choices = [];
  if (m.home) choices.push(m.home);
  if (m.away && m.away !== m.home) choices.push(m.away);

  const w = document.createElement("select");
  w.innerHTML = options(choices, m.winner, "Choisir le champion");
  w.addEventListener("change", () => { m.winner = w.value; render(); });

  box.appendChild(a); box.appendChild(b); box.appendChild(w);
  wrap.appendChild(box);
  return wrap;
}

function thirdBlock() {
  const wrap = document.createElement("div");

  const h = document.createElement("div");
  h.style.fontWeight = "800";
  h.style.marginBottom = "8px";
  h.textContent = "3e place";
  wrap.appendChild(h);

  const m = state.bracket.third.m1;
  const box = document.createElement("div");
  box.className = "match";

  const a = document.createElement("input");
  a.disabled = true; a.className="disabled"; a.value = m.home || "—";
  a.style.width="100%"; a.style.padding="10px 12px"; a.style.border="1px solid #e5e7eb"; a.style.borderRadius="10px"; a.style.marginBottom="8px";
  const b = document.createElement("input");
  b.disabled = true; b.className="disabled"; b.value = m.away || "—";
  b.style.width="100%"; b.style.padding="10px 12px"; b.style.border="1px solid #e5e7eb"; b.style.borderRadius="10px"; b.style.marginBottom="8px";

  const choices = [];
  if (m.home) choices.push(m.home);
  if (m.away && m.away !== m.home) choices.push(m.away);

  const w = document.createElement("select");
  w.innerHTML = options(choices, m.winner, "Choisir le gagnant");
  w.addEventListener("change", () => { m.winner = w.value; render(); });

  box.appendChild(a); box.appendChild(b); box.appendChild(w);
  wrap.appendChild(box);
  return wrap;
}

async function submit() {
  const name = (state.name || "").trim();
  if (!name) { alert("Entre ton nom"); return; }

  const payload = {
    name,
    selections: state
  };

  setStatus("Envoi en cours...");
  const res = await fetch("/submit", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    setStatus("");
    alert("Erreur serveur lors de l’enregistrement");
    return;
  }
  setStatus("✅ Enregistré ! Va sur 'Voir les pronostics'.");
}

function resetAll() {
  state = emptyState();
  saveLocal();
  render();
  setStatus("Réinitialisé.");
}

function wire() {
  loadLocal();
  render();

  $("name").addEventListener("input", (e) => {
    state.name = e.target.value;
    saveLocal();
  });

  $("resetBtn").addEventListener("click", resetAll);
  $("submitBtn").addEventListener("click", submit);
}

wire();
