import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCJJcebfEGU-30NVNRQdPRWQK-VxmOO-E",
  authDomain: "bronzeman-mode-92e21.firebaseapp.com",
  projectId: "bronzeman-mode-92e21",
  storageBucket: "bronzeman-mode-92e21.firebasestorage.app",
  messagingSenderId: "648123215246",
  appId: "1:648123215246:web:82190b7dd128fe8c4b88df"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
const STORAGE_KEY = "bronzeman-point-challenges-v2";

function wikiImage(fileName) {
  return `https://oldschool.runescape.wiki/w/Special:FilePath/${encodeURIComponent(fileName)}`;
}

function task(title, points = 1) {
  return { title, points };
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
  arkanBlade: wikiImage("Arkan blade.png"),
  dds: wikiImage("Dragon dagger(p++).png"),
  msb: wikiImage("Magic shortbow (i).png"),
  rcb: wikiImage("Rune crossbow.png"),
  darkBow: wikiImage("Dark bow.png"),
  seekerArrow: wikiImage("Seeker arrow.png"),
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
  liquidAdrenaline: wikiImage("Liquid adrenaline.png"),
  lootKey: wikiImage("Loot key.png"),
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
  revenantEther: wikiImage("Revenant ether.png"),
  bracelet: wikiImage("Bracelet of ethereum.png")
};

const challenges = {
  pvm: [
    {
      stage: "Early",
      killRequirement: 25,
      items: [
        task("Get a looting bag from Wilderness monsters"),
        task("Get a dragon longsword from Zombie Pirates"),
        task("Get a rune crossbow from Crazy Archaeologist"),
        task("Get a god cape from Mage Arena"),
        task("Thieve from Rogue's Castle chest"),
        task("Complete 100 Wilderness laps in one trip", 2),
        task("Complete 25 Wilderness Slayer tasks", 2),
        task("Get 25 KC at Chaos Fanatic"),
        task("Get 25 KC at Scorpia"),
        task("100 KC each baby Wilderness boss", 2)
      ]
    },
    {
      stage: "Mid",
      killRequirement: 50,
      items: [
        task("Get Fire Cape with challenge gear", 2),
        task("Get Mage Arena 2 cape with challenge gear", 2),
        task("Complete Wilderness Hard Diaries", 2),
        task("Complete a Wilderness shield", 2),
        task("Get a dragon pickaxe drop", 2),
        task("PvM a Wilderness weapon", 2),
        task("Get 100 KC Chaos Elemental", 2),
        task("Complete 50 duo Wilderness Slayer tasks", 2),
        task("Get a revenant unique drop", 2),
        task("Get a ring of wealth scroll from Wilderness content")
      ]
    },
    {
      stage: "Late",
      killRequirement: 100,
      items: [
        task("Complete a Voidwaker", 3),
        task("Greenlog a Wilderness boss", 3),
        task("Get a Wilderness pet", 3),
        task("Complete Wilderness Elite Diaries", 3),
        task("100 KC each Wilderness boss", 3),
        task("PK a craw's bow, viggora's chainmace, or accursed sceptre", 2),
        task("Build a full revenant ether stack", 2),
        task("Get a full Dagon'hai set from Larran's keys", 3),
        task("Complete 250 Wilderness Slayer tasks", 3),
        task("Win a boss room tank test while skulled", 2)
      ]
    }
  ],
  pvp: [
    task("Get your first smite"),
    task("Smite a 5m+ +1", 2),
    task("Smite a 25m+ +1", 3),
    task("Get a single key over 10m", 2),
    task("Get a single key over 20m", 3),
    task("Win an outnumbered fight", 2),
    task("Collect 5 keys in one inventory", 2),
    task("PK a Wilderness weapon", 2),
    task("Loot 50 keys total", 2),
    task("Loot 100 keys total", 3),
    task("Skulltrick someone", 2),
    task("Successfully rush someone"),
    task("Find and farm a bot farm"),
    task("Anti-PK a 5m+ kill", 2),
    task("Anti-PK a 10m+ kill", 3),
    task("Get a KO with Barrelchest anchor", 2),
    task("Get a KO with ancient mace smite tech", 2),
    task("Get a dark bow spec kill"),
    task("Get a dragon thrownaxe stack kill", 2),
    task("Get a poison dragon dagger kill"),
    task("Kill someone using amethyst arrows"),
    task("Win a fight with a budget xerician set"),
    task("Get a kill after landing teleblock"),
    task("Get a kill while risking under 500k"),
    task("Get a kill while risking over 10m", 3),
    task("Escape a multi team with a key", 2),
    task("Anti-rush a rusher", 2),
    task("Kill a player at Chaos Altar"),
    task("Kill a player in Revenant Caves"),
    task("Win a no-overhead honor fight", 2)
  ]
};

