const TEAMS = [
  // Group A
  "Maroc","Mali","Zambie","Comores",
  // Group B
  "Égypte","Afrique du Sud","Angola","Zimbabwe",
  // Group C
  "Nigeria","Tunisie","Ouganda","Tanzanie",
  // Group D
  "Sénégal","RD Congo","Bénin","Botswana",
  // Group E
  "Algérie","Burkina Faso","Guinée équatoriale","Soudan",
  // Group F
  "Côte d’Ivoire","Cameroun","Gabon","Mozambique"
];

const EMPTY = "—";

/**
 * Bracket model (mapping winners -> next round slots)
 * Slots are stored in state.slots:
 *  - e.g. "R16_1_A" is team A of round-of-16 match 1
 * Winners are stored in state.winners:
 *  - e.g. "R16_1" is winner of that match
 */
const MODEL = {
  r16: [
    { id:"R16_1", seedA:"1D", seedB:"3B/3E/3F", next:"QF_1_A" },
    { id:"R16_2", seedA:"2A", seedB:"2C",       next:"QF_1_B" },
    { id:"R16_3", seedA:"1A", seedB:"3C/3D/3E", next:"QF_2_A" },
    { id:"R16_4", seedA:"2B", seedB:"2F",       next:"QF_2_B" },

    { id:"R16_5", seedA:"1B", seedB:"3A/3C/3D", next:"QF_3_A" },
    { id:"R16_6", seedA:"1F", seedB:"2E",       next:"QF_3_B" },
    { id:"R16_7", seedA:"1E", seedB:"2D",       next:"QF_4_A" },
    { id:"R16_8", seedA:"1C", seedB:"3A/3B/3F", next:"QF_4_B" }
  ],
  qf: [
    { id:"QF_1", seedA:"Gagnant R16_1", seedB:"Gagnant R16_2", next:"SF_1_A" },
    { id:"QF_2", seedA:"Gagnant R16_3", seedB:"Gagnant R16_4", next:"SF_1_B" },
    { id:"QF_3", seedA:"Gagnant R16_5", seedB:"Gagnant R16_6", next:"SF_2_A" },
    { id:"QF_4", seedA:"Gagnant R16_7", seedB:"Gagnant R16_8", next:"SF_2_B" }
  ],
  sf: [
    { id:"SF_1", seedA:"Gagnant QF_1", seedB:"Gagnant QF_2", next:"F_A", loserNext:"TP_A" },
    { id:"SF_2", seedA:"Gagnant QF_3", seedB:"Gagnant QF_4", next:"F_B", loserNext:"TP_B" }
  ],
  final: [
    { id:"F", seedA:"Gagnant SF_1", seedB:"Gagnant SF_2" }
  ],
  thirdPlace: [
    { id:"TP", seedA:"Perdant SF_1", seedB:"Perdant SF_2" }
  ]
};

const state = {
  slots: {},
  winners: {}
};

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function optionHTML(selected) {
  const opts = [EMPTY, ...TEAMS].map(t => {
    const sel = t === selected ? "selected" : "";
    return `<option value="${escapeHtml(t)}" ${sel}>${escapeHtml(t)}</option>`;
  });
  return opts.join("");
}

function matchCard(roundKey, match, slotAId, slotBId, winnerId, title) {
  const a = state.slots[slotAId] ?? EMPTY;
  const b = state.slots[slotBId] ?? EMPTY;
  const currentWinner = state.winners[match.id] ?? EMPTY;

  const winnerChoices = [EMPTY, a, b].filter((v, i, arr) => arr.indexOf(v) === i);

  return `
    <div class="match" data-round="${roundKey}" data-match="${match.id}">
      <div class="title">${escapeHtml(title)}</div>

      <div class="slot">
        <div class="seed">${escapeHtml(match.seedA)}</div>
        <select data-slot="${slotAId}">
          ${optionHTML(a)}
        </select>
      </div>

      <div class="slot">
        <div class="seed">${escapeHtml(match.seedB)}</div>
        <select data-slot="${slotBId}">
          ${optionHTML(b)}
        </select>
      </div>

      <div class="slot" style="margin-top:10px;">
        <div class="seed">Gagnant</div>
        <select data-winner="${winnerId}">
          ${winnerChoices.map(t => {
            const sel = t === currentWinner ? "selected" : "";
            return `<option value="${escapeHtml(t)}" ${sel}>${escapeHtml(t)}</option>`;
          }).join("")}
        </select>
      </div>
    </div>
  `;
}

