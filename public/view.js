const listEl = document.getElementById("list");
const detailEl = document.getElementById("detail");

async function loadPronos() {
  try {
    const res = await fetch("/pronos");
    if (!res.ok) throw new Error("Erreur API");

    const pronos = await res.json();

    if (!Array.isArray(pronos) || pronos.length === 0) {
      listEl.innerHTML = `<p class="empty">Aucun prono pour le moment.</p>`;
      return;
    }

    listEl.innerHTML = "";

    pronos.forEach((prono, index) => {
      const btn = document.createElement("button");
      btn.textContent = prono.name || `Anonyme #${index + 1}`;

      btn.onclick = () => {
        showDetail(prono);
      };

      listEl.appendChild(btn);
    });

  } catch (err) {
    listEl.innerHTML = `<p class="empty">Impossible de charger les pronos.</p>`;
    console.error(err);
  }
}

function showDetail(prono) {
  detailEl.innerHTML = `
    <strong>Nom :</strong> ${prono.name}<br><br>
    <strong>Date :</strong> ${new Date(prono.createdAt).toLocaleString()}<br><br>
    <strong>Pronostic :</strong>
    <pre>${JSON.stringify(prono.selections, null, 2)}</pre>
  `;
}

loadPronos();
