export function createNavigation(ctx) {
  function showTab(tabName) {
    document.querySelectorAll(".tab-button").forEach((button) => {
      const active = button.dataset.tab === tabName;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `${tabName}Panel`);
    });
  }

  function showSubtab(groupName, tabName) {
    document.querySelectorAll(`[data-subtab-group="${groupName}"]`).forEach((button) => {
      const active = button.dataset.subtab === tabName;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    document.querySelectorAll(`[data-subtab-panel-group="${groupName}"]`).forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.subtabPanel === tabName);
    });
  }

  function bindNavigationEvents() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => showTab(button.dataset.tab));
    });

    document.querySelectorAll(".section-subtab").forEach((button) => {
      button.addEventListener("click", () => showSubtab(button.dataset.subtabGroup, button.dataset.subtab));
    });

    document.getElementById("playerKills").addEventListener("input", (event) => {
      ctx.state.playerKills = Math.max(0, Math.floor(Number(event.target.value) || 0));
      ctx.actions.saveState();
      ctx.actions.renderStats();
      ctx.actions.renderPvmChallenges();
      ctx.actions.updateShopState();
      ctx.actions.updateRepeatableState();
    });

    document.getElementById("addKillButton").addEventListener("click", () => {
      ctx.state.playerKills += 1;
      ctx.actions.saveState();
      ctx.actions.renderStats();
      ctx.actions.renderPvmChallenges();
      ctx.actions.updateShopState();
      ctx.actions.updateRepeatableState();
    });

    document.getElementById("removeKillButton").addEventListener("click", () => {
      ctx.state.playerKills = Math.max(0, ctx.state.playerKills - 1);
      ctx.actions.saveState();
      ctx.actions.renderStats();
      ctx.actions.renderPvmChallenges();
      ctx.actions.updateShopState();
      ctx.actions.updateRepeatableState();
    });

    document.getElementById("resetButton").addEventListener("click", () => {
      ctx.actions.setSettingsOpen(false);
      const shouldReset = window.confirm("Reset completed challenges, talents, collection checks, challenge rolls, PK points, repeatables, and shop purchases?");
      if (!shouldReset) return;
      Object.assign(ctx.state, ctx.actions.defaultState());
      ctx.actions.saveState();
      ctx.actions.render();
    });
  }

  return {
    showTab,
    showSubtab,
    bindNavigationEvents
  };
}
