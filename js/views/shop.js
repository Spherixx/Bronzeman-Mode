export function createShopView(ctx) {
  function renderShopCard(item) {
    const owned = ctx.state.shopPurchases[item.id] ?? 0;
    const canAfford = ctx.domain.availableKillPoints() >= item.cost;
    const card = document.createElement("article");
    card.dataset.shopId = item.id;
    card.className = `shop-item ${canAfford ? "available" : "locked"}`;
    card.title = owned ? `Purchased ${owned}` : "";

    const entries = item.items ?? (item.images ?? []).map((image) => ({ image }));
    const images = entries.map(ctx.actions.renderShopStack).join("");

    card.innerHTML = `
      <div class="shop-art">${images}</div>
      <div class="shop-copy">
        <h3>${item.name}</h3>
        ${item.note ? `<p>${ctx.actions.escapeHtml(item.note)}</p>` : ""}
        <span class="purchase-count">Bought ${owned}</span>
      </div>
      <button type="button" ${canAfford ? "" : "disabled"}>${ctx.actions.killCostLabel(item.cost)}</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      if (ctx.domain.availableKillPoints() < item.cost) return;
      const confirmed = window.confirm(`Buy ${item.name} for ${ctx.actions.killCostLabel(item.cost)}?`);
      if (!confirmed) return;
      const currentOwned = ctx.state.shopPurchases[item.id] ?? 0;
      ctx.state.shopPurchases[item.id] = currentOwned + 1;
      ctx.actions.saveState();
      ctx.actions.renderStats();
      updateShopState();
      ctx.actions.updateRepeatableState();
      ctx.actions.renderUnlocks();
    });

    return card;
  }

  function updateShopState() {
    ctx.data.shopItems.forEach((item) => {
      const card = document.querySelector(`[data-shop-id="${item.id}"]`);
      if (!card) return;

      const owned = ctx.state.shopPurchases[item.id] ?? 0;
      const canAfford = ctx.domain.availableKillPoints() >= item.cost;
      const count = card.querySelector(".purchase-count");
      const button = card.querySelector("button");

      card.classList.toggle("available", canAfford);
      card.classList.toggle("locked", !canAfford);
      card.title = owned ? `Purchased ${owned}` : "";
      if (count) count.textContent = `Bought ${owned}`;
      if (button) button.disabled = !canAfford;
    });
  }

  function renderShop() {
    renderShopSection("shopResupplyList", "resupply");
    renderShopSection("shopUnlocksList", "unlocks");
    renderShopSection("shopOtherList", "other");
  }

  function renderShopSection(targetId, shopSection) {
    const shop = document.getElementById(targetId);
    if (!shop) return;
    shop.innerHTML = "";

    ctx.data.shopCategories.forEach((category) => {
      const categoryItems = ctx.data.shopItems.filter((item) => item.category === category && item.section === shopSection);
      if (!categoryItems.length) return;

      const section = document.createElement("section");
      section.className = "shop-category";
      section.innerHTML = `<h3 class="shop-category-title">${category}</h3><div class="shop-category-grid"></div>`;

      const grid = section.querySelector(".shop-category-grid");
      categoryItems.forEach((item) => grid.appendChild(renderShopCard(item)));
      shop.appendChild(section);
    });
  }

  return {
    renderShop,
    updateShopState
  };
}
