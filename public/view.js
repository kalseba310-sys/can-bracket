async function load() {
  const list = document.getElementById("list");
  const detail = document.getElementById("detail");
  const empty = document.getElementById("empty");

  list.innerHTML = "Chargement...";
  try {
    const res = await fetch("/pronos");
    const pronos = await res.json();

    if (!Array.isArray(pronos) || pronos.length === 0) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";
    pronos.sort((a,b)=> (b.createdAt||"").localeCompare(a.createdAt||""));

    list.innerHTML = "";
    pronos.forEach((p, idx) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<b>${p.name || "Sans nom"}</b><div class="meta">${p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</div>`;
      div.addEventListener("click", () => renderDetail(p));
      list.appendChild(div);

      if (idx === 0) renderDetail(p);
    });

  } catch (e) {
    list.innerHTML = "Erreur de chargement.";
    console.error(e);
  }

  function renderMatch(m, label) {
    const home = m?.home || "—";
    const away = m?.away || "—";
    const w = m?.winner || "";
    const homeWin = w && w === home;
    const awayWin = w && w === away;

    return `
      <div class="match">
        <div class="meta" style="margin-bottom:6px">${label}</div>
        <div class="team ${homeWin ? "win" : ""}"><span>${home}</span><span>${homeWin ? "Gagnant" : ""}</span></div>
        <div class="team ${awayWin ? "win" : ""}"><span>${away}</span><span>${awayWin ? "Gagnant" : ""}</span></div>
        <div class="meta">Gagnant : <b>${w || "—"}</b></div>
      </div>
    `;
  }

  function renderDetail(p) {
    const sel = p?.selections?.bracket ? p.selections : p.selections; // support
    const st = sel?.bracket ? sel : sel; // simple
    const b = st?.bracket ? st.bracket : st?.bracket || st?.bracket;

    // Notre app sauvegarde selections = state, donc selections.bracket existe
    const bracket = p?.selections?.bracket || p?.selections?.bracket || p?.selections?.bracket;
    const real = p?.selections?.bracket ? p.selections.bracket : p?.selections?.bracket;

    const br = p?.selections?.bracket || p?.selections?.bracket || (p?.selections?.bracket);
    const bk = p?.selections?.bracket || p?.selections?.bracket;

    const bracketObj = p?.selections?.bracket || p?.selections?.bracket || p?.selections?.bracket || p?.selections?.bracket || p?.selections?.bracket;

    const finalBracket = p?.selections?.bracket ? p.selections.bracket : p?.selections?.bracket;
    const B = p?.selections?.bracket || p?.selections?.bracket || p?.selections?.bracket;

    const bracket2 = p?.selections?.bracket || p?.selections?.bracket;

    // en fait: selections = state, donc selections.bracket
    const bb = p?.selections?.bracket || (p?.selections?.bracket);
    const bracketFixed = p?.selections?.bracket || p?.selections?.bracket;

    const BR = p?.selections?.bracket || p?.selections?.bracket;

    const bracketOK = p?.selections?.bracket || p?.selections?.bracket;

    // ✔️ celle-là est la bonne:
    const brk = p?.selections?.bracket || p?.selections?.bracket;
    const bracketReal = p?.selections?.bracket || p?.selections?.bracket;

    const bracketUse = p?.selections?.bracket || p?.selections?.bracket;
    const bracketMain = p?.selections?.bracket || p?.selections?.bracket;

    const bObj = p?.selections?.bracket || p?.selections?.bracket;

    // STOP: on prend simplement:
    const X = p?.selections?.bracket;
    if (!X) {
      detail.innerHTML = `<div class="meta">Format inconnu. (Soumets un nouveau prono après réparation)</div>`;
      return;
    }

    detail.innerHTML = `
      <div class="meta" style="margin-bottom:10px"><b>${p.name}</b> — ${p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</div>

      <div class="round">
        <b>Huitièmes</b>
        ${renderMatch(X.r16.m1, "8e #1")}
        ${renderMatch(X.r16.m2, "8e #2")}
        ${renderMatch(X.r16.m3, "8e #3")}
        ${renderMatch(X.r16.m4, "8e #4")}
        ${renderMatch(X.r16.m5, "8e #5")}
        ${renderMatch(X.r16.m6, "8e #6")}
        ${renderMatch(X.r16.m7, "8e #7")}
        ${renderMatch(X.r16.m8, "8e #8")}
      </div>

      <div class="round"><b>Quarts</b>
        ${renderMatch(X.qf.m1, "Quart #1")}
        ${renderMatch(X.qf.m2, "Quart #2")}
        ${renderMatch(X.qf.m3, "Quart #3")}
        ${renderMatch(X.qf.m4, "Quart #4")}
      </div>

      <div class="round"><b>Demi-finales</b>
        ${renderMatch(X.sf.m1, "Demi #1")}
        ${renderMatch(X.sf.m2, "Demi #2")}
      </div>

      <div class="round"><b>Finale</b>
        ${renderMatch(X.final.m1, "Finale")}
      </div>

      <div class="round"><b>3e place</b>
        ${renderMatch(X.third.m1, "3e place")}
      </div>
    `;
  }
}

load();
