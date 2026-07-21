import {
  CHALLENGE_COUNTDOWN_SECONDS,
  CHALLENGE_ROLL_DURATION_MS,
  CHALLENGE_ROLL_RESULT_HOLD_MS
} from "../config.js";

export function createChallengeView(ctx) {
  function challengeRequirementEntry(name) {
    const itemRow = ctx.indexes.itemRowsByName.get(ctx.dataHelpers.normalizeDataText(name));
    return {
      name: ctx.dataHelpers.dataDisplayName(itemRow, name),
      image: itemRow ? ctx.dataHelpers.imageForDataEntry(itemRow) : ctx.dataHelpers.resolveDataImage(name)
    };
  }

  function challengeRewardItems(challenge) {
    return challenge.rewardIds
      .map((id) => ctx.collection.collectionItems().find((item) => item.id === id))
      .filter(Boolean);
  }

  function itemByCollectionId(id) {
    return ctx.collection.collectionItems().find((item) => item.id === id);
  }

  function rewardItemsFromIds(ids) {
    return ids.map(itemByCollectionId).filter(Boolean);
  }

  function shuffledItems(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function idleChallengeRewardItems(challenge) {
    const rewards = challengeRewardItems(challenge);
    const challengeId = challenge.id;
    const rewardIds = rewards.map((item) => item.id);
    const currentOrder = ctx.challengeUi.rewardDisplayOrders[challengeId] ?? [];
    const hasCurrentOrder = currentOrder.length === rewardIds.length && rewardIds.every((id) => currentOrder.includes(id));

    if (!hasCurrentOrder) {
      ctx.challengeUi.rewardDisplayOrders[challengeId] = shuffledItems(rewards).map((item) => item.id);
    }

    return rewardItemsFromIds(ctx.challengeUi.rewardDisplayOrders[challengeId]);
  }

  function buildChallengeReel(rewards, rewardId) {
    const rewardIds = rewards.map((item) => item.id);
    const reelIds = [];

    for (let cycle = 0; cycle < 4; cycle += 1) {
      reelIds.push(...shuffledItems(rewardIds));
    }

    const landingGroup = shuffledItems(rewardIds.filter((id) => id !== rewardId));
    const landingOffset = Math.min(landingGroup.length, 4 + Math.floor(Math.random() * 4));
    landingGroup.splice(landingOffset, 0, rewardId);
    reelIds.push(...landingGroup);

    return {
      reelIds,
      targetIndex: reelIds.lastIndexOf(rewardId)
    };
  }

  function renderChallengeIconGrid(groups) {
    return groups.map((group) => `
      <div class="challenge-kit-row">
        ${group.map((name) => {
      const entry = challengeRequirementEntry(name);
      return `
            <span class="challenge-kit-item" title="${ctx.actions.escapeHtml(entry.name)}">
              <img src="${entry.image}" alt="" loading="lazy" />
              <b>${ctx.actions.escapeHtml(entry.name)}</b>
            </span>
          `;
    }).join("")}
      </div>
    `).join("");
  }

  function renderRewardRoulette(challenge) {
    const rewards = challengeRewardItems(challenge);
    const activeRoll = ctx.challengeUi.activeRoll?.challengeId === challenge.id ? ctx.challengeUi.activeRoll : null;
    const latestId = ctx.state.challengeRolls[challenge.id];
    if (!rewards.length) return `<p class="challenge-empty">Perilous Moons reward items are missing.</p>`;
    const visibleRewards = activeRoll ? rewardItemsFromIds(activeRoll.reelIds) : idleChallengeRewardItems(challenge);

    return `
      <div class="roulette-stage ${activeRoll?.phase ?? "idle"}" data-challenge-id="${ctx.actions.escapeHtml(challenge.id)}" aria-label="Perilous Moons roulette rewards">
        <span class="roulette-pointer" aria-hidden="true"></span>
        ${activeRoll?.phase === "countdown" ? `
          <div class="roulette-countdown" aria-live="polite">
            <strong>${activeRoll.countdown}</strong>
          </div>
        ` : ""}
        <div class="roulette-strip">
        ${visibleRewards.map((item, index) => {
      const unlocked = ctx.domain.challengeRewardIsUnlocked(item.id);
      const latest = latestId === item.id;
      const target = activeRoll?.targetIndex === index;
      return `
            <span class="roulette-item ${unlocked ? "is-unlocked" : ""} ${latest ? "latest" : ""} ${target ? "target" : ""}" title="${ctx.actions.escapeHtml(item.name)}">
              ${ctx.actions.renderItemImages(item.images)}
              <b>${ctx.actions.escapeHtml(item.name)}</b>
            </span>
          `;
    }).join("")}
        </div>
      </div>
    `;
  }

  function renderChallengeUnlockedRewards(challenge) {
    const rewards = challengeRewardItems(challenge);
    if (!rewards.length) return `<p class="challenge-empty">No Perilous Moons reward items found.</p>`;

    return `
      <div class="challenge-reward-grid">
        ${rewards.map((item) => {
      const unlocked = ctx.domain.challengeRewardIsUnlocked(item.id);
      return `
            <article class="challenge-reward-item ${unlocked ? "is-unlocked" : "is-locked"}">
              <div class="challenge-reward-art">${ctx.actions.renderItemImages(item.images)}</div>
              <div>
                <h4>${ctx.actions.escapeHtml(item.name)}</h4>
                <span>${unlocked ? "Unlocked" : "Locked"}</span>
              </div>
            </article>
          `;
    }).join("")}
      </div>
    `;
  }

  function clearChallengeCountdownTimer() {
    if (!ctx.challengeUi.countdownTimer) return;
    window.clearInterval(ctx.challengeUi.countdownTimer);
    ctx.challengeUi.countdownTimer = null;
  }

  function finalizeChallengeRoll() {
    if (!ctx.challengeUi.activeRoll) return;

    const { challengeId, rewardId } = ctx.challengeUi.activeRoll;
    const challenge = ctx.config.challengeCatalog.find((entry) => entry.id === challengeId);
    if (!challenge) return;
    ctx.state.challengeCompletions[challengeId] = (ctx.state.challengeCompletions[challengeId] ?? 0) + 1;
    ctx.state.challengeRolls[challengeId] = rewardId;
    if (!ctx.domain.challengeRewardIsUnlocked(rewardId)) ctx.state.challengeRewardUnlocks.push(rewardId);

    ctx.challengeUi.rewardDisplayOrders[challengeId] = shuffledItems(challengeRewardItems(challenge)).map((item) => item.id);
    ctx.challengeUi.activeRoll = null;
    clearChallengeCountdownTimer();
    ctx.actions.saveState();
    renderChallengeUnlocks();
    ctx.actions.renderUnlocks();
  }

  function startChallengeRollAnimation() {
    const activeRoll = ctx.challengeUi.activeRoll;

    if (
      !activeRoll ||
      activeRoll.phase !== "rolling" ||
      activeRoll.animationStarted
    ) {
      return;
    }

    const stage = document.querySelector(
      `.roulette-stage.rolling[data-challenge-id="${activeRoll.challengeId}"]`
    );

    const strip = stage?.querySelector(".roulette-strip");
    const target = stage?.querySelector(".roulette-item.target");

    if (!stage || !strip || !target) return;

    activeRoll.animationStarted = true;

    const targetCenter = target.offsetLeft + target.offsetWidth / 2;
    const stageCenter = stage.clientWidth / 2;
    const destination = stageCenter - targetCenter;

    const overshoot = Math.min(
      50,
      Math.max(24, target.offsetWidth * 0.35)
    );

    const animation = strip.animate(
      [
        {
          transform: "translateX(0)"
        },
        {
          transform: `translateX(${destination}px)`
        }
      ],
      {
        duration: CHALLENGE_ROLL_DURATION_MS,
        easing: "cubic-bezier(0.08, 0.7, 0.12, 1)",
        fill: "forwards"
      }
    );

    animation.onfinish = () => {
      window.setTimeout(
        finalizeChallengeRoll,
        CHALLENGE_ROLL_RESULT_HOLD_MS
      );
    };
  }

  function tickChallengeCountdown() {
    if (!ctx.challengeUi.activeRoll || ctx.challengeUi.activeRoll.phase !== "countdown") {
      clearChallengeCountdownTimer();
      return;
    }

    ctx.challengeUi.activeRoll.countdown -= 1;
    if (ctx.challengeUi.activeRoll.countdown <= 0) {
      ctx.challengeUi.activeRoll.phase = "rolling";
      ctx.challengeUi.activeRoll.countdown = 0;
      clearChallengeCountdownTimer();
    }

    renderChallengeUnlocks();
  }

  function completeChallengeRoll(challenge) {
    if (ctx.challengeUi.activeRoll) return;
    const challengeId = challenge.id;
    const rewards = challengeRewardItems(challenge);
    if (!rewards.length) return;

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    const reel = buildChallengeReel(rewards, reward.id);
    ctx.challengeUi.activeRoll = {
      challengeId,
      rewardId: reward.id,
      phase: "countdown",
      countdown: CHALLENGE_COUNTDOWN_SECONDS,
      animationStarted: false,
      ...reel
    };

    clearChallengeCountdownTimer();
    ctx.challengeUi.countdownTimer = window.setInterval(tickChallengeCountdown, 1000);
    renderChallengeUnlocks();
  }

  function recordMilestoneCompletion(challenge) {
    const current = ctx.state.challengeCompletions[challenge.id] ?? 0;
    if (current >= challenge.completionTarget) return;
    const next = current + 1;
    ctx.state.challengeCompletions[challenge.id] = next;
    if (next >= challenge.completionTarget) challenge.rewardIds.forEach((id) => {
      if (!ctx.domain.challengeRewardIsUnlocked(id)) ctx.state.challengeRewardUnlocks.push(id);
    });
    ctx.actions.saveState();
    renderChallengeUnlocks();
    ctx.actions.renderUnlocks();
  }

  function renderMilestonePanel(challenge, completions) {
    const complete = completions >= challenge.completionTarget;
    return `
      <div class="challenge-milestone-panel"><div class="challenge-roll-header">
        <div><h4>Challenge Progress</h4><span>${complete ? "Reward unlocked" : `${completions} of ${challenge.completionTarget} completions`}</span></div>
        <button type="button" data-action="complete" ${complete ? "disabled" : ""}>${complete ? "Completed" : "Record Completion"}</button>
      </div><div class="challenge-milestone-track">${Array.from({ length: challenge.completionTarget }, (_, i) => `<span class="${i < completions ? "is-complete" : ""}">${i + 1}</span>`).join("")}</div></div>`;
  }

  function renderChallengeUnlockCard(challenge) {
    const card = document.createElement("article");
    const completions = ctx.state.challengeCompletions[challenge.id] ?? 0;
    const latest = itemByCollectionId(ctx.state.challengeRolls[challenge.id]);
    const rolling = ctx.challengeUi.activeRoll?.challengeId === challenge.id;
    const rollLabel = rolling ? (ctx.challengeUi.activeRoll.phase === "countdown" ? `Rolling in ${ctx.challengeUi.activeRoll.countdown}` : "Rolling...") : "Complete + Roll";
    const roulette = `<div class="challenge-roll-panel"><div class="challenge-roll-header">
      <div><h4>Perilous Moons Roulette</h4><span>${latest ? `Latest roll: ${ctx.actions.escapeHtml(latest.name)}` : "No rolls yet"}</span></div>
      <button type="button" data-action="roll" ${challengeRewardItems(challenge).length && !ctx.challengeUi.activeRoll ? "" : "disabled"}>${rollLabel}</button>
      </div>${renderRewardRoulette(challenge)}</div>`;
    card.className = "challenge-unlock-card";
    card.innerHTML = `<div class="challenge-unlock-header"><div><span class="challenge-eyebrow">PvP unlock challenge</span><h3>${ctx.actions.escapeHtml(challenge.title)}</h3></div>
      <span class="challenge-completions">${completions} completion${completions === 1 ? "" : "s"}</span></div>
      <div class="challenge-shop-card"><div class="challenge-kit">${renderChallengeIconGrid(challenge.requirementGroups)}</div><div class="challenge-copy">
      <ul>${challenge.rules.map((rule) => `<li>${ctx.actions.escapeHtml(rule)}</li>`).join("")}</ul>
      ${challenge.disclaimer ? `<p class="challenge-disclaimer">${ctx.actions.escapeHtml(challenge.disclaimer)}</p>` : ""}</div></div>
      ${challenge.mode === "roulette" ? roulette : renderMilestonePanel(challenge, completions)}
      <div class="challenge-unlocked-panel"><h4>Unlocked From This Challenge</h4>${renderChallengeUnlockedRewards(challenge)}</div>`;
    card.querySelector('[data-action="roll"]')?.addEventListener("click", () => completeChallengeRoll(challenge));
    card.querySelector('[data-action="complete"]')?.addEventListener("click", () => recordMilestoneCompletion(challenge));
    return card;
  }
  function renderChallengeUnlocks() {
    const target = document.getElementById("challengeUnlockList");
    if (!target) return;

    target.innerHTML = "";
    ctx.config.challengeCatalog.forEach((challenge) => target.appendChild(renderChallengeUnlockCard(challenge)));
    if (ctx.challengeUi.activeRoll?.phase === "rolling") {
      window.requestAnimationFrame(startChallengeRollAnimation);
    }
  }

  return {
    renderChallengeUnlocks,
    clearChallengeCountdownTimer
  };
}