const unlocks = [
  { id: "seed-pod", name: "Seed Pod", cost: 1, tier: 1, requires: [], images: [itemImages.seedPod] },
  { id: "rcb", name: "Rune Crossbow", cost: 1, tier: 1, requires: [], images: [itemImages.rcb] },
  { id: "dds", name: "DDS", cost: 1, tier: 1, requires: [], images: [itemImages.dds] },
  { id: "arkan-blade", name: "Arkan Blade", cost: 1, tier: 1, requires: [], images: [itemImages.arkanBlade] },

  { id: "void", name: "Void", cost: 2, tier: 2, requires: [], images: [itemImages.void] },
  { id: "torso", name: "Fighter Torso", cost: 2, tier: 2, requires: [], images: [itemImages.torso] },
  { id: "defenders", name: "Defenders", cost: 2, tier: 2, requires: [], images: [itemImages.defenders] },
  { id: "msb", name: "MSB(i)", cost: 2, tier: 2, requires: [], images: [itemImages.msb] },
  { id: "trouver", name: "Trouver Parchment", cost: 2, tier: 2, requires: [], images: [itemImages.trouver] },

  { id: "firecape", name: "Fire Cape", cost: 3, tier: 3, requires: [], images: [itemImages.fireCape] },
  { id: "ma2-cape", name: "MA2 Cape", cost: 3, tier: 3, requires: [], images: [itemImages.ma2Cape] },
  { id: "surge-potions", name: "Surge Potions", cost: 3, tier: 3, requires: [], images: [itemImages.liquidAdrenaline] },
  { id: "dragon-knives", name: "Dragon Knives", cost: 3, tier: 3, requires: [], images: [itemImages.dragonKnife] },
  { id: "ancient-mace", name: "Ancient Mace", cost: 3, tier: 3, requires: [], images: [itemImages.ancientMace] },

  { id: "gmaul", name: "Granite Maul", cost: 4, tier: 4, requires: [], images: [itemImages.gmaul] },
  { id: "anchor", name: "Barrelchest Anchor", cost: 4, tier: 4, requires: [], images: [itemImages.barrelchest] },
  { id: "dark-bow", name: "Dark Bow + Seeker", cost: 4, tier: 4, requires: [], images: [itemImages.darkBow, itemImages.seekerArrow] },
  { id: "dragon-thrownaxe", name: "Dragon Thrownaxe", cost: 4, tier: 4, requires: [], images: [itemImages.dragonThrownaxe] },
  { id: "toxic-staff", name: "Toxic Staff", cost: 4, tier: 4, requires: [], images: [itemImages.toxicStaff] },

  { id: "ornate-maul", name: "Ornate Maul", cost: 5, tier: 5, requires: [], images: [itemImages.ornateMaul] },
  { id: "colossal-barrelchest", name: "Colossal / Anchor", cost: 5, tier: 5, requires: [], images: [itemImages.colossal, itemImages.barrelchest] },
  { id: "zgs", name: "ZGS Freeze", cost: 5, tier: 5, requires: [], images: [itemImages.zamorakGodsword] },
  { id: "accursed", name: "Accursed Sceptre", cost: 5, tier: 5, requires: [], images: [itemImages.accursed] },
  { id: "webweaver", name: "Webweaver Bow", cost: 5, tier: 5, requires: [], images: [itemImages.webweaver] },
  { id: "chainmace", name: "Ursine Chainmace", cost: 5, tier: 5, requires: [], images: [itemImages.chainmace] },
  { id: "voidwaker", name: "Voidwaker", cost: 6, tier: 5, requires: [], images: [itemImages.voidwaker] }
];

