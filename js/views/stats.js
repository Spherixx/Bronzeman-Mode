export function createStatsView(ctx) {
  function renderStats() {
    const pvmChallenges = ctx.domain.flattenPvmChallenges();
    const pvpChallenges = ctx.domain.flattenPvpChallenges();
    const repeatables = ctx.domain.flattenRepeatables();
    const pvmCompleted = pvmChallenges.filter((challenge) => ctx.state.completed.includes(challenge.id)).length;
    const pvpCompleted = pvpChallenges.filter((challenge) => ctx.state.completed.includes(challenge.id)).length;
    const pvmPoints = pvmChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
    const pvpPoints = pvpChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
    const pvmEarnedPoints = pvmChallenges.reduce((sum, challenge) => sum + (ctx.state.completed.includes(challenge.id) ? challenge.points : 0), 0);
    const pvpEarnedPoints = pvpChallenges.reduce((sum, challenge) => sum + (ctx.state.completed.includes(challenge.id) ? challenge.points : 0), 0);
    const repeatablePurchased = repeatables.reduce((sum, repeatable) => sum + (ctx.state.repeatablePurchases[repeatable.id] ?? 0), 0);
    const complete = ctx.domain.totalCompleted();
    const total = pvmChallenges.length + pvpChallenges.length;
    const percent = total ? (complete / total) * 100 : 0;

    document.getElementById("availablePoints").textContent = ctx.domain.availablePoints();
    document.getElementById("earnedPoints").textContent = ctx.domain.earnedUnlockPoints();
    document.getElementById("spentPoints").textContent = ctx.domain.totalSpent();
    document.getElementById("killPoints").textContent = ctx.domain.availableKillPoints();
    document.getElementById("killsEarned").textContent = ctx.state.playerKills;
    document.getElementById("playerKills").value = ctx.state.playerKills;
    document.getElementById("shopSpent").textContent = ctx.domain.totalShopSpent() + ctx.domain.totalRepeatableSpent();
    document.getElementById("challengeProgress").textContent = `${complete} / ${total}`;
    document.getElementById("repeatableCount").textContent = `${repeatablePurchased} bought`;
    document.getElementById("pvmCount").textContent = `${pvmCompleted} / ${pvmChallenges.length} tasks | ${pvmEarnedPoints} / ${pvmPoints} points`;
    document.getElementById("pvpCount").textContent = `${pvpCompleted} / ${pvpChallenges.length} tasks | ${pvpEarnedPoints} / ${pvpPoints} points`;
    document.getElementById("progressBar").style.width = `${percent}%`;
  }

  return { renderStats };
}
