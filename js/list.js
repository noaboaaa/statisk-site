// list.js 
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://kea-alt-del.dk/t7/api";
  const params = new URLSearchParams(location.search);
  const category = params.get("category"); 

  const titleEl = document.getElementById("list-title");
  const listEl  = document.getElementById("product-list");
  const tpl     = document.getElementById("card-tpl");
  const errEl   = document.getElementById("error");

  // Sæt overskrift
  titleEl.textContent = category ? category : "Products";

  // Byg URL (server-side filter)
  let url = `${API_BASE}/products?limit=48`;
  if (category) url += `&category=${encodeURIComponent(category)}`;

  // Hent og vis
  fetch(url)
    .then(r => r.json())
    .then(products => {
      if (!Array.isArray(products) || products.length === 0) {
        listEl.innerHTML = "<p>Ingen produkter fundet.</p>";
        return;
      }

      products.forEach(p => {
        const card = tpl.content.cloneNode(true);

        // Link til single
        card.querySelector(".card-link").href = `singleproduct.html?id=${p.id}`;

        // Billede
        const img = card.querySelector(".thumb-img");
        img.src = `https://kea-alt-del.dk/t7/images/webp/640/${p.id}.webp`;
        img.alt = p.productdisplayname || "Product";

        // Sold out
        if (p.soldout) {
          card.querySelector(".thumb").classList.add("is-soldout");
          card.querySelector(".soldout-flag").hidden = false;
        }

        // Tekster
        card.querySelector(".name").innerHTML = escapeHtml(p.productdisplayname || "");
        const typeOrCat = p.articletype || p.category || "";
        const brand     = p.brandname || "";
        card.querySelector(".meta").textContent = `${typeOrCat}${brand ? " | " + brand : ""}`;

        // Pris / rabat
        const price   = numberOrNull(p.price);
        const discount = numberOrNull(p.discount);
        const prevEl  = card.querySelector(".prev");
        const nowEl   = card.querySelector(".now");
        const badge   = card.querySelector(".discount-badge");

        if (price != null) {
          if (discount && discount > 0) {
            const now = Math.round(price * (1 - discount / 100));
            prevEl.textContent = `Prev. ${fmt(price)}`;
            nowEl.textContent  = `Now ${fmt(now)}`;
            badge.textContent  = `-${discount}%`;
            badge.hidden = false;
          } else {
            prevEl.textContent = "";
            nowEl.textContent  = fmt(price);
            badge.hidden = true;
          }
        } else {
          card.querySelector("[data-price]").style.display = "none";
        }

        listEl.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      errEl.style.display = "block";
    });

  // Små hjælpere
  function fmt(n){ return `DKK ${Number(n).toLocaleString("da-DK", { maximumFractionDigits: 0 })},-`; }
  function numberOrNull(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
});