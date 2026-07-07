const STORAGE_KEY = "bronzeman-point-challenges-v2";

/*
  BALANCE SETTINGS:
  - Completed challenges award one Bronzeman Point for the talent tree.
  - Player kills award one Kill Point for the consumable shop.
  - PvM challenges can require player kill milestones before they can be checked off.
*/

function wikiImage(fileName) {
  return `https://oldschool.runescape.wiki/w/Special:FilePath/${encodeURIComponent(fileName)}`;
}

const itemImages = {
  void: wikiImage("Void knight top.png"),
  torso: wikiImage("Fighter torso.png"),
  defenders: wikiImage("Dragon defender.png"),
  fireCape: wikiImage("Fire cape.png"),
  ma2Cape: wikiImage("Imbued saradomin cape.png"),
  trouver: wikiImage("Trouver parchment.png"),
  colossal: wikiImage("Colossal blade.png"),
  gmaul: wikiImage("Granite maul.png"),
  arkan: wikiImage("Arkan blade.png"),
  blood: wikiImage("Blood rune.png"),
  death: wikiImage("Death rune.png"),
  water: wikiImage("Water rune.png"),
  coins: wikiImage("Coins 10000.png"),
  runeArrow: wikiImage("Rune arrow.png"),
  dragonBolt: wikiImage("Dragonstone dragon bolts (e) 5.png"),
  stamina: wikiImage("Stamina potion(4).png"),
  brew: wikiImage("Saradomin brew(4).png"),
  restore: wikiImage("Super restore(4).png"),
  shark: wikiImage("Shark.png"),
  angler: wikiImage("Anglerfish.png"),
  karambwan: wikiImage("Cooked karambwan.png"),
  seedPod: wikiImage("Royal seed pod.png")
};
const challenges = {
  pvm: [
    {
      stage: "Early",
      killRequirement: 25,
      items: [
        "Get a dragon longsword from Zombie Pirates",
        "Complete a Wilderness shield",
        "Reach 70 Slayer through Wilderness Slayer",
        "Thieve from Rogue's Castle chest",
        "Complete 100 Wilderness laps in one trip",
        "100 KC each baby Wilderness boss"
      ]
    },
    {
      stage: "Mid",
      killRequirement: 50,
      items: [
        "Get Fire Cape with gear from challenge",
        "Get Mage Arena 2 cape with gear from challenge",
        "Complete Wilderness Hard Diaries",
        "Complete 50 duo Wilderness Slayer tasks",
        "PvM a Wilderness weapon",
        "100 KC Chaos Elemental"
      ]
    },
    {
      stage: "Late",
      killRequirement: 100,
      items: [
        "Complete a Voidwaker",
        "Greenlog a Wilderness boss",
        "Get a Wilderness pet",
        "Complete Wilderness Elite Diaries",
        "100 KC each Wilderness boss"
      ]
    }
  ],
  pvp: [
    "Get your first smite",
    "Smite a 5m+ +1",
    "Smite a 25m+ +1",
    "Get a single key over 10m",
    "Get a single key over 20m",
    "Win an outnumbered fight",
    "Collect 5 keys in one inventory",
    "PK a Wilderness weapon",
    "Loot 50 keys total",
    "Loot 100 keys total",
    "Skulltrick someone",
    "Successfully rush someone",
    "Find and farm a bot farm",
    "Anti-PK a 5m+ kill",
    "Anti-PK a 10m+ kill"
  ]
};

const unlocks = [
  { id: "void", name: "Void", cost: 1, tier: 1, requires: [], image: itemImages.void },
  { id: "torso", name: "Fighter Torso", cost: 1, tier: 1, requires: [], image: itemImages.torso },
  { id: "defenders", name: "Defenders", cost: 1, tier: 1, requires: [], image: itemImages.defenders },
  { id: "firecape", name: "Fire Cape", cost: 2, tier: 2, requires: ["void"], image: itemImages.fireCape },
  { id: "ma2-cape", name: "MA2 Cape", cost: 2, tier: 2, requires: ["void"], image: itemImages.ma2Cape },
  { id: "trouver", name: "Trouver Parchment", cost: 2, tier: 2, requires: ["defenders"], image: itemImages.trouver },
  { id: "colossal-barrelchest", name: "Colossal / Barrelchest", cost: 3, tier: 3, requires: ["firecape", "ma2-cape"], image: itemImages.colossal },
  { id: "ornate-maul-gmaul", name: "Ornate Maul / Gmaul", cost: 3, tier: 3, requires: ["trouver", "torso"], image: itemImages.gmaul },
  { id: "arkan-blade", name: "Arkan Blade", cost: 4, tier: 4, requires: ["colossal-barrelchest", "ornate-maul-gmaul"], image: itemImages.arkan }
];

