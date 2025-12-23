async function loadList() {
  const container = document.querySelector("#list");
  if (!container) return;

  container.innerHTML = "Chargement...";

  try {
    const res = await fetch("/api/pronos");
    if (!res.ok) throw new Error("Erreur chargement");

    const list = await res.json();

    if (!list.length) {
      container.innerHTML = "<p>Aucun prono pour le moment.</p>";
      return;
    }

    container.innerHTML = "";
    for (const item of list) {
      const div = document.createElement("div");
      div.style.padding = "10px";
      div.style.borderBottom = "1px solid #eee";
      div.style.cursor = "pointer";
      div.innerHTML = `
        <b>${item.name}</b>
        <div style="opacity:.7;font-size:12px">${new Date(item.created_at).toLocaleString()}</div>
      `;

      div.addEventListener("click", async () => {
        const detail = await fetch(`/api/pronos/${item.id}`).then(r => r.json());
        alert(`${detail.name}\n\nID: ${detail.id}\n\nVoir la console pour le détail.`);
        console.log("DETAIL:", detail);
      });

      container.appendChild(div);
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = "<p>Erreur de chargement.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadList);