function render() {
  const root = document.getElementById("bracketRoot");
  root.innerHTML = `
    <div class="round">
      <h2>Huitièmes <span class="badge red">8 matchs</span></h2>
      <div class="split">
        <div>
          ${matchCard("r16", MODEL.r16[0], "R16_1_A","R16_1_B","R16_1_W","8e #1")}
          ${matchCard("r16", MODEL.r16[1], "R16_2_A","R16_2_B","R16_2_W","8e #2")}
          ${matchCard("r16", MODEL.r16[2], "R16_3_A","R16_3_B","R16_3_W","8e #3")}
          ${matchCard("r16", MODEL.r16[3], "R16_4_A","R16_4_B","R16_4_W","8e #4")}
        </div>
        <div>
          ${matchCard("r16", MODEL.r16[4], "R16_5_A","R16_5_B","R16_5_W","8e #5")}
          ${matchCard("r16", MODEL.r16[5], "R16_6_A","R16_6_B","R16_6_W","8e #6")}
          ${matchCard("r16", MODEL.r16[6], "R16_7_A","R16_7_B","R16_7_W","8e #7")}
          ${matchCard("r16", MODEL.r16[7], "R16_8_A","R16_8_B","R16_8_W","8e #8")}
        </div>
      </div>
    </div>

    <div class="round">
      <h2>Quarts <span class="badge red">4 matchs</span></h2>
      ${matchCard("qf", MODEL.qf[0], "QF_1_A","QF_1_B","QF_1_W","Quart #1")}
      ${matchCard("qf", MODEL.qf[1], "QF_2_A","QF_2_B","QF_2_W","Quart #2")}
      ${matchCard("qf", MODEL.qf[2], "QF_3_A","QF_3_B","QF_3_W","Quart #3")}
      ${matchCard("qf", MODEL.qf[3], "QF_4_A","QF_4_B","QF_4_W","Quart #4")}
    </div>

    <div class="round">
      <h2>Demi-finales <span class="badge red">2 matchs</span></h2>
      ${matchCard("sf", MODEL.sf[0], "SF_1_A","SF_1_B","SF_1_W","Demi #1")}
      ${matchCard("sf", MODEL.sf[1], "SF_2_A","SF_2_B","SF_2_W","Demi #2")}
    </div>

    <div class="round">
      <h2>Finale <span class="badge green">🏆</span></h2>
      ${matchCard("final", MODEL.final[0], "F_A","F_B","F_W","Finale")}
    </div>

    <div class="round">
      <h2>3e place <span class="badge yellow">🥉</span></h2>
      ${matchCard("third", MODEL.thirdPlace[0], "TP_A","TP_B","TP_W","Match 3e place")}
    </div>
  `;

  wireEvents();
}

function setSlot(slotId, team) {
  state.slots[slotId] = team;
}

function setWinner(matchId, team) {
  state.winners[matchId] = team;
}

function computeLoser(teamA, teamB, winner) {
  if (!teamA || !teamB) return EMPTY;
  if (winner === teamA) return teamB;
  if (winner === teamB) return teamA;
  return EMPTY;
}

function propagate() {
  // R16 -> QF
  MODEL.r16.forEach((m) => {
    const w = state.winners[m.id] ?? EMPTY;
    if (w && w !== EMPTY) state.slots[m.next] = w;
  });

  // QF -> SF
  MODEL.qf.forEach((m) => {
    const w = state.winners[m.id] ?? EMPTY;
    if (w && w !== EMPTY) state.slots[m.next] = w;
  });

  // SF -> Final + Third place slots (losers)
  MODEL.sf.forEach((m) => {
    const teamA = state.slots[`${m.id}_A`] ?? EMPTY;
    const teamB = state.slots[`${m.id}_B`] ?? EMPTY;
    const winner = state.winners[m.id] ?? EMPTY;

    if (winner && winner !== EMPTY) {
      state.slots[m.next] = winner;
      const loser = computeLoser(teamA, teamB, winner);
      if (loser && loser !== EMPTY) state.slots[m.loserNext] = loser;
    }
  });
}

function refreshWinnerSelect(matchEl) {
  const matchId = matchEl.getAttribute("data-match");
  const slotSelects = matchEl.querySelectorAll("select[data-slot]");
  const a = slotSelects[0].value;
  const b = slotSelects[1].value;

  const winnerSel = matchEl.querySelector("select[data-winner]");
  const current = winnerSel.value;

  const choices = [EMPTY, a, b].filter((v,i,arr)=>arr.indexOf(v)===i);
  winnerSel.innerHTML = choices.map(t => {
    const sel = t === current ? "selected" : "";
    return `<option value="${escapeHtml(t)}" ${sel}>${escapeHtml(t)}</option>`;
  }).join("");

  if (!choices.includes(current)) {
    winnerSel.value = EMPTY;
    setWinner(matchId, EMPTY);
  } else {
    setWinner(matchId, winnerSel.value);
  }
}

function wireEvents() {
  document.querySelectorAll("select[data-slot]").forEach(sel => {
    sel.addEventListener("change", () => {
      const slotId = sel.getAttribute("data-slot");
      setSlot(slotId, sel.value);

      const matchEl = sel.closest(".match");
      refreshWinnerSelect(matchEl);

      propagate();
      render();
    });
  });

  document.querySelectorAll("select[data-winner]").forEach(sel => {
    sel.addEventListener("change", () => {
      const matchEl = sel.closest(".match");
      const matchId = matchEl.getAttribute("data-match");
      setWinner(matchId, sel.value);

      propagate();
      render();
    });
  });

  document.getElementById("btnReset").onclick = () => {
    state.slots = {};
    state.winners = {};
    render();
  };

  document.getElementById("btnSubmit").onclick = async () => {
    const username = document.getElementById("username").value.trim();
    if (!username) {
      alert("Entre ton nom.");
      return;
    }

    const payload = { slots: state.slots, winners: state.winners };

    const r = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ username, payload })
    });

    if (!r.ok) {
      const e = await r.json().catch(()=>({error:"Erreur"}));
      alert(e.error || "Erreur");
      return;
    }

    const data = await r.json();
    alert("✅ Prono enregistré !");
    window.location.href = `./view.html#id=${data.id}`;
  };
}

render();
