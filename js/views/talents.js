export function createTalentView(ctx) {
  function renderTalentTree() {
    const tree = document.getElementById("talentTree");
    tree.innerHTML = "";
    const maxTier = Math.max(0, ...ctx.data.unlocks.map((unlock) => unlock.tier));

    for (let tierNumber = 1; tierNumber <= maxTier; tierNumber += 1) {
      const tier = document.createElement("div");
      tier.className = "tier";
      tier.dataset.tier = tierNumber;

      const label = document.createElement("div");
      const requirement = document.createElement("div");
      const tierProgress = ctx.domain.tierRequirementProgress(tierNumber);
      label.className = "tier-label";
      requirement.className = `tier-requirement ${tierProgress.unlocked ? "unlocked" : "locked"}`;
      label.innerHTML = `<b>TIER ${tierNumber}</b> | ${tierNumber === 1 ? "BASE" : tierNumber === maxTier ? "ENDGAME" : "POWER"}`;
      requirement.textContent = tierNumber === 1 ? "Open" : `Tier ${tierNumber - 1}: ${Math.min(tierProgress.purchased, tierProgress.required)} / ${tierProgress.required}`;
      tier.appendChild(label);
      tier.appendChild(requirement);

      ctx.data.unlocks.filter((unlock) => unlock.tier === tierNumber).forEach((unlock) => {
        const purchased = ctx.state.purchased.includes(unlock.id);
        const available = ctx.domain.canBuy(unlock);
        const button = document.createElement("button");
        const images = ctx.actions.renderItemImages(unlock.images ?? [unlock.image]);

        button.type = "button";
        button.dataset.unlockId = unlock.id;
        button.className = `talent-node ${purchased ? "purchased" : available ? "available" : "locked"}`;
        button.disabled = !purchased && !available;
        button.title = ctx.domain.lockReason(unlock);
        button.setAttribute("aria-label", `${unlock.name}. ${ctx.domain.lockReason(unlock)}.`);
        button.innerHTML = `
          <span class="node-art">${images}</span>
          <span>
            <span class="node-name">${unlock.name}</span>
          </span>
          <span class="node-cost">${purchased ? "OK" : `${unlock.cost} Talent`}</span>
        `;

        button.addEventListener("click", () => {
          const isPurchased = ctx.state.purchased.includes(unlock.id);
          if (isPurchased) ctx.domain.refundUnlock(unlock.id);
          else if (ctx.domain.canBuy(unlock)) ctx.domain.buyUnlock(unlock.id);
        });

        tier.appendChild(button);
      });

      tree.appendChild(tier);
    }
  }

  function updateTalentTreeState() {
    document.querySelectorAll(".tier").forEach((tierElement) => {
      const tierNumber = Number(tierElement.dataset.tier);
      const requirement = tierElement.querySelector(".tier-requirement");
      if (!tierNumber || !requirement) return;

      const tierProgress = ctx.domain.tierRequirementProgress(tierNumber);
      requirement.classList.toggle("unlocked", tierProgress.unlocked);
      requirement.classList.toggle("locked", !tierProgress.unlocked);
      requirement.textContent = tierNumber === 1 ? "Open" : `Tier ${tierNumber - 1}: ${Math.min(tierProgress.purchased, tierProgress.required)} / ${tierProgress.required}`;
    });

    ctx.data.unlocks.forEach((unlock) => {
      const button = document.querySelector(`[data-unlock-id="${unlock.id}"]`);
      if (!button) return;

      const purchased = ctx.state.purchased.includes(unlock.id);
      const available = ctx.domain.canBuy(unlock);
      const reason = ctx.domain.lockReason(unlock);
      const cost = button.querySelector(".node-cost");

      button.classList.toggle("purchased", purchased);
      button.classList.toggle("available", !purchased && available);
      button.classList.toggle("locked", !purchased && !available);
      button.disabled = !purchased && !available;
      button.title = reason;
      button.setAttribute("aria-label", `${unlock.name}. ${reason}.`);
      if (cost) cost.textContent = purchased ? "OK" : `${unlock.cost} Talent`;
    });
  }

  return {
    renderTalentTree,
    updateTalentTreeState
  };
}
