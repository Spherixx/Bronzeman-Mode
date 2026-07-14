import { escapeHtml } from "../utils.js";
import { imageFallbacks } from "../assets.js";

export function createViewHelpers(ctx) {
  const missingImageAssets = new Set();

  function imageAttributes(source) {
    const fallbacks = imageFallbacks(source);
    return fallbacks.length ? ` data-image-fallbacks="${encodeURIComponent(JSON.stringify(fallbacks))}"` : "";
  }

  function initImageFallbacks() {
    document.addEventListener("error", (event) => {
      const image = event.target;
      if (image?.tagName !== "IMG") return;

      let fallbacks = [];
      try {
        fallbacks = JSON.parse(decodeURIComponent(image.dataset.imageFallbacks || ""));
      } catch {
        fallbacks = [];
      }

      const nextSource = fallbacks.shift();
      if (nextSource) {
        image.dataset.imageFallbacks = encodeURIComponent(JSON.stringify(fallbacks));
        image.src = nextSource;
        return;
      }

      missingImageAssets.add(image.getAttribute("src") || "");
      image.remove();
    }, true);
  }

  function killCostLabel(cost) {
    return `${cost} PK`;
  }

  function renderShopStack(entry) {
    return `
      <span class="shop-stack">
        <img src="${escapeHtml(entry.image)}"${imageAttributes(entry.image)} alt="" loading="lazy" />
        ${entry.amount ? `<span class="stack-amount">${entry.amount}</span>` : ""}
      </span>
    `;
  }

  function renderItemImages(images) {
    return images.filter((src) => src && !missingImageAssets.has(src))
      .map((src) => `<img src="${escapeHtml(src)}"${imageAttributes(src)} alt="" loading="lazy" />`)
      .join("");
  }

  return {
    escapeHtml,
    initImageFallbacks,
    killCostLabel,
    renderShopStack,
    renderItemImages
  };
}
