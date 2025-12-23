(async () => {
  const list = document.getElementById("list");
  if (!list) return;

  try {
    const res = await fetch("/pronos");
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      list.innerHTML = "<p>Aucun prono pour le moment.</p>";
      return;
    }

    list.innerHTML = "";

    data.items.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginTop = "10px";

      const title = document.createElement("h3");
      title.textContent = p.name;

      const meta = document.createElement("div");
      meta.style.fontSize = "12px";
      meta.style.opacity = "0.7";
      meta.textContent = p.created_at ? `Envoyé: ${p.created_at}` : "";

      const pre = document.createElement("pre");
      pre.style.whiteSpace = "pre-wrap";
      pre.textContent = JSON.stringify(p.selections, null, 2);

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(pre);

      list.appendChild(card);
    });
  } catch (e) {
    console.log(e);
    list.innerHTML = "<p>Erreur de chargement des pronos.</p>";
  }
})();
