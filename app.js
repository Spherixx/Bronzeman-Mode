const STORAGE_KEY = "bronzeman-point-challenges-v2";

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
  barrelchest: wikiImage("Barrelchest anchor.png"),
  gmaul: wikiImage("Granite maul.png"),
  ornateMaul: wikiImage("Ornate maul handle.png"),
  dds: wikiImage("Dragon dagger(p++).png"),
  msb: wikiImage("Magic shortbow (i).png"),
  rcb: wikiImage("Rune crossbow.png"),
  darkBow: wikiImage("Dark bow.png"),
  ancientMace: wikiImage("Ancient mace.png"),
  dragonThrownaxe: wikiImage("Dragon thrownaxe.png"),
  dragonKnife: wikiImage("Dragon knife(p++).png"),
  amethystArrow: wikiImage("Amethyst arrow.png"),
  dragonBolt: wikiImage("Dragonstone dragon bolts (e) 5.png"),
  voidwaker: wikiImage("Voidwaker.png"),
  accursed: wikiImage("Accursed sceptre.png"),
  webweaver: wikiImage("Webweaver bow.png"),
  chainmace: wikiImage("Ursine chainmace.png"),
  toxicStaff: wikiImage("Toxic staff of the dead.png"),
  zamorakGodsword: wikiImage("Zamorak godsword.png"),
  blood: wikiImage("Blood rune.png"),
  death: wikiImage("Death rune.png"),
  water: wikiImage("Water rune.png"),
  law: wikiImage("Law rune.png"),
  chaos: wikiImage("Chaos rune.png"),
  coins: wikiImage("Coins 10000.png"),
  stamina: wikiImage("Stamina potion(4).png"),
  brew: wikiImage("Saradomin brew(4).png"),
  restore: wikiImage("Super restore(4).png"),
  ranging: wikiImage("Ranging potion(4).png"),
  superCombat: wikiImage("Super combat potion(4).png"),
  antivenom: wikiImage("Anti-venom+(4).png"),
  shark: wikiImage("Shark.png"),
  angler: wikiImage("Anglerfish.png"),
  karambwan: wikiImage("Cooked karambwan.png"),
  pineapplePizza: wikiImage("Pineapple pizza.png"),
  blightedManta: wikiImage("Blighted manta ray.png"),
  blightedRestore: wikiImage("Blighted super restore(4).png"),
  blightedEntangle: wikiImage("Blighted entangle sack.png"),
  blightedTeleport: wikiImage("Blighted teleport spell sack.png"),
  seedPod: wikiImage("Royal seed pod.png"),
  lootingBag: wikiImage("Looting bag.png"),
  revenantEther: wikiImage("Revenant ether.png"),
  bracelet: wikiImage("Bracelet of ethereum.png")
};

