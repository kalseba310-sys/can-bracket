function getAllPicks() {
  // On prend tous les <select> de la page comme "choix"
  const selects = Array.from(document.querySelectorAll("select"));

  const picks = {};
  for (const sel of selects) {
    const key = sel.id || sel.name || `select_${Math.random().toString(16).slice(2)}`;
    picks[key] = sel.value ?? "";
  }
  return picks;
}

function resetAll() {
  document.querySelectorAll("select").forEach((s) => {
    s.selectedIndex = 0;
  });
}

async function saveProno() {
  try {
    // Si tu as un input nom, il sera utilisé. Sinon on demande.
    const nameInput = document.querySelector("#name");
    let name = nameInput ? nameInput.value.trim() : "";

    if (!name) {
      name = prompt("Ton nom ?")?.trim() || "";
    }
    if (!name) {
      alert("Nom requis");
      return;
    }

    const picks = getAllPicks();

    const res = await fetch("/api/pronos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, picks })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erreur HTTP ${res.status}`);
    }

    const data = await res.json();
    alert("✅ Enregistré !");
    console.log("Saved:", data);
  } catch (e) {
    console.error(e);
    alert("Erreur");
  }
}

function wireUI() {
  // Bouton sauvegarder : on essaye plusieurs ids possibles
  const saveBtn =
    document.querySelector("#saveBtn") ||
    document.querySelector("#save") ||
    document.querySelector('[data-action="save"]');

  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      saveProno();
    });
  }

  // Bouton reset : on essaye plusieurs ids possibles
  const resetBtn =
    document.querySelector("#resetBtn") ||
    document.querySelector("#reset") ||
    document.querySelector('[data-action="reset"]') ||
    Array.from(document.querySelectorAll("button")).find((b) =>
      (b.textContent || "").toLowerCase().includes("réinitialiser")
    );

  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetAll();
    });
  }
}

document.addEventListener("DOMContentLoaded", wireUI);
