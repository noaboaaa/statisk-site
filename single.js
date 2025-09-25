// single.js
(function(){
  const qs = new URLSearchParams(location.search);
  const id = qs.get("id") || "1163";
  const ENDPOINT = `https://kea-alt-del.dk/t7/api/products/${id}`;

  // DOM refs
  const img     = document.getElementById("prod-img");
  const thumb   = document.getElementById("thumb");
  const model   = document.getElementById("model");
  const color   = document.getElementById("color");
  const inv     = document.getElementById("inv");
  const brand   = document.getElementById("brand");
  const brandCp = document.getElementById("brand-copy");
  const bpName  = document.getElementById("bp-title");
  const bpMeta  = document.getElementById("bp-meta");
  const cta     = document.getElementById("cta");
  const bcCur   = document.getElementById("bc-current");
  const err     = document.getElementById("error");

  // Pris DOM
  const priceWrap = document.getElementById("price-wrap");
  const pricePrev = document.getElementById("price-prev");
  const priceNow  = document.getElementById("price-now");
  const badge     = document.getElementById("price-badge");

  const pick = (obj, keys, def = "") =>
    keys.reduce((acc,k) => acc ?? obj?.[k], undefined) ?? def;

  const fmt = (n) => `DKK ${Number(n).toLocaleString("da-DK", { maximumFractionDigits: 0 })},-`;

  fetch(ENDPOINT)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(p => {
      const name       = pick(p, ["productdisplayname","productDisplayName","name"], "");
      const brandname  = pick(p, ["brandname","brandName","brand"], "");
      const category   = pick(p, ["category","articletype","articleType"], "");
      const baseColor  = pick(p, ["basecolour","baseColor","basecolour","color1","colour1","color"], "—");
      const price      = Number(p.price) || null;
      const discount   = Number(p.discount) || 0;
      const soldout    = Boolean(p.soldout);

      // Title & breadcrumbs
      document.title = name ? `${name} – ${brandname}` : "Produkt";
      if (bcCur) bcCur.textContent = name || `ID ${id}`;

      // Image
      img.src = `https://kea-alt-del.dk/t7/images/webp/640/${id}.webp`;
      img.alt = name ? `${name} – ${brandname}` : "Product image";
      if (soldout) {
        thumb.classList.add("is-soldout");
        img.classList.add("is-soldout");
      }

      // Middle column
      model.textContent = name || "—";
      color.textContent = baseColor;
      inv.textContent   = id;
      brand.textContent = brandname || "—";

      const taglines = {
        "Nike": "creating experiences for today’s athlete",
        "Puma": "Forever Faster",
        "Adidas": "Impossible is Nothing",
      };
      brandCp.textContent = taglines[brandname] || "";

      // Right panel header/meta
      bpName.textContent = name || "—";
      bpMeta.textContent = `${brandname || ""}${category ? " | " + category : ""}`;

      // CTA & sold out
      if (soldout) {
        cta.textContent = "Sold Out";
        cta.disabled = true;
        cta.style.opacity = 0.7;
        cta.style.cursor = "not-allowed";
      } else {
        cta.textContent = "Add to basket";
        cta.disabled = false;
      }

      // === PRISER ===
      if (price) {
        if (discount > 0) {
          const now = Math.round(price * (1 - discount/100));
          pricePrev.textContent = `Prev. ${fmt(price)}`;
          priceNow.textContent  = `Now ${fmt(now)}`;
          badge.textContent     = `-${discount}%`;
          badge.hidden = false;

          // valgfrit: også i dokumenttitel
          document.title += ` – Now ${fmt(now)} (-${discount}%)`;
        } else {
          pricePrev.textContent = "";
          priceNow.textContent  = fmt(price);
          badge.hidden = true;
        }
      } else {
        // Ingen pris fra API – gem hele prisblokken
        priceWrap.style.display = "none";
      }
    })
    .catch(e => {
      console.error(e);
      if (err) err.style.display = "block";
      if (bcCur) bcCur.textContent = "Product unavailable";
      bpName.textContent = "Product unavailable";
      bpMeta.textContent = "";
      priceWrap.style.display = "none";
    });
})();