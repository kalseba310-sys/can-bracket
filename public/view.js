function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function roMatch(id, seedA, seedB, a, b, w) {
  return `
    <div class="match">
      <div class="title">${escapeHtml(id)}</div>
      <div class="slot"><div class="seed">${escapeHtml(seedA)}</div><div>${escapeHtml(a)}</div></div>
      <div class="slot"><div class="seed">${escapeHtml(seedB)}</div><div>${escapeHtml(b)}</div></div>
      <div class="slot" style="margin-top:10px;"><div class="seed">Gagnant</div><div><b>${escapeHtml(w)}</b></div></div>
    </div>
  `;
}

function renderReadOnlyBracket(root, payload) {
  const slots = payload?.slots || {};
  const winners = payload?.winners || {};
  const get = (k) => slots[k] || "—";
  const win = (k) => winners[k] || "—";

  root.innerHTML = `
    <div class="round">
      <h2>Huitièmes <span class="badge red">8</span></h2>
      <div class="split">
        <div>
          ${roMatch("R16_1","1D","3B/3E/3F", get("R16_1_A"), get("R16_1_B"), win("R16_1"))}
          ${roMatch("R16_2","2A","2C",       get("R16_2_A"), get("R16_2_B"), win("R16_2"))}
          ${roMatch("R16_3","1A","3C/3D/3E", get("R16_3_A"), get("R16_3_B"), win("R16_3"))}
          ${roMatch("R16_4","2B","2F",       get("R16_4_A"), get("R16_4_B"), win("R16_4"))}
        </div>
        <div>
          ${roMatch("R16_5","1B","3A/3C/3D", get("R16_5_A"), get("R16_5_B"), win("R16_5"))}
          ${roMatch("R16_6","1F","2E",       get("R16_6_A"), get("R16_6_B"), win("R16_6"))}
          ${roMatch("R16_7","1E","2D",       get("R16_7_A"), get("R16_7_B"), win("R16_7"))}
          ${roMatch("R16_8","1C","3A/3B/3F", get("R16_8_A"), get("R16_8_B"), win("R16_8"))}
        </div>
      </div>
    </div>

    <div class="round">
      <h2>Quarts <span class="badge red">4</span></h2>
      ${roMatch("QF_1","—","—", get("QF_1_A"), get("QF_1_B"), win("QF_1"))}
      ${roMatch("QF_2","—","—", get("QF_2_A"), get("QF_2_B"), win("QF_2"))}
      ${roMatch("QF_3","—","—", get("QF_3_A"), get("QF_3_B"), win("QF_3"))}
      ${roMatch("QF_4","—","—", get("QF_4_A"), get("QF_4_B"), win("QF_4"))}
    </div>

    <div class="round">
      <h2>Demi-finales <span class="badge red">2</span></h2>
      ${roMatch("SF_1","—","—", get("SF_1_A"), get("SF_1_B"), win("SF_1"))}
      ${roMatch("SF_2","—","—", get("SF_2_A"), get("SF_2_B"), win("SF_2"))}
    </div>

    <div class="round">
      <h2>Finale <span class="badge green">🏆</span></h2>
      ${roMatch("F","—","—", get("F_A"), get("F_B"), win("F"))}
    </div>

    <div class="round">
      <h2>3e place <span class="badge yellow">🥉</span></h2>
      ${roMatch("TP","—","—", get("TP_A"), get("TP_B"), win("TP"))}
    </div>
  `;
}

async function loadList() {
  const r = await fetch("/api/predictions");
  const rows = await r.json();

  const list = document.getElementById("list");
  if (!rows.length) {
    list.innerHTML = `<div class="notice">Aucun prono pour le moment.</div>`;
    return;
  }

  list.innerHTML = rows.map(x => {
    const dt = new Date(x.created_at).toLocaleString();
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border:1px solid #d5d2c9; border-radius:10px; margin-bottom:10px; background:#fff;">
        <div>
          <div style="font-weight:900;">${escapeHtml(x.username)}</div>
          <div class="notice">${escapeHtml(dt)}</div>
        </div>
        <button class="primary" data-id="${x.id}">Voir</button>
      </div>
    `;
  }).join("");

  list.querySelectorAll("button[data-id]").forEach(btn => {
    btn.onclick = () => showDetail(btn.getAttribute("data-id"));
  });

  const hash = location.hash || "";
  const m = hash.match(/id=(\d+)/);
  if (m) showDetail(m[1]);
}

async function showDetail(id) {
  const r = await fetch(`/api/predictions/${id}`);
  if (!r.ok) return;
  const data = await r.json();

  document.getElementById("detail").innerHTML =
    `<div><b>${escapeHtml(data.username)}</b> — ${escapeHtml(new Date(data.created_at).toLocaleString())}</div>`;

  const root = document.getElementById("bracketRoot");
  renderReadOnlyBracket(root, data.payload);
}

loadList();