const shopItems = [
  { id: "barrage-runes", name: "Barrage runes", cost: 8, images: [itemImages.blood, itemImages.death, itemImages.water] },
  { id: "tb-runes", name: "TB runes", cost: 5, images: [itemImages.law, itemImages.chaos] },
  { id: "amethyst-arrows", name: "Amethyst arrows", cost: 5, images: [itemImages.amethystArrow] },
  { id: "dragon-bolts", name: "Dragon bolts", cost: 6, images: [itemImages.dragonBolt] },
  { id: "dragon-knives", name: "Dragon knives", cost: 7, images: [itemImages.dragonKnife] },
  { id: "dragon-thrownaxes", name: "Dragon thrownaxes", cost: 7, images: [itemImages.dragonThrownaxe] },
  { id: "surge-potions", name: "Surge potions", cost: 8, images: [itemImages.liquidAdrenaline] },
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
  { id: "death-coffer", name: "Death coffer", cost: 10, images: [itemImages.coins] }
];

const state = loadState();
let currentUser = null;
let saveTimer = null;
let isApplyingRemoteState = false;

function defaultState() {
  return { completed: [], purchased: [], shopPurchases: {}, playerKills: 0 };
}

function sanitizeState(rawState) {
  const validUnlocks = new Set(unlocks.map((unlock) => unlock.id));
  const validShopItems = new Set(shopItems.map((item) => item.id));
  const shopPurchases = {};

  Object.entries(rawState?.shopPurchases ?? {}).forEach(([id, count]) => {
    if (validShopItems.has(id) && Number.isFinite(count)) {
      shopPurchases[id] = Math.max(0, Math.floor(count));
    }
  });

  return {
    completed: Array.isArray(rawState?.completed) ? [...new Set(rawState.completed)] : [],
    purchased: Array.isArray(rawState?.purchased)
      ? [...new Set(rawState.purchased)].filter((id) => validUnlocks.has(id))
      : [],
    shopPurchases,
    playerKills: Number.isFinite(rawState?.playerKills) ? Math.max(0, Math.floor(rawState.playerKills)) : 0
  };
}

function mergeStates(localState, remoteState) {
  const local = sanitizeState(localState);
  const remote = sanitizeState(remoteState);
  const shopPurchases = { ...local.shopPurchases };

  Object.entries(remote.shopPurchases).forEach(([id, count]) => {
    shopPurchases[id] = Math.max(shopPurchases[id] ?? 0, count);
  });

  return sanitizeState({
    completed: [...local.completed, ...remote.completed],
    purchased: [...local.purchased, ...remote.purchased],
    shopPurchases,
    playerKills: Math.max(local.playerKills, remote.playerKills)
  });
}

function loadState() {
  try {
    return sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return defaultState();
  }
}

function serializeState() {
  return sanitizeState(state);
}

function writeLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
}

function saveState() {
  writeLocalState();
  queueCloudSave();
}

function trackerDoc(uid) {
  return doc(db, "users", uid, "trackers", "default");
}

function queueCloudSave() {
  if (!currentUser || isApplyingRemoteState) return;

  setSaveStatus("Saving to cloud...");
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveCloudState();
  }, 650);
}

async function saveCloudState() {
  if (!currentUser) return;

  try {
    await setDoc(trackerDoc(currentUser.uid), {
      ...serializeState(),
      displayName: currentUser.displayName ?? "",
      photoURL: currentUser.photoURL ?? "",
      updatedAt: serverTimestamp()
    }, { merge: true });
    setSaveStatus("Saved to cloud");
  } catch (error) {
    console.error("Cloud save failed", error);
    setSaveStatus("Saved locally");
  }
}


function setSaveStatus(message) {
  const status = document.getElementById("saveStatus");
  if (status) status.textContent = message;
}

function renderAuthUser(user) {
  const loginButton = document.getElementById("loginButton");
  const userPanel = document.getElementById("userPanel");
  const userPhoto = document.getElementById("userPhoto");
  const userName = document.getElementById("userName");

  if (!loginButton || !userPanel || !userPhoto || !userName) return;

  loginButton.hidden = Boolean(user);
  userPanel.hidden = !user;

  if (!user) {
    userPhoto.removeAttribute("src");
    userName.textContent = "";
    return;
  }

  userPhoto.src = user.photoURL ?? "";
  userName.textContent = user.displayName ?? user.email ?? "Signed in";
}