const shopItems = [
  { id: "barrage-runes", name: "Barrage rune set", cost: 8, details: "Blood, death, and water runes for an Ice Barrage trip.", images: [itemImages.blood, itemImages.death, itemImages.water] },
  { id: "rune-arrows", name: "Rune arrow bundle", cost: 4, details: "A stack of rune arrows for budget range setups.", images: [itemImages.runeArrow] },
  { id: "enchanted-bolts", name: "Dragon bolt bundle", cost: 6, details: "Dragonstone dragon bolts (e) for higher-risk trips.", images: [itemImages.dragonBolt] },
  { id: "stamina-pots", name: "Stamina pot set", cost: 5, details: "Stamina potions for caves, lures, escapes, and long chases.", images: [itemImages.stamina] },
  { id: "combo-food", name: "Combo food pack", cost: 5, details: "Sharks, anglers, and karambwans for brid trips.", images: [itemImages.shark, itemImages.angler, itemImages.karambwan] },
  { id: "brew-restore", name: "Brew and restore pack", cost: 7, details: "Saradomin brews and super restores for tank tests.", images: [itemImages.brew, itemImages.restore] },
  { id: "escape-kit", name: "Escape kit", cost: 6, details: "Seed pod plus spare run energy supplies.", images: [itemImages.seedPod, itemImages.stamina] },
  { id: "death-coffer", name: "Death coffer stipend", cost: 10, details: "A small GP stipend for reclaim fees and re-gearing.", images: [itemImages.coins] }
];

const state = loadState();

function defaultState() {
  return { completed: [], purchased: [], shopPurchases: {}, playerKills: 0 };
}