const challenges = {
  pvm: [
    {
      stage: "Early",
      killRequirement: 25,
      items: [
        "Get a looting bag from Wilderness monsters",
        "Get a dragon longsword from Zombie Pirates",
        "Get a rune crossbow from Crazy Archaeologist",
        "Get a god cape from Mage Arena",
        "Thieve from Rogue's Castle chest",
        "Complete 100 Wilderness laps in one trip",
        "Complete 25 Wilderness Slayer tasks",
        "Get 25 KC at Chaos Fanatic",
        "Get 25 KC at Scorpia",
        "100 KC each baby Wilderness boss"
      ]
    },
    {
      stage: "Mid",
      killRequirement: 50,
      items: [
        "Get Fire Cape with challenge gear",
        "Get Mage Arena 2 cape with challenge gear",
        "Complete Wilderness Hard Diaries",
        "Complete a Wilderness shield",
        "Get a dragon pickaxe drop",
        "PvM a Wilderness weapon",
        "Get 100 KC Chaos Elemental",
        "Complete 50 duo Wilderness Slayer tasks",
        "Get a revenant unique drop",
        "Get a ring of wealth scroll from Wilderness content"
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
        "100 KC each Wilderness boss",
        "PK a craw's bow, viggora's chainmace, or accursed sceptre",
        "Build a full revenant ether stack",
        "Get a full Dagon'hai set from Larran's keys",
        "Complete 250 Wilderness Slayer tasks",
        "Win a boss room tank test while skulled"
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
    "Anti-PK a 10m+ kill",
    "Get a KO with Barrelchest anchor",
    "Get a KO with ancient mace smite tech",
    "Get a dark bow spec kill",
    "Get a dragon thrownaxe stack kill",
    "Get a poison dragon dagger kill",
    "Kill someone using amethyst arrows",
    "Win a fight with a budget xerician set",
    "Get a kill after landing teleblock",
    "Get a kill while risking under 500k",
    "Get a kill while risking over 10m",
    "Escape a multi team with a key",
    "Anti-rush a rusher",
    "Kill a player at Chaos Altar",
    "Kill a player in Revenant Caves",
    "Win a no-overhead honor fight"
  ]
};

const unlocks = [
  { id: "void", name: "Void", cost: 1, tier: 1, requires: [], image: itemImages.void },
  { id: "torso", name: "Fighter Torso", cost: 1, tier: 1, requires: [], image: itemImages.torso },
  { id: "defenders", name: "Defenders", cost: 1, tier: 1, requires: [], image: itemImages.defenders },
  { id: "rcb", name: "Rune Crossbow", cost: 1, tier: 1, requires: [], image: itemImages.rcb },
  { id: "dds", name: "DDS", cost: 1, tier: 1, requires: [], image: itemImages.dds },

  { id: "firecape", name: "Fire Cape", cost: 2, tier: 2, requires: ["void"], image: itemImages.fireCape },
  { id: "ma2-cape", name: "MA2 Cape", cost: 2, tier: 2, requires: ["void"], image: itemImages.ma2Cape },
  { id: "msb", name: "MSB(i)", cost: 2, tier: 2, requires: ["rcb"], image: itemImages.msb },
  { id: "amethyst", name: "Amethyst Ammo", cost: 2, tier: 2, requires: ["rcb"], image: itemImages.amethystArrow },
  { id: "trouver", name: "Trouver Parchment", cost: 2, tier: 2, requires: ["defenders"], image: itemImages.trouver },

  { id: "gmaul", name: "Granite Maul", cost: 3, tier: 3, requires: ["dds", "torso"], image: itemImages.gmaul },
  { id: "anchor", name: "Barrelchest Anchor", cost: 3, tier: 3, requires: ["torso"], image: itemImages.barrelchest },
  { id: "dark-bow", name: "Dark Bow", cost: 3, tier: 3, requires: ["msb", "amethyst"], image: itemImages.darkBow },
  { id: "ancient-mace", name: "Ancient Mace", cost: 3, tier: 3, requires: ["defenders"], image: itemImages.ancientMace },
  { id: "dragon-thrownaxe", name: "Dragon Thrownaxe", cost: 3, tier: 3, requires: ["msb"], image: itemImages.dragonThrownaxe },

  { id: "ornate-maul", name: "Ornate Maul", cost: 4, tier: 4, requires: ["gmaul", "trouver"], image: itemImages.ornateMaul },
  { id: "colossal-barrelchest", name: "Colossal / Anchor", cost: 4, tier: 4, requires: ["firecape", "anchor"], image: itemImages.colossal },
  { id: "toxic-staff", name: "Toxic Staff", cost: 4, tier: 4, requires: ["ma2-cape"], image: itemImages.toxicStaff },
  { id: "zgs", name: "ZGS Freeze", cost: 4, tier: 4, requires: ["firecape"], image: itemImages.zamorakGodsword },
  { id: "dragon-knives", name: "Dragon Knives", cost: 4, tier: 4, requires: ["dragon-thrownaxe"], image: itemImages.dragonKnife },

  { id: "accursed", name: "Accursed Sceptre", cost: 5, tier: 5, requires: ["ma2-cape", "toxic-staff"], image: itemImages.accursed },
  { id: "webweaver", name: "Webweaver Bow", cost: 5, tier: 5, requires: ["dark-bow", "amethyst"], image: itemImages.webweaver },
  { id: "chainmace", name: "Ursine Chainmace", cost: 5, tier: 5, requires: ["ornate-maul", "anchor"], image: itemImages.chainmace },
  { id: "voidwaker", name: "Voidwaker", cost: 6, tier: 5, requires: ["accursed", "webweaver", "chainmace"], image: itemImages.voidwaker }
];

const shopItems = [
  { id: "barrage-runes", name: "Barrage runes", cost: 8, images: [itemImages.blood, itemImages.death, itemImages.water] },
  { id: "tb-runes", name: "TB runes", cost: 5, images: [itemImages.law, itemImages.chaos] },
  { id: "amethyst-arrows", name: "Amethyst arrows", cost: 5, images: [itemImages.amethystArrow] },
  { id: "dragon-bolts", name: "Dragon bolts", cost: 6, images: [itemImages.dragonBolt] },
  { id: "dragon-thrownaxes", name: "Dragon thrownaxes", cost: 7, images: [itemImages.dragonThrownaxe] },
  { id: "dragon-knives", name: "Dragon knives", cost: 7, images: [itemImages.dragonKnife] },
  { id: "stamina-pots", name: "Stamina pots", cost: 5, images: [itemImages.stamina] },
  { id: "combo-food", name: "Combo food", cost: 5, images: [itemImages.shark, itemImages.angler, itemImages.karambwan] },
  { id: "pizza-stack", name: "Pizza stack", cost: 4, images: [itemImages.pineapplePizza, itemImages.karambwan] },
  { id: "brew-restore", name: "Brew restore", cost: 7, images: [itemImages.brew, itemImages.restore] },
  { id: "range-pot", name: "Range pots", cost: 4, images: [itemImages.ranging] },
  { id: "melee-pot", name: "Melee pots", cost: 4, images: [itemImages.superCombat] },
  { id: "venom-kit", name: "Venom kit", cost: 5, images: [itemImages.antivenom, itemImages.dds] },
  { id: "blighted-kit", name: "Blighted kit", cost: 6, images: [itemImages.blightedManta, itemImages.blightedRestore] },
  { id: "snare-sacks", name: "Sacks", cost: 4, images: [itemImages.blightedEntangle, itemImages.blightedTeleport] },
  { id: "ether-bracelet", name: "Rev cave kit", cost: 8, images: [itemImages.bracelet, itemImages.revenantEther] },
  { id: "escape-kit", name: "Escape kit", cost: 6, images: [itemImages.seedPod, itemImages.stamina] },
  { id: "death-coffer", name: "Death coffer", cost: 10, images: [itemImages.coins] }
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
  pointReward.textContent = locked ? "Locked" : "+1 BP";
  label.title = locked ? "Locked" : "";

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
          <span>${group.stage}</span>
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
    label.innerHTML = `<b>TIER ${tierNumber}</b> | ${tierNumber === 1 ? "BASE" : tierNumber === maxTier ? "ENDGAME" : "POWER"}`;
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