async function loadCloudState(user) {
  setSaveStatus("Loading cloud save...");

  try {
    const snapshot = await getDoc(trackerDoc(user.uid));
    const nextState = snapshot.exists() ? mergeStates(state, snapshot.data()) : serializeState();

    isApplyingRemoteState = true;
    Object.assign(state, nextState);
    writeLocalState();
    render();
    isApplyingRemoteState = false;

    await saveCloudState();
  } catch (error) {
    console.error("Cloud load failed", error);
    isApplyingRemoteState = false;
    setSaveStatus("Saved locally");
  }
}

function initFirebaseAuth() {
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");

  loginButton?.addEventListener("click", async () => {
    loginButton.disabled = true;
    setSaveStatus("Opening Google login...");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed", error);
      setSaveStatus("Saved locally");
    } finally {
      loginButton.disabled = false;
    }
  });

  logoutButton?.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  });

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    renderAuthUser(user);

    if (!user) {
      setSaveStatus("Saved locally");
      return;
    }

    await loadCloudState(user);
  });
}
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
  return challenges.pvm.flatMap((group, groupIndex) =>
    group.items.map((challenge, index) => ({
      id: challengeId("pvm", groupIndex, index),
      title: challengeTitle(challenge),
      points: challengePoints(challenge),
      stage: group.stage,
      killRequirement: group.killRequirement
    }))
  );
}

function flattenPvpChallenges() {
  return challenges.pvp.map((challenge, index) => ({
    id: challengeId("pvp", index),
    title: challengeTitle(challenge),
    points: challengePoints(challenge)
  }));
}

function totalCompleted() {
  return state.completed.length;
}

function earnedUnlockPoints() {
  return [...flattenPvmChallenges(), ...flattenPvpChallenges()].reduce((sum, challenge) => {
    return sum + (state.completed.includes(challenge.id) ? challenge.points : 0);
  }, 0);
}

function totalSpent() {
  return state.purchased.reduce((sum, id) => {
    const unlock = unlocks.find((item) => item.id === id);
    return sum + (unlock?.cost ?? 0);
  }, 0);
}

function availablePoints() {
  return earnedUnlockPoints() - totalSpent();
}

function totalShopSpent() {
  return shopItems.reduce((sum, item) => sum + ((state.shopPurchases[item.id] ?? 0) * item.cost), 0);
}

function availableKillPoints() {
  return Math.max(0, state.playerKills - totalShopSpent());
}

function canBuy(unlock) {
  return !state.purchased.includes(unlock.id) && availablePoints() >= unlock.cost;
}

function lockReason(unlock) {
  if (state.purchased.includes(unlock.id)) return "Purchased - click to refund";
  if (availablePoints() < unlock.cost) return `Need ${unlock.cost - availablePoints()} more unlock points`;
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
  pointReward.textContent = locked ? "Locked" : `+${challenge.points} Unlock`;
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

    group.items.forEach((challenge, index) => {
      renderChallengeItem({
        id: challengeId("pvm", groupIndex, index),
        title: challengeTitle(challenge),
        points: challengePoints(challenge),
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
      const images = (unlock.images ?? [unlock.image]).filter(Boolean)
        .map((src) => `<img src="${src}" alt="" loading="lazy" />`)
        .join("");

      button.type = "button";
      button.className = `talent-node ${purchased ? "purchased" : available ? "available" : "locked"}`;
      button.disabled = !purchased && !available;
      button.title = lockReason(unlock);
      button.setAttribute("aria-label", `${unlock.name}. ${lockReason(unlock)}.`);
      button.innerHTML = `
        <span class="node-art">${images}</span>
        <span>
          <span class="node-name">${unlock.name}</span>
        </span>
        <span class="node-cost">${purchased ? "OK" : `${unlock.cost} Unlock`}</span>
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
      <button type="button" ${canAfford ? "" : "disabled"}>${item.cost} Kill</button>
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
  document.getElementById("earnedPoints").textContent = earnedUnlockPoints();
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
initFirebaseAuth();






