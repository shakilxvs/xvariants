(function () {
  if (!window.location.pathname.includes("/collections/")) return;

  const SHOP = window.Shopify && window.Shopify.shop;
  const API = "https://xvariants.onrender.com/api/split-config";

  if (!SHOP) return;

  async function getConfig() {
    try {
      const res = await fetch(API + "?shop=" + SHOP);
      const data = await res.json();
      return data.items || [];
    } catch (e) {
      return [];
    }
  }

  async function getProductData(handle) {
    try {
      const res = await fetch("/products/" + handle + ".js");
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function findCardByHandle(handle) {
    const links = document.querySelectorAll("a[href*='/products/" + handle + "']");
    for (const link of links) {
      const card = link.closest("[class*='card'], [class*='product'], li, article");
      if (card) return card;
    }
    return null;
  }

  function splitCard(originalCard, product, splitBy) {
    const variants = product.variants;
    const handle = product.handle;

    let optionIndex = 0;
    if (splitBy === "size") {
      const idx = product.options.findIndex(function(o) {
        return o.toLowerCase().includes("size");
      });
      optionIndex = idx >= 0 ? idx : 0;
    } else if (splitBy === "color") {
      const idx = product.options.findIndex(function(o) {
        return o.toLowerCase() === "color" || o.toLowerCase() === "colour";
      });
      optionIndex = idx >= 0 ? idx : 0;
    }

    const seen = new Set();
    const splitGroups = [];

    for (const variant of variants) {
      const val = splitBy === "all" ? variant.title : variant.options[optionIndex];
      if (!seen.has(val)) {
        seen.add(val);
        splitGroups.push({ val: val, variant: variant });
      }
    }

    if (splitGroups.length <= 1) return;

    const parent = originalCard.parentNode;

    splitGroups.forEach(function(group) {
      const clone = originalCard.cloneNode(true);

      const titleEl = clone.querySelector("[class*='title'], [class*='name'], h2, h3, h4");
      if (titleEl) {
        titleEl.textContent = product.title + " \u2014 " + group.val;
      }

      clone.querySelectorAll("a[href*='/products/']").forEach(function(a) {
        a.href = "/products/" + handle + "?variant=" + group.variant.id;
      });

      if (group.variant.featured_image && group.variant.featured_image.src) {
        const img = clone.querySelector("img");
        if (img) {
          img.src = group.variant.featured_image.src;
          img.srcset = "";
        }
      }

      parent.insertBefore(clone, originalCard);
    });

    originalCard.style.display = "none";
  }

  async function run() {
    const configs = await getConfig();
    if (!configs.length) return;

    for (const config of configs) {
      const handle = config.productHandle;
      if (!handle) continue;

      const card = findCardByHandle(handle);
      if (!card) continue;

      const product = await getProductData(handle);
      if (!product) continue;

      splitCard(card, product, config.splitBy);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
