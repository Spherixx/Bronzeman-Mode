export function createTaskView(ctx) {
  function renderChallengeItem(challenge, target, locked = false) {
    const template = document.getElementById("challengeTemplate");
    const content = template.content.cloneNode(true);
    const input = content.querySelector("input");
    const label = content.querySelector("label");
    const challengeText = content.querySelector(".challenge-text");
    const pointReward = content.querySelector(".point-reward");

    input.checked = ctx.state.completed.includes(challenge.id);
    input.id = challenge.id;
    input.disabled = locked;
    challengeText.textContent = challenge.title;
    label.htmlFor = challenge.id;
    label.classList.toggle("locked", locked);
    pointReward.textContent = locked ? "Locked" : `+${challenge.points} Talent`;
    label.title = locked ? "Locked" : "";

    input.addEventListener("change", () => {
      ctx.domain.setChallengeCompleted(challenge.id, input.checked);
      ctx.actions.saveState();
      ctx.actions.renderStats();
      renderPvmChallenges();
      renderPvpChallenges();
      ctx.actions.updateTalentTreeState();
    });

    target.appendChild(content);
  }

  function renderPvmChallenges() {
    const target = document.getElementById("pvmList");
    target.innerHTML = "";

    ctx.data.challenges.pvm.forEach((group, groupIndex) => {
      const unlocked = ctx.state.playerKills >= group.killRequirement;
      const visibleItems = group.items
        .map((challenge, index) => ({ challenge, index }))
        .filter(({ challenge }) => !challenge.repeatable);
      const stage = document.createElement("section");
      stage.className = `challenge-stage ${unlocked ? "unlocked" : "locked"}`;

      const completed = visibleItems.filter(({ challenge, index }) => {
        return ctx.state.completed.includes(challenge.id || ctx.domain.challengeId("pvm", groupIndex, index));
      }).length;
      stage.innerHTML = `
        <div class="stage-header">
          <div>
            <span>${group.stage}</span>
            <strong>${group.killRequirement} PK</strong>
          </div>
          <em>${completed} / ${visibleItems.length}</em>
        </div>
      `;

      const list = document.createElement("div");
      list.className = "stage-list";

      visibleItems.forEach(({ challenge, index }) => {
        renderChallengeItem({
          id: challenge.id || ctx.domain.challengeId("pvm", groupIndex, index),
          title: ctx.domain.challengeTitle(challenge),
          points: ctx.domain.challengePoints(challenge),
          stage: group.stage,
          killRequirement: group.killRequirement
        }, list, !unlocked);
      });

      stage.appendChild(list);
      target.appendChild(stage);
    });
  }

  function renderPvpChallenges() {
    const target = document.getElementById("pvpList");
    target.innerHTML = "";
    ctx.domain.flattenPvpChallenges().forEach((challenge) => renderChallengeItem(challenge, target));
  }

  function renderRepeatables() {
    const target = document.getElementById("repeatableList");
    if (!target) return;

    target.innerHTML = "";
    ctx.domain.flattenRepeatables().forEach((repeatable) => {
      const owned = ctx.state.repeatablePurchases[repeatable.id] ?? 0;
      const canAfford = ctx.domain.availableKillPoints() >= repeatable.cost;
      const item = document.createElement("div");
      item.className = `challenge-item repeatable-item ${canAfford ? "available" : "locked"}`;
      item.dataset.repeatableId = repeatable.id;
      item.innerHTML = `
        <span class="checkmark repeatable-mark" aria-hidden="true">PK</span>
        <span class="challenge-text">${repeatable.title}</span>
        <span class="repeatable-actions">
          <span class="point-reward">Bought ${owned}</span>
          <button type="button" ${canAfford ? "" : "disabled"}>${ctx.actions.killCostLabel(repeatable.cost)}</button>
        </span>
      `;

      item.querySelector("button").addEventListener("click", () => {
        if (ctx.domain.availableKillPoints() < repeatable.cost) return;
        ctx.state.repeatablePurchases[repeatable.id] = (ctx.state.repeatablePurchases[repeatable.id] ?? 0) + 1;
        ctx.actions.saveState();
        ctx.actions.renderStats();
        ctx.actions.updateShopState();
        updateRepeatableState();
      });

      target.appendChild(item);
    });
  }

  function updateRepeatableState() {
    ctx.domain.flattenRepeatables().forEach((repeatable) => {
      const item = document.querySelector(`[data-repeatable-id="${repeatable.id}"]`);
      if (!item) return;

      const owned = ctx.state.repeatablePurchases[repeatable.id] ?? 0;
      const canAfford = ctx.domain.availableKillPoints() >= repeatable.cost;
      const count = item.querySelector(".point-reward");
      const button = item.querySelector("button");

      item.classList.toggle("available", canAfford);
      item.classList.toggle("locked", !canAfford);
      if (count) count.textContent = `Bought ${owned}`;
      if (button) button.disabled = !canAfford;
    });
  }

  return {
    renderPvmChallenges,
    renderPvpChallenges,
    renderRepeatables,
    updateRepeatableState
  };
}
