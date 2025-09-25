// single.js 
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://kea-alt-del.dk/t7/api";
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "1163";
  const ENDPOINT = `${API_BASE}/products/${id}`;

  // DOM
  const img     = document.getElementById("prod-img");
  const thumb   = document.getElementById("thumb");
  const model   = document.getElementById("model");
  const color   = document.getElementById("color");
  const inv     = document.getElementById("inv");
  const brandEl = document.getElementById("brand");
  const bpName  = document.getElementById("bp-title");
  const bpMeta  = document.getElementById("bp-meta");
  const cta     = document.getElementById("cta");
  const bcCur   = document.getElementById("bc-current");
  const err     = document.getElementById("error");
  const brandCp = document.getElementById("brand-copy"); 

  // Pris DOM
  const pricePrev = document.getElementById("price-prev");
  const priceNow  = document.getElementById("price-now");
  const badge     = document.getElementById("price-badge");
  const priceWrap = document.getElementById("price-wrap");

  fetch(ENDPOINT)
    .then(r => r.json())
    .then(p => {
      const name      = p.productdisplayname || "";
      const brandname = p.brandname || "";
      const typeOrCat = p.category || p.articletype || "";
      const baseColor = p.basecolour || p.baseColor || "—";
      const price     = numberOrNull(p.price);
      const discount  = numberOrNull(p.discount);
      const soldout   = !!p.soldout;

      document.title = name ? `${name} – ${brandname}` : "Produkt";
      if (bcCur) bcCur.textContent = name || `ID ${id}`;

      // Billede
      img.src = `https://kea-alt-del.dk/t7/images/webp/640/${id}.webp`;
      img.alt = name || "Product";
      if (soldout) { thumb.classList.add("is-soldout"); img.classList.add("is-soldout"); }

      // Info
      model.textContent = name || "—";
      color.textContent = baseColor;
      inv.textContent   = id;
      brandEl.textContent = brandname || "—";

      // Købspanel tekst
      bpName.textContent = name || "—";
      bpMeta.textContent = `${brandname}${typeOrCat ? " | " + typeOrCat : ""}`;

      // CTA
      if (soldout) {
        cta.textContent = "Sold Out";
        cta.disabled = true;
        cta.style.opacity = 0.7;
        cta.style.cursor = "not-allowed";
      } else {
        cta.textContent = "Add to basket";
        cta.disabled = false;
      }

      // === PRIS ===
      if (price != null) {
        if (discount && discount > 0) {
          const now = Math.round(price * (1 - discount/100));
          pricePrev.textContent = `Prev. ${fmt(price)}`;
          priceNow.textContent  = `Now ${fmt(now)}`;
          badge.textContent     = `-${discount}%`;
          badge.hidden = false;
        } else {
          pricePrev.textContent = "";
          priceNow.textContent  = fmt(price);
          badge.hidden = true;
        }
      } else {
        priceWrap.style.display = "none";
      }

      // === BRAND COPY ===
      // 1) Prøv at bruge tekst direkte fra produktet (hvis feltet findes)
      let copy = p.brandbio || p.brandBio || p.branddescription || p.brandDescription || "";
      // 2) Hvis tomt, hent fra /brands?brandname=...
      if (!copy && brandname) {
        fetch(`${API_BASE}/brands?brandname=${encodeURIComponent(brandname)}`)
          .then(r => r.json())
          .then(arr => {
            const b = Array.isArray(arr) && arr[0] ? arr[0] : null;
            const fetched = b && (b.brandbio || b.brandBio || b.branddescription || b.brandDescription || "");
            if (fetched) {
              brandCp.textContent = fetched;
            } else {
              // 3) Sidste fallback: lille standard-tagline
              brandCp.textContent = defaultTagline(brandname);
            }
          })
          .catch(() => {
            brandCp.textContent = defaultTagline(brandname);
          });
      } else {
        // Havde vi en copy direkte?
        brandCp.textContent = copy || defaultTagline(brandname);
      }
    })
    .catch(err => {
      console.error(err);
      if (err) err.style.display = "block";
    });

  // Hjælpere
  function fmt(n){ return `DKK ${Number(n).toLocaleString("da-DK", { maximumFractionDigits: 0 })},-`; }
  function numberOrNull(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
  function defaultTagline(brand){
    const map = {
      "Nike": "creating experiences for today’s athlete",
      "Puma": "Forever Faster",
      "Adidas": "Impossible is Nothing"
    };
    return map[brand] || "";
  }
});