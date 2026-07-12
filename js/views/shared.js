import { escapeHtml } from "../utils.js";

export function createViewHelpers(ctx) {
  const missingImageAssets = new Set();

  function killCostLabel(cost) {
    return `${cost} PK`;
  }

  function renderShopStack(entry) {
    return `
      <span class="shop-stack">
        <img src="${entry.image}" alt="" loading="lazy" />
        ${entry.amount ? `<span class="stack-amount">${entry.amount}</span>` : ""}
      </span>
    `;
  }

  function renderItemImages(images) {
    return images.filter((src) => src && !missingImageAssets.has(src))
      .map((src) => `<img src="${src}" alt="" loading="lazy" />`)
      .join("");
  }

  return {
    escapeHtml,
    killCostLabel,
    renderShopStack,
    renderItemImages
  };
}