function loadState() {
  const fallback = defaultState();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      completed: Array.isArray(saved?.completed) ? saved.completed : [],
      purchased: Array.isArray(saved?.purchased) ? saved.purchased : [],
      shopPurchases: saved?.shopPurchases && typeof saved.shopPurchases === "object" ? saved.shopPurchases : {},
      playerKills: Number.isFinite(saved?.playerKills) ? Math.max(0, Math.floor(saved.playerKills)) : 0
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function challengeId(type, stageOrIndex, index) {
  return index === undefined ? `${type}-${stageOrIndex}` : `${type}-${stageOrIndex}-${index}`;
}

function flattenPvmChallenges() {
  return challenges.pvm.flatMap((group, groupIndex) =>
    group.items.map((title, index) => ({
      id: challengeId("pvm", groupIndex, index),
      title,
      stage: group.stage,
      killRequirement: group.killRequirement
    }))
  );
}

function flattenPvpChallenges() {
  return challenges.pvp.map((title, index) => ({ id: challengeId("pvp", index), title }));
}

function totalCompleted() {
  return state.completed.length;
}

function totalSpent() {
  return state.purchased.reduce((sum, id) => {
    const unlock = unlocks.find((item) => item.id === id);
    return sum + (unlock?.cost ?? 0);
  }, 0);
}

function availablePoints() {
  return totalCompleted() - totalSpent();
}

function totalShopSpent() {
  return shopItems.reduce((sum, item) => sum + ((state.shopPurchases[item.id] ?? 0) * item.cost), 0);
}

function availableKillPoints() {
  return Math.max(0, state.playerKills - totalShopSpent());
}

function canBuy(unlock) {
  const prerequisitesMet = unlock.requires.every((id) => state.purchased.includes(id));
  return !state.purchased.includes(unlock.id) && prerequisitesMet && availablePoints() >= unlock.cost;
}

function lockReason(unlock) {
  if (state.purchased.includes(unlock.id)) return "Purchased - click to refund";

  const missing = unlock.requires
    .filter((id) => !state.purchased.includes(id))
    .map((id) => unlocks.find((item) => item.id === id)?.name)
    .filter(Boolean);

  if (missing.length) return `Requires: ${missing.join(", ")}`;
  if (availablePoints() < unlock.cost) return `Need ${unlock.cost - availablePoints()} more BP`;
  return "Available to buy";
}

function setChallengeCompleted(id, checked) {
  if (checked) {
    if (!state.completed.includes(id)) state.completed.push(id);
  } else {
    state.completed = state.completed.filter((item) => item !== id);
  }
}

function renderChallengeItem(challenge, target, locked = false) {
  const template = document.getElementById("challengeTemplate");
  const content = template.content.cloneNode(true);
  const input = content.querySelector("input");
  const label = content.querySelector("label");
  const challengeText = content.querySelector(".challenge-text");
  const pointReward = content.querySelector(".point-reward");

  input.checked = state.completed.includes(challenge.id);
  input.id = challenge.id;
  input.disabled = locked;
  challengeText.textContent = challenge.title;
  label.htmlFor = challenge.id;
  label.classList.toggle("locked", locked);

  if (locked) {
    pointReward.textContent = `${challenge.killRequirement} PKs`;
    label.title = `Unlocks at ${challenge.killRequirement} player kills`;
  } else {
    pointReward.textContent = "+1 BP";
    label.title = "";
  }

  input.addEventListener("change", () => {
    setChallengeCompleted(challenge.id, input.checked);
    saveState();
    render();
  });

  target.appendChild(content);
}

function renderPvmChallenges() {
  const target = document.getElementById("pvmList");
  target.innerHTML = "";

  challenges.pvm.forEach((group, groupIndex) => {
    const unlocked = state.playerKills >= group.killRequirement;
    const stage = document.createElement("section");
    stage.className = `challenge-stage ${unlocked ? "unlocked" : "locked"}`;

    const completed = group.items.filter((_, index) => state.completed.includes(challengeId("pvm", groupIndex, index))).length;
    stage.innerHTML = `
      <div class="stage-header">
        <div>
          <span>${group.stage} game</span>
          <strong>${group.killRequirement} PK</strong>
        </div>
        <em>${completed} / ${group.items.length}</em>
      </div>
    `;

    const list = document.createElement("div");
    list.className = "stage-list";

    group.items.forEach((title, index) => {
      renderChallengeItem({ id: challengeId("pvm", groupIndex, index), title, stage: group.stage, killRequirement: group.killRequirement }, list, !unlocked);
    });

    stage.appendChild(list);
    target.appendChild(stage);
  });
}

function renderPvpChallenges() {
  const target = document.getElementById("pvpList");
  target.innerHTML = "";
  flattenPvpChallenges().forEach((challenge) => renderChallengeItem(challenge, target));
}

function renderTalentTree() {
  const tree = document.getElementById("talentTree");
  tree.innerHTML = "";
  const maxTier = Math.max(...unlocks.map((unlock) => unlock.tier));

  for (let tierNumber = 1; tierNumber <= maxTier; tierNumber += 1) {
    const tier = document.createElement("div");
    tier.className = "tier";

    const label = document.createElement("div");
    label.className = "tier-label";
    label.innerHTML = `<b>TIER ${tierNumber}</b> | ${tierNumber === 1 ? "FOUNDATION" : tierNumber === maxTier ? "CAPSTONE" : "ADVANCEMENT"}`;
    tier.appendChild(label);

    unlocks.filter((unlock) => unlock.tier === tierNumber).forEach((unlock) => {
      const purchased = state.purchased.includes(unlock.id);
      const available = canBuy(unlock);
      const button = document.createElement("button");

      button.type = "button";
      button.className = `talent-node ${purchased ? "purchased" : available ? "available" : "locked"}`;
      button.disabled = !purchased && !available;
      button.title = lockReason(unlock);
      button.setAttribute("aria-label", `${unlock.name}. ${lockReason(unlock)}.`);
      button.innerHTML = `
        <span class="node-art"><img src="${unlock.image}" alt="" loading="lazy" /></span>
        <span>
          <span class="node-name">${unlock.name}</span>
        </span>
        <span class="node-cost">${purchased ? "OK" : `${unlock.cost} BP`}</span>
      `;

      button.addEventListener("click", () => {
        if (purchased) refundUnlock(unlock.id);
        else if (available) buyUnlock(unlock.id);
      });

      tier.appendChild(button);
    });

    tree.appendChild(tier);
  }
}

function renderShop() {
  const shop = document.getElementById("shopList");
  shop.innerHTML = "";

  shopItems.forEach((item) => {
    const owned = state.shopPurchases[item.id] ?? 0;
    const canAfford = availableKillPoints() >= item.cost;
    const card = document.createElement("article");
    card.className = `shop-item ${canAfford ? "available" : "locked"}`;
    const images = item.images.map((src) => `<img src="${src}" alt="" loading="lazy" />`).join("");

    card.innerHTML = `
      <div class="shop-art">${images}</div>
      <div class="shop-copy">
        <h3>${item.name}</h3>
        <span>x${owned}</span>
      </div>
      <button type="button" ${canAfford ? "" : "disabled"}>${item.cost} KP</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      if (availableKillPoints() < item.cost) return;
      state.shopPurchases[item.id] = owned + 1;
      saveState();
      render();
    });

    shop.appendChild(card);
  });
}

function buyUnlock(id) {
  const unlock = unlocks.find((item) => item.id === id);
  if (!unlock || !canBuy(unlock)) return;
  state.purchased.push(id);
  saveState();
  render();
}

function refundUnlock(id) {
  const dependentPurchases = unlocks
    .filter((unlock) => unlock.requires.includes(id) && state.purchased.includes(unlock.id))
    .map((unlock) => unlock.name);

  if (dependentPurchases.length) {
    window.alert(`Refund ${dependentPurchases.join(" and ")} first.`);
    return;
  }

  state.purchased = state.purchased.filter((item) => item !== id);
  saveState();
  render();
}

function renderStats() {
  const pvmChallenges = flattenPvmChallenges();
  const pvpChallenges = flattenPvpChallenges();
  const pvmCompleted = pvmChallenges.filter((challenge) => state.completed.includes(challenge.id)).length;
  const pvpCompleted = pvpChallenges.filter((challenge) => state.completed.includes(challenge.id)).length;
  const complete = totalCompleted();
  const total = pvmChallenges.length + pvpChallenges.length;
  const percent = total ? (complete / total) * 100 : 0;

  document.getElementById("availablePoints").textContent = availablePoints();
  document.getElementById("earnedPoints").textContent = complete;
  document.getElementById("spentPoints").textContent = totalSpent();
  document.getElementById("killPoints").textContent = availableKillPoints();
  document.getElementById("playerKills").value = state.playerKills;
  document.getElementById("shopSpent").textContent = totalShopSpent();
  document.getElementById("challengeProgress").textContent = `${complete} / ${total}`;
  document.getElementById("pvmCount").textContent = `${pvmCompleted} / ${pvmChallenges.length}`;
  document.getElementById("pvpCount").textContent = `${pvpCompleted} / ${pvpChallenges.length}`;
  document.getElementById("progressBar").style.width = `${percent}%`;
}

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

function render() {
  renderStats();
  renderPvmChallenges();
  renderPvpChallenges();
  renderTalentTree();
  renderShop();
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});

document.getElementById("playerKills").addEventListener("input", (event) => {
  state.playerKills = Math.max(0, Math.floor(Number(event.target.value) || 0));
  saveState();
  render();
});

document.getElementById("addKillButton").addEventListener("click", () => {
  state.playerKills += 1;
  saveState();
  render();
});

document.getElementById("removeKillButton").addEventListener("click", () => {
  state.playerKills = Math.max(0, state.playerKills - 1);
  saveState();
  render();
});

document.getElementById("resetButton").addEventListener("click", () => {
  const shouldReset = window.confirm("Reset all completed challenges, unlocks, kills, and shop purchases?");
  if (!shouldReset) return;
  Object.assign(state, defaultState());
  saveState();
  render();
});

showTab("tasks");
render();



