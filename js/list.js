// list.js
(() => {
  const API_BASE = "https://kea-alt-del.dk/t7/api";
  const IMG = (id, size = 640, type = "webp") =>
    `https://kea-alt-del.dk/t7/images/${type}/${size}/${id}.${type}`;

  // DOM refs
  const listEl = document.getElementById("product-list");
  const tpl = document.getElementById("card-tpl");
  const titleEl = document.getElementById("list-title");
  const errEl = document.getElementById("error");

  // Læs query params og byg /products URL med server-side filter (hurtigere end at hente alt)
  const qs = new URLSearchParams(location.search);
  const params = new URLSearchParams();

  // Understøt både brandname og brand (vi map’er brand -> brandname jf. API)
  const brand = qs.get("brand") || qs.get("brandname");
  const category = qs.get("category");
  const articletype = qs.get("articletype");
  const season = qs.get("season");

  if (brand) params.set("brandname", brand);
  if (category) params.set("category", category);
  if (articletype) params.set("articletype", articletype);
  if (season) params.set("season", season);

  // Pagination defaults
  params.set("limit", qs.get("limit") || "24");
  if (qs.get("start")) params.set("start", qs.get("start"));

  // Sæt liste-overskrift
  if (brand) titleEl.textContent = brand;
  else if (category) titleEl.textContent = category;
  else if (articletype) titleEl.textContent = articletype;
  else if (season) titleEl.textContent = season;
  else titleEl.textContent = "Products";

  const PRODUCTS_URL = `${API_BASE}/products${params.toString() ? "?" + params.toString() : ""}`;

  fetch(PRODUCTS_URL)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(async (items) => {
      if (!Array.isArray(items) || items.length === 0) {
        listEl.innerHTML = "<p>Ingen produkter fundet.</p>";
        return;
      }

      // Nogle felter kan mangle i /products (limited properties),
      // så vi henter detaljer for at sikre price/discount/soldout mm.
      // Gør det i batches for at undgå for mange samtidige kald.
      const concurrency = 8;
      let i = 0;

      async function detail(p) {
        try {
          const r = await fetch(`${API_BASE}/products/${p.id}`);
          if (!r.ok) throw new Error("detail " + r.status);
          const full = await r.json();
          return { ...p, ...full };
        } catch {
          // fallback til liste-data hvis detaljer fejler
          return p;
        }
      }

      async function* batched(iterable, size) {
        while (i < iterable.length) {
          const chunk = iterable.slice(i, i + size);
          i += size;
          yield Promise.all(chunk.map(detail));
        }
      }

      for await (const batch of batched(items, concurrency)) {
        batch.forEach(renderCard);
      }
    })
    .catch(e => {
      console.error(e);
      errEl.style.display = "block";
    });

  function renderCard(p) {
    const node = tpl.content.cloneNode(true);

    // Link til single
    node.querySelector(".card-link").href = `singleproduct.html?id=${p.id}`;

    // Billede
    const img = node.querySelector(".thumb-img");
    img.src = IMG(p.id, 640, "webp");
    img.alt = p.productdisplayname || p.productDisplayName || "Product";

    // Sold out
    const sold = Boolean(p.soldout);
    const thumb = node.querySelector(".thumb");
    const soldFlag = node.querySelector(".soldout-flag");
    if (sold) {
      thumb.classList.add("is-soldout");
      soldFlag.hidden = false;
    }

    // Tekster
    const name = p.productdisplayname || p.productDisplayName || "";
    const brandname = p.brandname || p.brandName || "";
    const typeOrCat = p.articletype || p.articleType || p.category || "";
    node.querySelector(".name").innerHTML = escapeHtml(name);
    node.querySelector(".meta").textContent = `${typeOrCat}${brandname ? " | " + brandname : ""}`;

    // Pris / rabat
    const priceRow = node.querySelector("[data-price]");
    const prevEl = node.querySelector(".prev");
    const nowEl  = node.querySelector(".now");
    const badge  = node.querySelector(".discount-badge");

    const price = toNum(p.price);
    const discount = toNum(p.discount);

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
      // ingen pris -> skjul hele prissektion
      priceRow.style.display = "none";
    }

    listEl.appendChild(node);
  }

  function fmt(n) {
    return `DKK ${Number(n).toLocaleString("da-DK", { maximumFractionDigits: 0 })},-`;
  }
  function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[m]));
  }
})();