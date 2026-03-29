(function () {

  var SHOP = window.Shopify && window.Shopify.shop;
  var API = "https://xvariants.onrender.com/api/split-config";


  function getConfig() {
    return fetch(API + "?shop=" + SHOP)
      .then(function(res) { return res.json(); })
      .then(function(data) { return data.items || []; })
      .catch(function() { return []; });
  }

  function getProductData(handle) {
    return fetch("/products/" + handle + ".js")
      .then(function(res) { return res.json(); })
      .catch(function() { return null; });
  }

  function findCardByHandle(handle) {
    var links = document.querySelectorAll("a[href*='/products/" + handle + "']");
    for (var i = 0; i < links.length; i++) {
      var card = links[i].closest("[class*='card'], [class*='product'], li, article");
      if (card) return card;
    }
    return null;
  }

  function splitCard(originalCard, product, splitBy) {
    var variants = product.variants;
    var handle = product.handle;
    var optionIndex = 0;

    if (splitBy === "size") {
      for (var i = 0; i < product.options.length; i++) {
        if (product.options[i].toLowerCase().indexOf("size") >= 0) { optionIndex = i; break; }
      }
    } else if (splitBy === "color") {
      for (var i = 0; i < product.options.length; i++) {
        var o = product.options[i].toLowerCase();
        if (o === "color" || o === "colour") { optionIndex = i; break; }
      }
    }

    var seen = {};
    var splitGroups = [];
    for (var i = 0; i < variants.length; i++) {
      var variant = variants[i];
      var val = splitBy === "all" ? variant.title : variant.options[optionIndex];
        seen[val] = true;
        splitGroups.push({ val: val, variant: variant });
      }
    }

    if (splitGroups.length <= 1) return;

    var parent = originalCard.parentNode;
    for (var i = 0; i < splitGroups.length; i++) {
      var group = splitGroups[i];
      var clone = originalCard.cloneNode(true);

      var titleEl = clone.querySelector("[class*='title'], [class*='name'], h2, h3, h4");
      if (titleEl) titleEl.textContent = product.title + " — " + group.val;

      var links = clone.querySelectorAll("a[href*='/products/']");
      for (var j = 0; j < links.length; j++) {
        links[j].href = "/products/" + handle + "?variant=" + group.variant.id;
      }

      if (group.variant.featured_image && group.variant.featured_image.src) {
        var img = clone.querySelector("img");
        if (img) { img.src = group.variant.featured_image.src; img.srcset = ""; }
      }

      parent.insertBefore(clone, originalCard);
    }

    originalCard.style.display = "none";
  }

  function run() {
    getConfig().then(function(configs) {
      var promises = configs.map(function(config) {
        var card = findCardByHandle(config.productHandle);
        return getProductData(config.productHandle).then(function(product) {
          if (product) splitCard(card, product, config.splitBy);
        });
      });
      return Promise.all(promises);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
