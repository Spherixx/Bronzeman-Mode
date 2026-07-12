import { PERILOUS_MOONS_REWARD_IDS, TALENT_TIER_REQUIREMENT } from "./config.js";

export function createDomain(ctx) {
  function challengeId(type, stageOrIndex, index) {
    return index === undefined ? `${type}-${stageOrIndex}` : `${type}-${stageOrIndex}-${index}`;
  }

  function challengeTitle(challenge) {
    return typeof challenge === "string" ? challenge : challenge.title;
  }

  function challengePoints(challenge) {
    return typeof challenge === "string" ? 1 : challenge.points ?? 1;
  }

  function flattenPvmChallenges() {
    return ctx.data.challenges.pvm.flatMap((group, groupIndex) =>
      group.items.flatMap((challenge, index) => challenge.repeatable ? [] : [{
        id: challenge.id || challengeId("pvm", groupIndex, index),
        legacyId: challenge.legacyId || challengeId("pvm", groupIndex, index),
        title: challengeTitle(challenge),
        points: challengePoints(challenge),
        stage: group.stage,
        killRequirement: group.killRequirement
      }])
    );
  }

  function flattenRepeatables() {
    return ctx.data.challenges.pvm.flatMap((group, groupIndex) =>
      group.items.flatMap((challenge, index) => challenge.repeatable ? [{
        id: challenge.id || challengeId("repeatable", groupIndex, index),
        legacyId: challenge.legacyId || challengeId("pvm", groupIndex, index),
        title: challengeTitle(challenge),
        cost: challenge.cost ?? 5,
        stage: group.stage
      }] : [])
    );
  }

  function flattenPvpChallenges() {
    return ctx.data.challenges.pvp.map((challenge, index) => ({
      id: challenge.id || challengeId("pvp", index),
      legacyId: challenge.legacyId || challengeId("pvp", index),
      title: challengeTitle(challenge),
      points: challengePoints(challenge)
    }));
  }

  function totalCompleted() {
    const validCompleted = new Set([...flattenPvmChallenges(), ...flattenPvpChallenges()].map((challenge) => challenge.id));
    return ctx.state.completed.filter((id) => validCompleted.has(id)).length;
  }

  function earnedUnlockPoints() {
    return [...flattenPvmChallenges(), ...flattenPvpChallenges()].reduce((sum, challenge) => {
      return sum + (ctx.state.completed.includes(challenge.id) ? challenge.points : 0);
    }, 0);
  }

  function totalSpent() {
    return ctx.state.purchased.reduce((sum, id) => {
      const unlock = ctx.data.unlocks.find((item) => item.id === id);
      return sum + (unlock?.cost ?? 0);
    }, 0);
  }

  function availablePoints() {
    return earnedUnlockPoints() - totalSpent();
  }

  function totalShopSpent() {
    return ctx.data.shopItems.reduce((sum, item) => sum + ((ctx.state.shopPurchases[item.id] ?? 0) * item.cost), 0);
  }

  function totalRepeatableSpent() {
    return flattenRepeatables().reduce((sum, item) => sum + ((ctx.state.repeatablePurchases[item.id] ?? 0) * item.cost), 0);
  }

  function availableKillPoints() {
    return Math.max(0, ctx.state.playerKills - totalShopSpent() - totalRepeatableSpent());
  }

  function purchasedInTier(tier) {
    return ctx.data.unlocks.filter((unlock) => unlock.tier === tier && ctx.state.purchased.includes(unlock.id)).length;
  }

  function tierRequirementProgress(tier) {
    if (tier <= 1) return { required: 0, purchased: 0, unlocked: true };
    const purchased = purchasedInTier(tier - 1);
    const required = TALENT_TIER_REQUIREMENT;
    return { required, purchased, unlocked: purchased >= required };
  }

  function canBuy(unlock) {
    return !ctx.state.purchased.includes(unlock.id) && tierRequirementProgress(unlock.tier).unlocked && availablePoints() >= unlock.cost;
  }

  function lockReason(unlock) {
    if (ctx.state.purchased.includes(unlock.id)) return "Purchased - click to refund";
    const tierProgress = tierRequirementProgress(unlock.tier);
    if (!tierProgress.unlocked) return `Buy ${tierProgress.required - tierProgress.purchased} more tier ${unlock.tier - 1} talents`;
    if (availablePoints() < unlock.cost) return `Need ${unlock.cost - availablePoints()} more talent points`;
    return "Available to buy";
  }

  function setChallengeCompleted(id, checked) {
    if (checked) {
      if (!ctx.state.completed.includes(id)) ctx.state.completed.push(id);
    } else {
      ctx.state.completed = ctx.state.completed.filter((item) => item !== id);
    }
  }

  function setBasicUnlockChecked(id, checked) {
    if (checked) {
      if (!ctx.state.basicUnlocks.includes(id)) ctx.state.basicUnlocks.push(id);
    } else {
      ctx.state.basicUnlocks = ctx.state.basicUnlocks.filter((item) => item !== id);
    }
  }

  function buyUnlock(id) {
    const unlock = ctx.data.unlocks.find((item) => item.id === id);
    if (!unlock || !canBuy(unlock)) return;
    ctx.state.purchased.push(id);
    ctx.actions.saveState();
    ctx.actions.renderStats();
    ctx.actions.updateTalentTreeState();
    ctx.actions.renderUnlocks();
  }

  function refundUnlock(id) {
    ctx.state.purchased = ctx.state.purchased.filter((item) => item !== id);
    ctx.actions.saveState();
    ctx.actions.renderStats();
    ctx.actions.updateTalentTreeState();
    ctx.actions.renderUnlocks();
  }

  function challengeRewardIsUnlocked(id) {
    return ctx.state.challengeRewardUnlocks.includes(id);
  }

  function mergeCountMaps(first, second) {
    const merged = { ...first };
    Object.entries(second).forEach(([id, count]) => {
      merged[id] = Math.max(merged[id] ?? 0, count);
    });
    return merged;
  }

  function sanitizeState(rawState) {
    const validUnlocks = new Set(ctx.data.unlocks.map((unlock) => unlock.id));
    const validShopItems = new Set(ctx.data.shopItems.map((item) => item.id));
    const validChallenges = new Set([...flattenPvmChallenges(), ...flattenPvpChallenges()].map((challenge) => challenge.id));
    const repeatables = flattenRepeatables();
    const validRepeatables = new Set(repeatables.map((repeatable) => repeatable.id));
    const validChallengeUnlocks = new Set(PERILOUS_MOONS_REWARD_IDS);
    const validChallengeIds = new Set(ctx.config.challengeCatalog.map((challenge) => challenge.id));
    const shopPurchases = {};
    const repeatablePurchases = {};
    const challengeCompletions = {};
    const challengeRolls = {};

    Object.entries(rawState?.shopPurchases ?? {}).forEach(([id, count]) => {
      if (validShopItems.has(id) && Number.isFinite(count)) {
        shopPurchases[id] = Math.max(shopPurchases[id] ?? 0, Math.floor(count));
      }
    });

    if (Array.isArray(rawState?.purchased) && rawState.purchased.includes("trouver")) {
      shopPurchases.trouver = Math.max(shopPurchases.trouver ?? 0, 1);
    }

    Object.entries(rawState?.repeatablePurchases ?? {}).forEach(([id, count]) => {
      const nextId = ctx.indexes.repeatableIdAliases[id] ?? id;
      if (validRepeatables.has(nextId) && Number.isFinite(count)) {
        repeatablePurchases[nextId] = Math.max(repeatablePurchases[nextId] ?? 0, Math.floor(count));
      }
    });

    if (Array.isArray(rawState?.completed)) {
      repeatables.forEach((repeatable) => {
        if (rawState.completed.includes(repeatable.legacyId)) {
          repeatablePurchases[repeatable.id] = Math.max(repeatablePurchases[repeatable.id] ?? 0, 1);
        }
      });
    }

    const basicUnlocks = Array.isArray(rawState?.basicUnlocks)
      ? [...new Set(rawState.basicUnlocks)].filter((id) => typeof id === "string" && id.length)
      : [];

    Object.entries(rawState?.challengeCompletions ?? {}).forEach(([id, count]) => {
      if (validChallengeIds.has(id) && Number.isFinite(count)) {
        challengeCompletions[id] = Math.max(0, Math.floor(count));
      }
    });

    Object.entries(rawState?.challengeRolls ?? {}).forEach(([id, rewardId]) => {
      if (validChallengeIds.has(id) && validChallengeUnlocks.has(rewardId)) {
        challengeRolls[id] = rewardId;
      }
    });

    const challengeRewardUnlocks = Array.isArray(rawState?.challengeRewardUnlocks)
      ? [...new Set(rawState.challengeRewardUnlocks)].filter((id) => validChallengeUnlocks.has(id))
      : [];

    return {
      completed: Array.isArray(rawState?.completed)
        ? [...new Set(rawState.completed.map((id) => ctx.indexes.challengeIdAliases[id] ?? id))].filter((id) => validChallenges.has(id))
        : [],
      purchased: Array.isArray(rawState?.purchased)
        ? [...new Set(rawState.purchased)].filter((id) => validUnlocks.has(id))
        : [],
      shopPurchases,
      repeatablePurchases,
      basicUnlocks,
      challengeCompletions,
      challengeRewardUnlocks,
      challengeRolls,
      playerKills: Number.isFinite(rawState?.playerKills) ? Math.max(0, Math.floor(rawState.playerKills)) : 0
    };
  }

  function mergeStates(localState, remoteState) {
    const local = sanitizeState(localState);
    const remote = sanitizeState(remoteState);
    const shopPurchases = { ...local.shopPurchases };
    const challengeCompletions = { ...local.challengeCompletions };

    Object.entries(remote.shopPurchases).forEach(([id, count]) => {
      shopPurchases[id] = Math.max(shopPurchases[id] ?? 0, count);
    });

    Object.entries(remote.challengeCompletions).forEach(([id, count]) => {
      challengeCompletions[id] = Math.max(challengeCompletions[id] ?? 0, count);
    });

    return sanitizeState({
      completed: [...local.completed, ...remote.completed],
      purchased: [...local.purchased, ...remote.purchased],
      shopPurchases,
      repeatablePurchases: mergeCountMaps(local.repeatablePurchases, remote.repeatablePurchases),
      basicUnlocks: [...local.basicUnlocks, ...remote.basicUnlocks],
      challengeCompletions,
      challengeRewardUnlocks: [...local.challengeRewardUnlocks, ...remote.challengeRewardUnlocks],
      challengeRolls: { ...local.challengeRolls, ...remote.challengeRolls },
      playerKills: Math.max(local.playerKills, remote.playerKills)
    });
  }

  return {
    challengeId,
    challengeTitle,
    challengePoints,
    flattenPvmChallenges,
    flattenRepeatables,
    flattenPvpChallenges,
    totalCompleted,
    earnedUnlockPoints,
    totalSpent,
    availablePoints,
    totalShopSpent,
    totalRepeatableSpent,
    availableKillPoints,
    purchasedInTier,
    tierRequirementProgress,
    canBuy,
    lockReason,
    setChallengeCompleted,
    setBasicUnlockChecked,
    buyUnlock,
    refundUnlock,
    challengeRewardIsUnlocked,
    sanitizeState,
    mergeStates
  };
}
