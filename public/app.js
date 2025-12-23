/* public/app.js
   Bracket CAN 2025 (8e -> Finale + 3e place)
   - Génère tout le tableau
   - Propagation automatique des gagnants
   - Boutons Réinitialiser / Soumettre (POST /submit si tu as l’API)
*/

(() => {
  // ---------- Helpers DOM ----------
  const $ = (sel) => document.querySelector(sel);

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    return node;
  }

  function setOptions(select, values, placeholder = "—") {
    select.innerHTML = "";
    select.appendChild(el("option", { value: "", text: placeholder }));
    values.forEach((v) => select.appendChild(el("option", { value: v, text: v })));
  }

  // ---------- Données (comme ton screenshot : codes de groupes) ----------
  const initialR16 = [
    { id: "r16_1", a: "1D", b: "3B/3E/3F", winnerSlot: "qf_1_a" },
    { id: "r16_2", a: "2A", b: "2C", winnerSlot: "qf_1_b" },
    { id: "r16_3", a: "1A", b: "3C/3D/3E", winnerSlot: "qf_2_a" },
    { id: "r16_4", a: "2B", b: "2F", winnerSlot: "qf_2_b" },
    { id: "r16_5", a: "1B", b: "3A/3C/3D", winnerSlot: "qf_3_a" },
    { id: "r16_6", a: "1F", b: "2E", winnerSlot: "qf_3_b" },
    { id: "r16_7", a: "1E", b: "2D", winnerSlot: "qf_4_a" },
    { id: "r16_8", a: "1C", b: "3A/3B/3F", winnerSlot: "qf_4_b" },
  ];

  // Les “slots” suivants sont des emplacements à remplir automatiquement
  const slots = {
    // Quarts (4 matchs)
    qf_1_a: "", qf_1_b: "", qf_1_w: "sf_1_a",
    qf_2_a: "", qf_2_b: "", qf_2_w: "sf_1_b",
    qf_3_a: "", qf_3_b: "", qf_3_w: "sf_2_a",
    qf_4_a: "", qf_4_b: "", qf_4_w: "sf_2_b",

    // Demis (2 matchs)
    sf_1_a: "", sf_1_b: "", sf_1_w: "final_a", sf_1_l: "third_a",
    sf_2_a: "", sf_2_b: "", sf_2_w: "final_b", sf_2_l: "third_b",

    // Finale + 3e place
    final_a: "", final_b: "", final_w: "champion",
    third_a: "", third_b: "", third_w: "third",
    champion: "",
    third: "",
  };

  // ---------- Persistance locale (pour ne pas perdre si refresh) ----------
  const STORAGE_KEY = "can_bracket_v1";

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function clearState() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---------- UI : trouve les éléments existants ----------
  function getNameInput() {
    // essaie plusieurs ids au cas où
    return $("#name") || $("#nom") || $('input[type="text"]');
  }

  function ensureBracketRoot() {
    // si tu as déjà <div id="bracket"> tant mieux
    let root = $("#bracket");
    if (!root) {
      // sinon on insère un root juste après le bloc du nom si possible
      root = el("div", { id: "bracket" });
      const container = $(".container") || document.body;
      container.appendChild(root);
    }
    return root;
  }

  function ensureButtons() {
    // si tu as déjà tes boutons dans le HTML, on les récupère
    const resetBtn =
      $("#resetBtn") ||
      [...document.querySelectorAll("button")].find((b) => /réinitialiser/i.test(b.textContent)) ||
      null;

    const submitBtn =
      $("#submitBtn") ||
      [...document.querySelectorAll("button")].find((b) => /soumettre/i.test(b.textContent)) ||
      null;

    return { resetBtn, submitBtn };
  }

  // ---------- Construction des cartes ----------
  function matchCard(title, rows) {
    return el("div", { class: "match-card" }, [
      el("div", { class: "match-title", text: title }),
      ...rows,
    ]);
  }

  function row(label, select) {
    return el("div", { class: "row" }, [
      el("div", { class: "row-label", text: label }),
      select,
    ]);
  }

  function createSelect(id) {
    const s = el("select", { "data-slot": id });
    return s;
  }

  // ---------- Rendu complet ----------
  function render() {
    const root = ensureBracketRoot();
    root.innerHTML = "";

    // Ajout d’un petit CSS minimal si ton styles.css ne l’a plus
    injectMiniCSS();

    const r16Section = el("section", { class: "section" }, [
      headerLine("Huitièmes", "8 matchs"),
    ]);

    // R16 cards
    initialR16.forEach((m, idx) => {
      const winnerSel = createSelect(m.id + "_w");

      // options = {a,b}
      setOptions(winnerSel, [m.a, m.b]);

      winnerSel.addEventListener("change", () => {
        const winner = winnerSel.value || "";
        // remplir le slot du quart correspondant
        slots[m.winnerSlot] = winner;

        // Si on efface un gagnant, il faut aussi nettoyer la suite
        cleanupDownstream();
        fillNextOptionsAndValues();
        saveCurrentState();
      });

      const card = matchCard(`8e #${idx + 1}`, [
        row(m.a, staticSelectLike(m.a)),
        row(m.b, staticSelectLike(m.b)),
        row("Gagnant", winnerSel),
      ]);

      r16Section.appendChild(card);
    });

    const qfSection = el("section", { class: "section" }, [
      headerLine("Quarts", "4 matchs"),
    ]);

    // Quarts
    const qf = [
      { id: "qf_1", a: "qf_1_a", b: "qf_1_b", w: "qf_1_w", title: "Quart #1", labelA: "Gagnant R16_1", labelB: "Gagnant R16_2" },
      { id: "qf_2", a: "qf_2_a", b: "qf_2_b", w: "qf_2_w", title: "Quart #2", labelA: "Gagnant R16_3", labelB: "Gagnant R16_4" },
      { id: "qf_3", a: "qf_3_a", b: "qf_3_b", w: "qf_3_w", title: "Quart #3", labelA: "Gagnant R16_5", labelB: "Gagnant R16_6" },
      { id: "qf_4", a: "qf_4_a", b: "qf_4_b", w: "qf_4_w", title: "Quart #4", labelA: "Gagnant R16_7", labelB: "Gagnant R16_8" },
    ];

    qf.forEach((m) => {
      const aSel = createSelect(m.a);
      const bSel = createSelect(m.b);
      const wSel = createSelect(m.id + "_w");

      // aSel/bSel sont “verrouillés” (on affiche mais pas modifiable)
      aSel.disabled = true;
      bSel.disabled = true;

      wSel.addEventListener("change", () => {
        const winner = wSel.value || "";
        // vers demis
        slots[slots[m.w]] = winner; // m.w contient la clé ex qf_1_w => "sf_1_a"
        cleanupDownstream();
        fillNextOptionsAndValues();
        saveCurrentState();
      });

      const card = matchCard(m.title, [
        row(m.labelA, aSel),
        row(m.labelB, bSel),
        row("Gagnant", wSel),
      ]);
      qfSection.appendChild(card);
    });

    const sfSection = el("section", { class: "section" }, [
      headerLine("Demi-finales", "2 matchs"),
    ]);

    const sf = [
      { id: "sf_1", a: "sf_1_a", b: "sf_1_b", w: "sf_1_w", l: "sf_1_l", title: "Demi #1", labelA: "Gagnant QF_1", labelB: "Gagnant QF_2" },
      { id: "sf_2", a: "sf_2_a", b: "sf_2_b", w: "sf_2_w", l: "sf_2_l", title: "Demi #2", labelA: "Gagnant QF_3", labelB: "Gagnant QF_4" },
    ];

    sf.forEach((m) => {
      const aSel = createSelect(m.a);
      const bSel = createSelect(m.b);
      aSel.disabled = true;
      bSel.disabled = true;

      const wSel = createSelect(m.id + "_w");

      wSel.addEventListener("change", () => {
        const winner = wSel.value || "";
        const loser = winner ? (winner === slots[m.a] ? slots[m.b] : slots[m.a]) : "";

        slots[slots[m.w]] = winner; // final_a / final_b
        slots[slots[m.l]] = loser;  // third_a / third_b

        cleanupDownstream();
        fillNextOptionsAndValues();
        saveCurrentState();
      });

      const card = matchCard(m.title, [
        row(m.labelA, aSel),
        row(m.labelB, bSel),
        row("Gagnant", wSel),
      ]);
      sfSection.appendChild(card);
    });

    const finalSection = el("section", { class: "section" }, [
      headerLine("Finale + 3e place", "2 matchs"),
    ]);

    // Finale
    const finalA = createSelect("final_a");
    const finalB = createSelect("final_b");
    finalA.disabled = true;
    finalB.disabled = true;

    const finalW = createSelect("final_winner");
    finalW.addEventListener("change", () => {
      slots.champion = finalW.value || "";
      saveCurrentState();
    });

    const finalCard = matchCard("Finale", [
      row("Finaliste A", finalA),
      row("Finaliste B", finalB),
      row("Champion", finalW),
    ]);

    // 3e place
    const thirdA = createSelect("third_a");
    const thirdB = createSelect("third_b");
    thirdA.disabled = true;
    thirdB.disabled = true;

    const thirdW = createSelect("third_winner");
    thirdW.addEventListener("change", () => {
      slots.third = thirdW.value || "";
      saveCurrentState();
    });

    const thirdCard = matchCard("3e place", [
      row("Équipe A", thirdA),
      row("Équipe B", thirdB),
      row("3e", thirdW),
    ]);

    finalSection.appendChild(finalCard);
    finalSection.appendChild(thirdCard);

    root.appendChild(r16Section);
    root.appendChild(qfSection);
    root.appendChild(sfSection);
    root.appendChild(finalSection);

    // Restaurer un ancien état si présent
    restoreStateIntoUI();

    // Remplir tous les selects dépendants
    fillNextOptionsAndValues();

    // boutons
    hookButtons();
  }

  function headerLine(title, badgeText) {
    return el("div", { class: "section-header" }, [
      el("h2", { class: "section-title", text: title }),
      el("span", { class: "badge", text: badgeText }),
    ]);
  }

  function staticSelectLike(textValue) {
    const s = el("select", {});
    setOptions(s, [textValue], textValue);
    s.value = textValue;
    s.disabled = true;
    return s;
  }

  // ---------- Remplissage dynamique des tours suivants ----------
  function fillNextOptionsAndValues() {
    // Quarts A/B (verrouillés)
    setLockedSlot("qf_1_a");
    setLockedSlot("qf_1_b");
    setLockedSlot("qf_2_a");
    setLockedSlot("qf_2_b");
    setLockedSlot("qf_3_a");
    setLockedSlot("qf_3_b");
    setLockedSlot("qf_4_a");
    setLockedSlot("qf_4_b");

    // Winner selects QF
    setWinnerSelect("qf_1_w", ["qf_1_a", "qf_1_b"], "qf_1_winner");
    setWinnerSelect("qf_2_w", ["qf_2_a", "qf_2_b"], "qf_2_winner");
    setWinnerSelect("qf_3_w", ["qf_3_a", "qf_3_b"], "qf_3_winner");
    setWinnerSelect("qf_4_w", ["qf_4_a", "qf_4_b"], "qf_4_winner");

    // Demis A/B
    setLockedSlot("sf_1_a");
    setLockedSlot("sf_1_b");
    setLockedSlot("sf_2_a");
    setLockedSlot("sf_2_b");

    // Winner selects SF
    setWinnerSelect("sf_1_w", ["sf_1_a", "sf_1_b"], "sf_1_winner");
    setWinnerSelect("sf_2_w", ["sf_2_a", "sf_2_b"], "sf_2_winner");

    // Finale / 3e
    setLockedSlot("final_a");
    setLockedSlot("final_b");
    setLockedSlot("third_a");
    setLockedSlot("third_b");

    // Winner finale / 3e
    const finalTeams = [slots.final_a, slots.final_b].filter(Boolean);
    const finalW = document.querySelector('[data-slot="final_winner"]');
    if (finalW) {
      setOptions(finalW, finalTeams);
      if (slots.champion && finalTeams.includes(slots.champion)) finalW.value = slots.champion;
      else finalW.value = "";
    }

    const thirdTeams = [slots.third_a, slots.third_b].filter(Boolean);
    const thirdW = document.querySelector('[data-slot="third_winner"]');
    if (thirdW) {
      setOptions(thirdW, thirdTeams);
      if (slots.third && thirdTeams.includes(slots.third)) thirdW.value = slots.third;
      else thirdW.value = "";
    }
  }

  function setLockedSlot(slotKey) {
    const s = document.querySelector(`[data-slot="${slotKey}"]`);
    if (!s) return;
    const v = slots[slotKey] || "";
    setOptions(s, v ? [v] : [], "—");
    s.value = v || "";
  }

  function setWinnerSelect(slotKey, teamSlots, dataKey) {
    // slotKey ex: qf_1_w (dans slots c’est "sf_1_a")
    // teamSlots ex: ["qf_1_a", "qf_1_b"]
    // dataKey ex: qf_1_winner (clé sauvegarde)
    const teams = teamSlots.map((k) => slots[k]).filter(Boolean);

    // l’élément winner select dans le DOM n’a pas forcément data-slot=slotKey
    // ici on a créé avec id suffix "_w" => data-slot = "qf_1_w_w"
    const domWinner = document.querySelector(`[data-slot="${slotKey}_w"]`) || document.querySelector(`[data-slot="${slotKey}"]`);
    // Dans notre render, on l’a créé comme `${id}_w` ex "qf_1_w" => "qf_1_w"
    const wSel = document.querySelector(`[data-slot="${slotKey.replace("_w", "")}_w"]`) || document.querySelector(`[data-slot="${slotKey}"]`);
    const target = wSel || domWinner;

    if (!target) return;

    setOptions(target, teams);
    const saved = (getSavedState()?.winners || {})[dataKey];
    if (saved && teams.includes(saved)) target.value = saved;
    else if (target.value && !teams.includes(target.value)) target.value = "";
  }

  // ---------- Nettoyage quand on change un match en amont ----------
  function cleanupDownstream() {
    // Si on casse un R16, on doit vider tout ce qui dépend
    // On vide les slots “calculés” à partir des quarts/demis/finale
    const toReset = [
      "sf_1_a", "sf_1_b", "sf_2_a", "sf_2_b",
      "final_a", "final_b", "third_a", "third_b",
      "champion", "third",
    ];
    // NB: qf_*_a/_b sont remplis par R16, donc on ne les vide pas ici
    // sf/finale seront recalculés via choix gagnants
    toReset.forEach((k) => (slots[k] = slots[k] || ""));
  }

  // ---------- Sauvegarde / restauration ----------
  function getSavedState() {
    return loadState();
  }

  function saveCurrentState() {
    const name = getNameInput()?.value?.trim() || "";

    // récupère tous les gagnants sélectionnés
    const winners = {};
    const allSelects = [...document.querySelectorAll("select")];

    // R16 winners
    initialR16.forEach((m) => {
      const s = document.querySelector(`[data-slot="${m.id}_w"]`) || document.querySelector(`[data-slot="${m.id + "_w"}"]`);
      // Dans notre render, le select est créé avec id `${m.id}_w`
      const rSel = document.querySelector(`[data-slot="${m.id}_w"]`);
      winners[m.id] = rSel ? (rSel.value || "") : "";
    });

    // QF + SF + Finale + 3e
    winners.qf_1 = document.querySelector('[data-slot="qf_1_w"]')?.value || "";
    winners.qf_2 = document.querySelector('[data-slot="qf_2_w"]')?.value || "";
    winners.qf_3 = document.querySelector('[data-slot="qf_3_w"]')?.value || "";
    winners.qf_4 = document.querySelector('[data-slot="qf_4_w"]')?.value || "";
    winners.sf_1 = document.querySelector('[data-slot="sf_1_w"]')?.value || "";
    winners.sf_2 = document.querySelector('[data-slot="sf_2_w"]')?.value || "";
    winners.champion = document.querySelector('[data-slot="final_winner"]')?.value || "";
    winners.third = document.querySelector('[data-slot="third_winner"]')?.value || "";

    saveState({ name, slots, winners });
  }

  function restoreStateIntoUI() {
    const state = getSavedState();
    if (!state) return;

    const nameInput = getNameInput();
    if (nameInput && state.name) nameInput.value = state.name;

    // restore slots (safe merge)
    if (state.slots && typeof state.slots === "object") {
      for (const [k, v] of Object.entries(state.slots)) {
        if (k in slots) slots[k] = v || "";
      }
    }

    // restore R16 winners
    if (state.winners && typeof state.winners === "object") {
      initialR16.forEach((m) => {
        const sel = document.querySelector(`[data-slot="${m.id}_w"]`);
        if (sel && state.winners[m.id]) sel.value = state.winners[m.id];
        if (state.winners[m.id]) slots[m.winnerSlot] = state.winners[m.id];
      });
    }
  }

  // ---------- Boutons ----------
  function hookButtons() {
    const { resetBtn, submitBtn } = ensureButtons();

    if (resetBtn) {
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearState();
        // reload propre
        location.reload();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const name = getNameInput()?.value?.trim();
        if (!name) {
          alert("Entre ton nom d'abord 🙂");
          return;
        }

        // payload complet
        const payload = {
          name,
          selections: loadState() || { name, slots, winners: {} },
        };

        // Si tu as une API côté serveur (recommandé), tu peux recevoir ça :
        // POST /submit  (JSON)
        try {
          const res = await fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error("HTTP " + res.status);
          alert("✅ Prono enregistré !");
        } catch (err) {
          // Au moins ne casse pas l’UI
          console.log(err);
          alert("Erreur (API /submit non trouvée ou serveur). Ton prono est quand même gardé dans ton navigateur.");
        }
      });
    }
  }

  // ---------- CSS mini (si jamais styles.css est cassé) ----------
  function injectMiniCSS() {
    if ($("#miniBracketCSS")) return;
    const css = `
      #bracket { margin-top: 18px; }
      .section { margin: 16px 0; }
      .section-header { display:flex; align-items:center; justify-content:space-between; margin: 10px 0; }
      .section-title { margin:0; font-size: 16px; }
      .badge { background:#7b1f2a; color:#fff; padding:4px 10px; border-radius:999px; font-size:12px; }
      .match-card { border:1px solid #e8e8e8; border-radius:12px; padding:12px; margin:10px 0; background:#fff; }
      .match-title { font-weight:600; margin-bottom:8px; }
      .row { display:flex; align-items:center; justify-content:space-between; gap:10px; margin:8px 0; }
      .row-label { font-size:13px; color:#333; }
      select { width: 170px; max-width: 100%; padding:8px; border-radius:10px; border:1px solid #ddd; background:#fff; }
      @media (min-width: 800px) {
        .section { display:block; }
        .section .match-card { max-width: 520px; }
      }
    `;
    const style = el("style", { id: "miniBracketCSS" }, [css]);
    document.head.appendChild(style);
  }

  // ---------- Start ----------
  document.addEventListener("DOMContentLoaded", () => {
    render();
    // sauvegarde quand on tape le nom
    const nameInput = getNameInput();
    if (nameInput) {
      nameInput.addEventListener("input", () => saveCurrentState());
    }
  });
})();
