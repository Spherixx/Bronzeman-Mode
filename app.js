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
const DATA_URLS = {
  items: "data/BronzemanItems.json",
  itemSets: "data/BronzemanItemSets.json",
  unlocks: "data/BronzemanUnlocks.json",
  pvm: "data/BronzemanPvM.json",
  pvp: "data/BronzemanPvP.json",
  shop: "data/BronzemanShop.json"
};

function localImage(folder, fileName) {
  return `${folder}/${encodeURIComponent(fileName)}`;
}

function itemImage(fileName) {
  return localImage("images/items", fileName);
}

const specialImageFolders = {
  "Blood_money_10000.png": "other",
  "Coins_10000.png": "other",
  "Recharge_Dragonstone.png": "other",
  "Zulrah's_scales_5.png": "other",
  "Standard_spellbook.png": "spellbooks",
  "Ancient_spellbook.png": "spellbooks",
  "Lunar_spellbook.png": "spellbooks",
  "Arceuus_spellbook.png": "spellbooks",
  "Augury.png": "prayers",
  "Chivalry.png": "prayers",
  "Deadeye.png": "prayers",
  "Mystic_Vigour.png": "prayers",
  "Piety.png": "prayers",
  "Rigour.png": "prayers"
};

function imageAsset(fileName) {
  return localImage(`images/${specialImageFolders[fileName] ?? "other"}`, fileName);
}

let challenges = { pvm: [], pvp: [] };
let unlocks = [];
let shopCategories = [];
let shopItems = [];
let collectionSetDefinitions = [];
let itemDefinitions = [];
const state = loadState();
let currentUser = null;
let saveTimer = null;
let isApplyingRemoteState = false;
let collectionFilterMode = "all";
const collectionActiveFilters = new Set();
let collectionSearch = "";

const collectionFilterDefinitions = [
  { id: "all", label: "All", type: "mode" },
  { id: "unlocked", label: "Unlocked", type: "mode" },
  { id: "locked", label: "Locked", type: "mode" },
  { id: "spec", label: "Spec", type: "tag" },
  { id: "range", label: "Range", type: "tag" },
  { id: "mage", label: "Mage", type: "tag" },
  { id: "melee", label: "Melee", type: "tag" },
  { id: "gear", label: "Gear", type: "tag" },
  { id: "talent", label: "Talent", type: "tag" },
  { id: "shop", label: "Shop", type: "tag" },
  { id: "potions", label: "Potions", type: "tag" },
  { id: "runes", label: "Runes", type: "tag" },
  { id: "ammo", label: "Ammo", type: "tag" },
  { id: "food", label: "Food", type: "tag" },
  { id: "other", label: "Other", type: "tag" }
];

const collectionCategoryPriority = ["spec", "range", "mage", "melee", "gear", "potions", "runes", "ammo", "food", "talent", "shop", "other"];
const TALENT_TIER_REQUIREMENT = 10;
const PERILOUS_MOONS_REWARD_IDS = [
  "blood-moon-helm",
  "blood-moon-chestplate",
  "blood-moon-tassets",
  "dual-macuahuitl",
  "blue-moon-helm",
  "blue-moon-chestplate",
  "blue-moon-tassets",
  "blue-moon-spear",
  "eclipse-moon-helm",
  "eclipse-moon-chestplate",
  "eclipse-moon-tassets",
  "eclipse-atlatl"
];
const CHALLENGE_CATALOG = [
  {
    id: "obsidian-tri-brid",
    title: "Obsidian Tri-Brid",
    reward: "One attempt to unlock a piece of Perilous Moons gear.",
    requirementGroups: [
      ["Rock-shell plate", "Spined body", "Skeletal top"],
      ["Tzhaar-ket-om", "Toktz-xil-ul", "Toktz-mej-tal"]
    ],
    rules: [
      "Defeat a real opponent while using one full set of Rock-shell, Spined, or Skeletal armor.",
      "Wear at least two pieces from each of the other two sets.",
      "Use an obsidian melee weapon, obsidian staff, and obsidian thrown weapon.",
      "Damage the opponent with melee, ranged, and magic during the fight using only obsidian weapons.",
      "The opponent must fight back in legitimate combat gear. Bots or escape-only players do not count."
    ]
  }
];
const dataWarnings = [];
let challengeIdAliases = {};
let repeatableIdAliases = {};
let itemRowsByUid = new Map();
let itemRowsByItemId = new Map();
let itemRowsByName = new Map();
let challengeRewardDisplayOrders = {};
let activeChallengeRoll = null;
let challengeCountdownTimer = null;
const CHALLENGE_COUNTDOWN_SECONDS = 3;
const CHALLENGE_ROLL_DURATION_MS = 3200;

function collectionFilterOptions() {
  return collectionFilterDefinitions;
}

function mergeCountMaps(first, second) {
  const merged = { ...first };
  Object.entries(second).forEach(([id, count]) => {
    merged[id] = Math.max(merged[id] ?? 0, count);
  });
  return merged;
}

function defaultState() {
  return {
    completed: [],
    purchased: [],
    shopPurchases: {},
    repeatablePurchases: {},
    basicUnlocks: [],
    challengeCompletions: {},
    challengeRewardUnlocks: [],
    challengeRolls: {},
    playerKills: 0
  };
}

function sanitizeState(rawState) {
  const validUnlocks = new Set(unlocks.map((unlock) => unlock.id));
  const validShopItems = new Set(shopItems.map((item) => item.id));
  const validChallenges = new Set([...flattenPvmChallenges(), ...flattenPvpChallenges()].map((challenge) => challenge.id));
  const repeatables = flattenRepeatables();
  const validRepeatables = new Set(repeatables.map((repeatable) => repeatable.id));
  const validChallengeUnlocks = new Set(PERILOUS_MOONS_REWARD_IDS);
  const validChallengeIds = new Set(CHALLENGE_CATALOG.map((challenge) => challenge.id));
  const shopPurchases = {};
  const repeatablePurchases = {};
  const challengeCompletions = {};
  const challengeRolls = {};

  Object.entries(rawState?.shopPurchases ?? {}).forEach(([id, count]) => {
    const nextId = id;
    if (validShopItems.has(nextId) && Number.isFinite(count)) {
      shopPurchases[nextId] = Math.max(shopPurchases[nextId] ?? 0, Math.floor(count));
    }
  });

  if (Array.isArray(rawState?.purchased) && rawState.purchased.includes("trouver")) {
    shopPurchases.trouver = Math.max(shopPurchases.trouver ?? 0, 1);
  }

  Object.entries(rawState?.repeatablePurchases ?? {}).forEach(([id, count]) => {
    const nextId = repeatableIdAliases[id] ?? id;
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
      ? [...new Set(rawState.completed.map((id) => challengeIdAliases[id] ?? id))].filter((id) => validChallenges.has(id))
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

  Object.entries(remote.shopPurchases).forEach(([id, count]) => {
    shopPurchases[id] = Math.max(shopPurchases[id] ?? 0, count);
  });

  const challengeCompletions = { ...local.challengeCompletions };
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

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState(), ...(parsed && typeof parsed === "object" ? parsed : {}) };
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

function trackerDoc() {
  return doc(db, "trackers", "bronzeman-default");
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
    await setDoc(trackerDoc(), {
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
  const logoutButton = document.getElementById("logoutButton");
  const userPanel = document.getElementById("userPanel");
  const userPhoto = document.getElementById("userPhoto");
  const userName = document.getElementById("userName");

  if (!loginButton || !userPanel || !userPhoto || !userName) return;

  loginButton.hidden = Boolean(user);
  userPanel.hidden = !user;
  if (logoutButton) logoutButton.hidden = !user;

  if (!user) {
    userPhoto.removeAttribute("src");
    userName.textContent = "";
    return;
  }

  userPhoto.src = user.photoURL ?? "";
  userName.textContent = user.displayName ?? user.email ?? "Signed in";
}

function setSettingsOpen(open) {
  const settingsButton = document.getElementById("settingsButton");
  const settingsMenu = document.getElementById("settingsMenu");

  if (!settingsButton || !settingsMenu) return;

  settingsMenu.hidden = !open;
  settingsButton.setAttribute("aria-expanded", String(open));
}

async function loadCloudState(user) {
  setSaveStatus("Loading cloud save...");

  try {
    const snapshot = await getDoc(trackerDoc());
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
  const settingsButton = document.getElementById("settingsButton");
  const settingsMenu = document.getElementById("settingsMenu");

  settingsButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    setSettingsOpen(settingsMenu?.hidden ?? true);
  });

  settingsMenu?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => setSettingsOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSettingsOpen(false);
  });

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
    setSettingsOpen(false);

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
  return challenges.pvm.flatMap((group, groupIndex) =>
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
  return challenges.pvp.map((challenge, index) => ({
    id: challenge.id || challengeId("pvp", index),
    legacyId: challenge.legacyId || challengeId("pvp", index),
    title: challengeTitle(challenge),
    points: challengePoints(challenge)
  }));
}

function totalCompleted() {
  const validCompleted = new Set([...flattenPvmChallenges(), ...flattenPvpChallenges()].map((challenge) => challenge.id));
  return state.completed.filter((id) => validCompleted.has(id)).length;
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

function totalRepeatableSpent() {
  return flattenRepeatables().reduce((sum, item) => sum + ((state.repeatablePurchases[item.id] ?? 0) * item.cost), 0);
}

function availableKillPoints() {
  return Math.max(0, state.playerKills - totalShopSpent() - totalRepeatableSpent());
}



function purchasedInTier(tier) {
  return unlocks.filter((unlock) => unlock.tier === tier && state.purchased.includes(unlock.id)).length;
}

function tierRequirementProgress(tier) {
  if (tier <= 1) return { required: 0, purchased: 0, unlocked: true };
  const purchased = purchasedInTier(tier - 1);
  const required = TALENT_TIER_REQUIREMENT;
  return { required, purchased, unlocked: purchased >= required };
}

function canBuy(unlock) {
  return !state.purchased.includes(unlock.id) && tierRequirementProgress(unlock.tier).unlocked && availablePoints() >= unlock.cost;
}

function lockReason(unlock) {
  if (state.purchased.includes(unlock.id)) return "Purchased - click to refund";
  const tierProgress = tierRequirementProgress(unlock.tier);
  if (!tierProgress.unlocked) return `Buy ${tierProgress.required - tierProgress.purchased} more tier ${unlock.tier - 1} talents`;
  if (availablePoints() < unlock.cost) return `Need ${unlock.cost - availablePoints()} more talent points`;
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
  pointReward.textContent = locked ? "Locked" : `+${challenge.points} Talent`;
  label.title = locked ? "Locked" : "";

  input.addEventListener("change", () => {
    setChallengeCompleted(challenge.id, input.checked);
    saveState();
    renderStats();
    renderPvmChallenges();
    renderPvpChallenges();
    updateTalentTreeState();
  });

  target.appendChild(content);
}

function renderPvmChallenges() {
  const target = document.getElementById("pvmList");
  target.innerHTML = "";

  challenges.pvm.forEach((group, groupIndex) => {
    const unlocked = state.playerKills >= group.killRequirement;
    const visibleItems = group.items
      .map((challenge, index) => ({ challenge, index }))
      .filter(({ challenge }) => !challenge.repeatable);
    const stage = document.createElement("section");
    stage.className = `challenge-stage ${unlocked ? "unlocked" : "locked"}`;

    const completed = visibleItems.filter(({ challenge, index }) => state.completed.includes(challenge.id || challengeId("pvm", groupIndex, index))).length;
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
        id: challenge.id || challengeId("pvm", groupIndex, index),
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

function renderRepeatables() {
  const target = document.getElementById("repeatableList");
  if (!target) return;

  target.innerHTML = "";
  flattenRepeatables().forEach((repeatable) => {
    const owned = state.repeatablePurchases[repeatable.id] ?? 0;
    const canAfford = availableKillPoints() >= repeatable.cost;
    const item = document.createElement("div");
    item.className = `challenge-item repeatable-item ${canAfford ? "available" : "locked"}`;
    item.dataset.repeatableId = repeatable.id;
    item.innerHTML = `
      <span class="checkmark repeatable-mark" aria-hidden="true">PK</span>
      <span class="challenge-text">${repeatable.title}</span>
      <span class="repeatable-actions">
        <span class="point-reward">Bought ${owned}</span>
        <button type="button" ${canAfford ? "" : "disabled"}>${killCostLabel(repeatable.cost)}</button>
      </span>
    `;

    item.querySelector("button").addEventListener("click", () => {
      if (availableKillPoints() < repeatable.cost) return;
      state.repeatablePurchases[repeatable.id] = (state.repeatablePurchases[repeatable.id] ?? 0) + 1;
      saveState();
      renderStats();
      updateShopState();
      updateRepeatableState();
    });

    target.appendChild(item);
  });
}

function updateRepeatableState() {
  flattenRepeatables().forEach((repeatable) => {
    const item = document.querySelector(`[data-repeatable-id="${repeatable.id}"]`);
    if (!item) return;

    const owned = state.repeatablePurchases[repeatable.id] ?? 0;
    const canAfford = availableKillPoints() >= repeatable.cost;
    const count = item.querySelector(".point-reward");
    const button = item.querySelector("button");

    item.classList.toggle("available", canAfford);
    item.classList.toggle("locked", !canAfford);
    if (count) count.textContent = `Bought ${owned}`;
    if (button) button.disabled = !canAfford;
  });
}



function renderTalentTree() {
  const tree = document.getElementById("talentTree");
  tree.innerHTML = "";
  const maxTier = Math.max(0, ...unlocks.map((unlock) => unlock.tier));

  for (let tierNumber = 1; tierNumber <= maxTier; tierNumber += 1) {
    const tier = document.createElement("div");
    tier.className = "tier";
    tier.dataset.tier = tierNumber;

    const label = document.createElement("div");
    const requirement = document.createElement("div");
    const tierProgress = tierRequirementProgress(tierNumber);
    label.className = "tier-label";
    requirement.className = `tier-requirement ${tierProgress.unlocked ? "unlocked" : "locked"}`;
    label.innerHTML = `<b>TIER ${tierNumber}</b> | ${tierNumber === 1 ? "BASE" : tierNumber === maxTier ? "ENDGAME" : "POWER"}`;
    requirement.textContent = tierNumber === 1 ? "Open" : `Tier ${tierNumber - 1}: ${Math.min(tierProgress.purchased, tierProgress.required)} / ${tierProgress.required}`;
    tier.appendChild(label);
    tier.appendChild(requirement);

    unlocks.filter((unlock) => unlock.tier === tierNumber).forEach((unlock) => {
      const purchased = state.purchased.includes(unlock.id);
      const available = canBuy(unlock);
      const button = document.createElement("button");
      const images = renderItemImages(unlock.images ?? [unlock.image]);

      button.type = "button";
      button.dataset.unlockId = unlock.id;
      button.className = `talent-node ${purchased ? "purchased" : available ? "available" : "locked"}`;
      button.disabled = !purchased && !available;
      button.title = lockReason(unlock);
      button.setAttribute("aria-label", `${unlock.name}. ${lockReason(unlock)}.`);
      button.innerHTML = `
        <span class="node-art">${images}</span>
        <span>
          <span class="node-name">${unlock.name}</span>
        </span>
        <span class="node-cost">${purchased ? "OK" : `${unlock.cost} Talent`}</span>
      `;

      button.addEventListener("click", () => {
        const isPurchased = state.purchased.includes(unlock.id);
        if (isPurchased) refundUnlock(unlock.id);
        else if (canBuy(unlock)) buyUnlock(unlock.id);
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

    const tierProgress = tierRequirementProgress(tierNumber);
    requirement.classList.toggle("unlocked", tierProgress.unlocked);
    requirement.classList.toggle("locked", !tierProgress.unlocked);
    requirement.textContent = tierNumber === 1 ? "Open" : `Tier ${tierNumber - 1}: ${Math.min(tierProgress.purchased, tierProgress.required)} / ${tierProgress.required}`;
  });

  unlocks.forEach((unlock) => {
    const button = document.querySelector(`[data-unlock-id="${unlock.id}"]`);
    if (!button) return;

    const purchased = state.purchased.includes(unlock.id);
    const available = canBuy(unlock);
    const reason = lockReason(unlock);
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

function killCostLabel(cost) {
  return `${cost} PK`;
}

const missingImageAssets = new Set();

function renderShopStack(entry) {
  return `
    <span class="shop-stack">
      <img src="${entry.image}" alt="" loading="lazy" />
      ${entry.amount ? `<span class="stack-amount">${entry.amount}</span>` : ""}
    </span>
  `;
}

function renderItemImages(images) {
  return images.filter((src) => src && !missingImageAssets.has(src))
    .map((src) => `<img src="${src}" alt="" loading="lazy" />`)
    .join("");
}

function renderShopCard(item) {
  const owned = state.shopPurchases[item.id] ?? 0;
  const canAfford = availableKillPoints() >= item.cost;
  const card = document.createElement("article");
  card.dataset.shopId = item.id;
  card.className = `shop-item ${canAfford ? "available" : "locked"}`;
  card.title = owned ? `Purchased ${owned}` : "";

  const entries = item.items ?? (item.images ?? []).map((image) => ({ image }));
  const images = entries.map(renderShopStack).join("");

  card.innerHTML = `
    <div class="shop-art">${images}</div>
    <div class="shop-copy">
      <h3>${item.name}</h3>
      ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
      <span class="purchase-count">Bought ${owned}</span>
    </div>
    <button type="button" ${canAfford ? "" : "disabled"}>${killCostLabel(item.cost)}</button>
  `;

  card.querySelector("button").addEventListener("click", () => {
    if (availableKillPoints() < item.cost) return;
    const confirmed = window.confirm(`Buy ${item.name} for ${killCostLabel(item.cost)}?`);
    if (!confirmed) return;
    const currentOwned = state.shopPurchases[item.id] ?? 0;
    state.shopPurchases[item.id] = currentOwned + 1;
    saveState();
    renderStats();
    updateShopState();
    updateRepeatableState();
    renderUnlocks();
  });

  return card;
}

function updateShopState() {
  shopItems.forEach((item) => {
    const card = document.querySelector(`[data-shop-id="${item.id}"]`);
    if (!card) return;

    const owned = state.shopPurchases[item.id] ?? 0;
    const canAfford = availableKillPoints() >= item.cost;
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
  const shop = document.getElementById("shopList");
  shop.innerHTML = "";

  shopCategories.forEach((category) => {
    const categoryItems = shopItems.filter((item) => item.category === category);
    if (!categoryItems.length) return;

    const section = document.createElement("section");
    section.className = "shop-category";
    section.innerHTML = `<h3 class="shop-category-title">${category}</h3><div class="shop-category-grid"></div>`;

    const grid = section.querySelector(".shop-category-grid");
    categoryItems.forEach((item) => grid.appendChild(renderShopCard(item)));
    shop.appendChild(section);
  });
}

function setBasicUnlockChecked(id, checked) {
  if (checked) {
    if (!state.basicUnlocks.includes(id)) state.basicUnlocks.push(id);
  } else {
    state.basicUnlocks = state.basicUnlocks.filter((item) => item !== id);
  }
}

function challengeRequirementEntry(name) {
  const itemRow = itemRowsByName.get(normalizeDataText(name));
  return {
    name: dataDisplayName(itemRow, name),
    image: itemRow ? imageForDataEntry(itemRow) : resolveDataImage(name)
  };
}

function challengeRewardItems() {
  return PERILOUS_MOONS_REWARD_IDS
    .map((id) => collectionItems().find((item) => item.id === id))
    .filter(Boolean);
}

function itemByCollectionId(id) {
  return collectionItems().find((item) => item.id === id);
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

function idleChallengeRewardItems(challengeId) {
  const rewards = challengeRewardItems();
  const rewardIds = rewards.map((item) => item.id);
  const currentOrder = challengeRewardDisplayOrders[challengeId] ?? [];
  const hasCurrentOrder = currentOrder.length === rewardIds.length && rewardIds.every((id) => currentOrder.includes(id));

  if (!hasCurrentOrder) {
    challengeRewardDisplayOrders[challengeId] = shuffledItems(rewards).map((item) => item.id);
  }

  return rewardItemsFromIds(challengeRewardDisplayOrders[challengeId]);
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

function challengeRewardIsUnlocked(id) {
  return state.challengeRewardUnlocks.includes(id);
}

function challengeCollectionUnlocksItem(item) {
  const itemIds = [item.id, ...(item.collectionIds ?? [])];
  return itemIds.some((id) => challengeRewardIsUnlocked(id));
}

function renderChallengeIconGrid(groups) {
  return groups.map((group) => `
    <div class="challenge-kit-row">
      ${group.map((name) => {
        const entry = challengeRequirementEntry(name);
        return `
          <span class="challenge-kit-item" title="${escapeHtml(entry.name)}">
            <img src="${entry.image}" alt="" loading="lazy" />
            <b>${escapeHtml(entry.name)}</b>
          </span>
        `;
      }).join("")}
    </div>
  `).join("");
}

function renderRewardRoulette(challenge) {
  const rewards = challengeRewardItems();
  const activeRoll = activeChallengeRoll?.challengeId === challenge.id ? activeChallengeRoll : null;
  const latestId = state.challengeRolls[challenge.id];
  if (!rewards.length) return `<p class="challenge-empty">Perilous Moons reward items are missing.</p>`;
  const visibleRewards = activeRoll ? rewardItemsFromIds(activeRoll.reelIds) : idleChallengeRewardItems(challenge.id);

  return `
    <div class="roulette-stage ${activeRoll?.phase ?? "idle"}" data-challenge-id="${escapeHtml(challenge.id)}" aria-label="Perilous Moons roulette rewards">
      <span class="roulette-pointer" aria-hidden="true"></span>
      ${activeRoll?.phase === "countdown" ? `
        <div class="roulette-countdown" aria-live="polite">
          <strong>${activeRoll.countdown}</strong>
          <span>Roll starts soon</span>
        </div>
      ` : ""}
      <div class="roulette-strip">
      ${visibleRewards.map((item, index) => {
        const unlocked = challengeRewardIsUnlocked(item.id);
        const latest = latestId === item.id;
        const target = activeRoll?.targetIndex === index;
        return `
          <span class="roulette-item ${unlocked ? "is-unlocked" : ""} ${latest ? "latest" : ""} ${target ? "target" : ""}" title="${escapeHtml(item.name)}">
            ${renderItemImages(item.images)}
            <b>${escapeHtml(item.name)}</b>
          </span>
        `;
      }).join("")}
      </div>
    </div>
  `;
}

function renderChallengeUnlockedRewards() {
  const rewards = challengeRewardItems();
  if (!rewards.length) return `<p class="challenge-empty">No Perilous Moons reward items found.</p>`;

  return `
    <div class="challenge-reward-grid">
      ${rewards.map((item) => {
        const unlocked = challengeRewardIsUnlocked(item.id);
        return `
          <article class="challenge-reward-item ${unlocked ? "is-unlocked" : "is-locked"}">
            <div class="challenge-reward-art">${renderItemImages(item.images)}</div>
            <div>
              <h4>${escapeHtml(item.name)}</h4>
              <span>${unlocked ? "Unlocked" : "Locked"}</span>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function clearChallengeCountdownTimer() {
  if (!challengeCountdownTimer) return;
  window.clearInterval(challengeCountdownTimer);
  challengeCountdownTimer = null;
}

function finalizeChallengeRoll() {
  if (!activeChallengeRoll) return;

  const { challengeId, rewardId } = activeChallengeRoll;
  state.challengeCompletions[challengeId] = (state.challengeCompletions[challengeId] ?? 0) + 1;
  state.challengeRolls[challengeId] = rewardId;
  if (!challengeRewardIsUnlocked(rewardId)) state.challengeRewardUnlocks.push(rewardId);

  challengeRewardDisplayOrders[challengeId] = shuffledItems(challengeRewardItems()).map((item) => item.id);
  activeChallengeRoll = null;
  clearChallengeCountdownTimer();
  saveState();
  renderChallengeUnlocks();
  renderUnlocks();
}

function startChallengeRollAnimation() {
  if (!activeChallengeRoll || activeChallengeRoll.phase !== "rolling" || activeChallengeRoll.animationStarted) return;

  const stage = document.querySelector(`.roulette-stage.rolling[data-challenge-id="${activeChallengeRoll.challengeId}"]`);
  const strip = stage?.querySelector(".roulette-strip");
  const target = stage?.querySelector(".roulette-item.target");
  if (!stage || !strip || !target) return;

  activeChallengeRoll.animationStarted = true;
  const targetOffset = target.offsetLeft + (target.offsetWidth / 2);
  const destination = (stage.clientWidth / 2) - targetOffset;
  const wobble = Math.min(24, Math.max(10, target.offsetWidth * 0.18));
  const animation = strip.animate([
    { transform: "translateX(0)" },
    { transform: `translateX(${destination - wobble}px)`, offset: 0.84 },
    { transform: `translateX(${destination + (wobble * 0.35)}px)`, offset: 0.94 },
    { transform: `translateX(${destination}px)` }
  ], {
    duration: CHALLENGE_ROLL_DURATION_MS,
    easing: "cubic-bezier(.08,.84,.18,1)",
    fill: "forwards"
  });

  animation.onfinish = finalizeChallengeRoll;
}

function tickChallengeCountdown() {
  if (!activeChallengeRoll || activeChallengeRoll.phase !== "countdown") {
    clearChallengeCountdownTimer();
    return;
  }

  activeChallengeRoll.countdown -= 1;
  if (activeChallengeRoll.countdown <= 0) {
    activeChallengeRoll.phase = "rolling";
    activeChallengeRoll.countdown = 0;
    clearChallengeCountdownTimer();
  }

  renderChallengeUnlocks();
}

function completeChallengeRoll(challengeId) {
  if (activeChallengeRoll) return;
  const rewards = challengeRewardItems();
  if (!rewards.length) return;

  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  const reel = buildChallengeReel(rewards, reward.id);
  activeChallengeRoll = {
    challengeId,
    rewardId: reward.id,
    phase: "countdown",
    countdown: CHALLENGE_COUNTDOWN_SECONDS,
    animationStarted: false,
    ...reel
  };

  clearChallengeCountdownTimer();
  challengeCountdownTimer = window.setInterval(tickChallengeCountdown, 1000);
  renderChallengeUnlocks();
}

function renderChallengeUnlockCard(challenge) {
  const card = document.createElement("article");
  const completions = state.challengeCompletions[challenge.id] ?? 0;
  const latest = itemByCollectionId(state.challengeRolls[challenge.id]);
  const rewardsAvailable = challengeRewardItems().length > 0;
  const isRolling = activeChallengeRoll?.challengeId === challenge.id;
  const rollButtonLabel = isRolling
    ? activeChallengeRoll.phase === "countdown" ? `Rolling in ${activeChallengeRoll.countdown}` : "Rolling..."
    : "Complete + Roll";

  card.className = "challenge-unlock-card";
  card.innerHTML = `
    <div class="challenge-unlock-header">
      <div>
        <span class="challenge-eyebrow">PvP unlock challenge</span>
        <h3>${escapeHtml(challenge.title)}</h3>
      </div>
      <span class="challenge-completions">${completions} completions</span>
    </div>

    <div class="challenge-shop-card">
      <div class="challenge-kit">${renderChallengeIconGrid(challenge.requirementGroups)}</div>
      <div class="challenge-copy">
        <ul>
          ${challenge.rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}
        </ul>
        <p><b>Reward:</b> ${escapeHtml(challenge.reward)}</p>
        <p class="challenge-disclaimer">*Reward items are not removed from the roulette after unlocking, so duplicate hits are possible and you will probably need more than 12 challenge completions.</p>
      </div>
    </div>

    <div class="challenge-roll-panel">
      <div class="challenge-roll-header">
        <div>
          <h4>Perilous Moons Roulette</h4>
          <span>${latest ? `Latest roll: ${escapeHtml(latest.name)}` : "No rolls yet"}</span>
        </div>
        <button type="button" ${rewardsAvailable && !activeChallengeRoll ? "" : "disabled"}>${rollButtonLabel}</button>
      </div>
      ${renderRewardRoulette(challenge)}
    </div>

    <div class="challenge-unlocked-panel">
      <h4>Unlocked From This Challenge</h4>
      ${renderChallengeUnlockedRewards()}
    </div>
  `;

  card.querySelector("button")?.addEventListener("click", () => completeChallengeRoll(challenge.id));
  return card;
}

function renderChallengeUnlocks() {
  const target = document.getElementById("challengeUnlockList");
  if (!target) return;

  target.innerHTML = "";
  CHALLENGE_CATALOG.forEach((challenge) => target.appendChild(renderChallengeUnlockCard(challenge)));
  if (activeChallengeRoll?.phase === "rolling") {
    window.requestAnimationFrame(startChallengeRollAnimation);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugifyItemId(value) {
  return String(value ?? "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function normalizeCollectionText(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeAssetPath(value) {
  try {
    return decodeURIComponent(String(value ?? "")).replace(/\\/g, "/").toLowerCase();
  } catch {
    return String(value ?? "").replace(/\\/g, "/").toLowerCase();
  }
}

function titleCase(value) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueTags(tags) {
  return [...new Set((tags ?? []).map((tag) => String(tag).trim()).filter(Boolean))];
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function dataDisplayName(entry, fallback = "Item") {
  return entry?.alias || entry?.name || fallback;
}

function dataUid(entry, fallbackPrefix = "item") {
  return String(entry?.uid || entry?.id || slugifyItemId(dataDisplayName(entry, fallbackPrefix)));
}

function withoutTrailingPeriod(value) {
  return String(value ?? "").replace(/\.+$/g, "");
}

function normalizeDataText(value) {
  return normalizeCollectionText(withoutTrailingPeriod(value));
}

function indexItemRows(items) {
  itemRowsByUid = new Map();
  itemRowsByItemId = new Map();
  itemRowsByName = new Map();

  toArray(items).forEach((item) => {
    const uid = dataUid(item);
    itemRowsByUid.set(uid, item);
    if (item.itemId !== null && item.itemId !== undefined) itemRowsByItemId.set(String(item.itemId), item);
    [item.name, item.alias, item.imageUsed, item.imageName?.replace(/\.png$/i, "")].filter(Boolean).forEach((name) => {
      itemRowsByName.set(normalizeDataText(name), item);
    });
  });
}

function itemIdsFromDataIds(itemIds) {
  return toArray(itemIds).map((id) => {
    const key = String(id);
    return itemRowsByItemId.get(key)?.uid || itemRowsByUid.get(key)?.uid || key;
  });
}

function imageNameForSpecialAsset(name, tags = []) {
  const label = withoutTrailingPeriod(name);
  const normalized = normalizeDataText(label);
  const tagSet = new Set(tags);

  if (tagSet.has("spellbook") || normalized.endsWith("spellbook")) {
    const spellbookImages = {
      "standard spellbook": "Standard_spellbook.png",
      "ancient spellbook": "Ancient_spellbook.png",
      "lunar spellbook": "Lunar_spellbook.png",
      "arceuus spellbook": "Arceuus_spellbook.png"
    };
    return spellbookImages[normalized] ?? `${titleCase(normalized).replace(/ /g, "_")}.png`;
  }

  if (tagSet.has("prayer") || ["piety", "rigour", "augury", "chivalry", "deadeye", "mystic vigour"].includes(normalized)) {
    return `${label.replace(/ /g, "_").replace("Mystic_Vigour", "Mystic_Vigour")}.png`;
  }

  return null;
}

function resolveDataImage(name, tags = []) {
  if (!name) return "";
  const value = String(name);
  if (value.includes("/")) return value;

  const itemRow = itemRowsByName.get(normalizeDataText(value));
  if (itemRow?.imageName) return itemImage(itemRow.imageName);

  const specialName = imageNameForSpecialAsset(value, tags);
  if (specialName) return imageAsset(specialName);

  return itemImage(value.endsWith(".png") ? value : `${value}.png`);
}

function imageForDataEntry(entry) {
  return entry?.imagePath || (entry?.imageName ? itemImage(entry.imageName) : resolveDataImage(entry?.imageUsed, entry?.tags));
}

function normalizeChallengeTask(taskEntry, type, legacyId) {
  const uid = dataUid(taskEntry, type);
  const id = `${type}-${uid}`;
  if (legacyId) challengeIdAliases[legacyId] = id;

  return {
    ...taskEntry,
    id,
    legacyId,
    title: dataDisplayName(taskEntry, "Task"),
    points: toNumber(taskEntry?.points, 1),
    repeatable: Boolean(taskEntry?.repeatable),
    cost: toNumber(taskEntry?.cost, 5)
  };
}

function normalizePvmChallenges(data) {
  return toArray(data?.pvmStages).map((stage, groupIndex) => ({
    stage: stage.stage || `Stage ${groupIndex + 1}`,
    killRequirement: toNumber(stage.killRequirement, 0),
    items: toArray(stage.tasks || stage.items).map((taskEntry, index) => {
      const legacyId = challengeId("pvm", groupIndex, index);
      const normalized = normalizeChallengeTask(taskEntry, "pvm", legacyId);
      if (normalized.repeatable) {
        normalized.id = `repeatable-${dataUid(taskEntry, "task")}`;
        repeatableIdAliases[challengeId("repeatable", groupIndex, index)] = normalized.id;
        repeatableIdAliases[legacyId] = normalized.id;
      }
      return normalized;
    })
  }));
}

function normalizePvpChallenges(data) {
  return toArray(data?.pvpTasks).map((taskEntry, index) => normalizeChallengeTask(taskEntry, "pvp", challengeId("pvp", index)));
}

function normalizeCollectionSetDefinitions(data) {
  const sets = toArray(data?.itemSets).map((setEntry) => ({
    ...setEntry,
    id: dataUid(setEntry, "set"),
    name: dataDisplayName(setEntry, "Set"),
    originalName: setEntry.name,
    itemIds: itemIdsFromDataIds(setEntry.itemIds),
    tags: uniqueTags(setEntry.tags ?? []),
    images: [imageForDataEntry(setEntry)].filter(Boolean)
  }));

  return sets;
}

function normalizeTalentUnlock(entry, sourceType) {
  const cost = toNumber(entry.cost, NaN);
  const tier = toNumber(entry.tier, NaN);
  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(tier) || tier <= 0) return null;

  const tags = uniqueTags(entry.tags ?? []);
  const collectionIds = sourceType === "set"
    ? itemIdsFromDataIds(entry.itemIds)
    : [dataUid(entry)].filter(Boolean);

  return {
    id: dataUid(entry),
    name: dataDisplayName(entry, "Unlock"),
    cost,
    tier,
    tags,
    requires: toArray(entry.requires),
    collectionIds,
    images: [imageForDataEntry({ ...entry, tags })].filter(Boolean),
    collectionCategory: collectionCategoryFromTags(tags)
  };
}

function buildDataUnlocks(itemsData, itemSetsData, unlocksData) {
  const itemUnlocks = toArray(itemsData?.items)
    .filter((item) => toArray(item.tags).includes("talent"))
    .map((item) => normalizeTalentUnlock(item, "item"));
  const setUnlocks = toArray(itemSetsData?.itemSets)
    .filter((itemSet) => toArray(itemSet.tags).includes("talent"))
    .map((itemSet) => normalizeTalentUnlock(itemSet, "set"));
  const nonItemUnlocks = toArray(unlocksData?.unlocks)
    .filter((unlock) => toArray(unlock.tags).includes("talent"))
    .map((unlock) => normalizeTalentUnlock(unlock, "unlock"));

  return [...itemUnlocks, ...setUnlocks, ...nonItemUnlocks].filter(Boolean);
}

function mergeUnlocks(dataUnlocks) {
  const seen = new Set();
  return dataUnlocks.filter((unlock) => {
    if (!unlock?.id || seen.has(unlock.id)) return false;
    seen.add(unlock.id);
    return true;
  });
}

function normalizeShopItems(data) {
  const jsonShopItems = toArray(data?.shopItems).map((shopItem) => ({
    id: dataUid(shopItem, "shop"),
    category: shopItem.category || "Other",
    name: dataDisplayName(shopItem, "Shop item"),
    cost: toNumber(shopItem.cost, 1),
    items: toArray(shopItem.items).map((entry) => ({
      image: entry.image ? resolveDataImage(entry.image, entry.tags) : resolveDataImage(entry.imageUsed || entry.name || entry.uid, entry.tags),
      amount: entry.amount
    }))
  }));

  shopCategories = toArray(data?.categories).length
    ? toArray(data.categories).map((category) => String(category)).filter(Boolean)
    : [...new Set(jsonShopItems.map((item) => item.category))];

  if (!jsonShopItems.length) dataWarnings.push("BronzemanShop.json does not define any shopItems.");
  return jsonShopItems;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function enrichCollectionSignals(items) {
  return items.map((item) => {
    const tags = uniqueTags(item.tags ?? []);
    if (unlocks.some((unlock) => unlockMatchesCollectionItem(unlock, item)) && !tags.includes("talent")) tags.push("talent");
    if (shopItems.some((shopItem) => shopMatchesCollectionItem(shopItem, item)) && !tags.includes("shop")) tags.push("shop");

    const displayTags = uniqueTags(tags.map(collectionDisplayTag));
    return {
      ...item,
      tags,
      category: collectionCategoryFromTags(tags),
      sourceType: collectionSourceType({ ...item, tags }),
      automatic: collectionSourceType({ ...item, tags }) !== "collection",
      searchText: normalizeCollectionText(`${item.name} ${item.originalName ?? ""} ${tags.join(" ")} ${displayTags.join(" ")}`)
    };
  });
}

async function loadAppData() {
  try {
    const [itemsData, itemSetsData, unlocksData, pvmData, pvpData, shopData] = await Promise.all([
      fetchJson(DATA_URLS.items),
      fetchJson(DATA_URLS.itemSets),
      fetchJson(DATA_URLS.unlocks),
      fetchJson(DATA_URLS.pvm),
      fetchJson(DATA_URLS.pvp),
      fetchJson(DATA_URLS.shop)
    ]);

    challengeIdAliases = {};
    repeatableIdAliases = {};
    indexItemRows(itemsData.items);

    challenges = {
      pvm: normalizePvmChallenges(pvmData),
      pvp: normalizePvpChallenges(pvpData)
    };
    collectionSetDefinitions = normalizeCollectionSetDefinitions(itemSetsData);
    unlocks = mergeUnlocks(buildDataUnlocks(itemsData, itemSetsData, unlocksData));
    shopItems = normalizeShopItems(shopData);

    const seen = new Set();
    const items = toArray(itemsData.items)
      .map(collectionItemFromDefinition)
      .filter((item) => {
        const key = item.id || normalizeAssetPath(item.images?.[0]) || normalizeCollectionText(item.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    itemDefinitions = enrichCollectionSignals(collapseCollectionSets(items));
  } catch (error) {
    console.warn("Could not load Bronzeman JSON data", error);
    dataWarnings.push("Could not load one or more Bronzeman JSON files.");
    challenges = { pvm: [], pvp: [] };
    unlocks = [];
    shopItems = [];
    shopCategories = [];
    collectionSetDefinitions = [];
    itemDefinitions = [];
  }
}

function itemDisplayName(item) {
  return item.alias || item.name || "Item";
}

function itemTagList(item) {
  return uniqueTags(item.tags ?? []);
}

function itemImagePath(item) {
  return item.imagePath || (item.imageName ? itemImage(item.imageName) : "");
}

function collectionSourceType(item) {
  const tags = itemTagList(item);
  if (item.alwaysAvailable || item.unlocked) return "always";
  if (tags.includes("talent")) return "talent";
  if (tags.includes("shop")) return "shop";
  return "collection";
}

function collectionTagGroups(tags) {
  const groups = new Set();

  (tags ?? []).forEach((tag) => {
    if (tag === "spec wep") groups.add("spec");
    else if (tag === "range wep" || tag === "range arm") groups.add("range");
    else if (tag === "mage wep" || tag === "mage arm") groups.add("mage");
    else if (tag === "melee wep" || tag === "melee arm") groups.add("melee");
    else if (tag === "generic gear") groups.add("gear");
    else if (tag === "talent") groups.add("talent");
    else if (tag === "shop") groups.add("shop");
    else if (tag === "potions") groups.add("potions");
    else if (tag === "runes") groups.add("runes");
    else if (tag === "ammo") groups.add("ammo");
    else if (tag === "food") groups.add("food");
    else if (tag === "consumables") groups.add("other");
    else groups.add("other");
  });

  return [...groups];
}

function collectionFilterLabel(id) {
  return collectionFilterDefinitions.find((filter) => filter.id === id)?.label ?? titleCase(id);
}

function collectionDisplayTag(tag) {
  if (tag === "spec wep") return "spec";
  if (tag === "range wep" || tag === "range arm") return "range";
  if (tag === "mage wep" || tag === "mage arm") return "mage";
  if (tag === "melee wep" || tag === "melee arm") return "melee";
  if (tag === "generic gear") return "generic";
  if (tag === "consumables") return "other";
  return tag;
}

function collectionDisplayTags(item) {
  return uniqueTags((item.tags ?? []).map(collectionDisplayTag));
}

function collectionPrimaryGroup(tags) {
  const groups = collectionTagGroups(tags);
  return collectionCategoryPriority.find((group) => groups.includes(group)) ?? "other";
}

function collectionCategoryFromTags(tags) {
  return collectionFilterLabel(collectionPrimaryGroup(tags));
}

function collectionItemFromDefinition(item) {
  const tags = itemTagList(item);
  const name = itemDisplayName(item);
  const image = itemImagePath(item);
  const sourceType = collectionSourceType(item);
  const displayTags = uniqueTags(tags.map(collectionDisplayTag));

  return {
    ...item,
    id: item.uid || item.id || `item-${item.itemId ?? slugifyItemId(item.name)}`,
    name,
    originalName: item.name,
    itemId: item.itemId,
    category: collectionCategoryFromTags(tags),
    sourceType,
    automatic: sourceType !== "collection",
    images: image ? [image] : [],
    tags,
    searchText: normalizeCollectionText(`${name} ${item.name ?? ""} ${tags.join(" ")} ${displayTags.join(" ")}`)
  };
}

function mergedCollectionSet(definition, itemsById) {
  const members = definition.itemIds.map((id) => itemsById.get(id)).filter(Boolean);
  if (!members.length) return null;

  const tags = uniqueTags([...(definition.tags ?? []), ...members.flatMap((item) => item.tags ?? [])]);
  const images = definition.images?.length ? definition.images : members[0].images?.slice(0, 1) ?? [];
  const sourceType = collectionSourceType({ ...definition, tags });
  const displayTags = uniqueTags(tags.map(collectionDisplayTag));
  const name = dataDisplayName(definition, definition.name || "Set");

  return {
    ...members[0],
    ...definition,
    id: definition.id,
    collectionIds: definition.itemIds,
    name,
    originalName: definition.originalName || definition.name,
    category: collectionCategoryFromTags(tags),
    sourceType,
    automatic: sourceType !== "collection",
    images,
    tags,
    searchText: normalizeCollectionText(`${name} ${members.map((item) => item.name).join(" ")} ${tags.join(" ")} ${displayTags.join(" ")}`)
  };
}

function collapseCollectionSets(items) {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const challengeRewardIds = new Set(PERILOUS_MOONS_REWARD_IDS);
  const collapsibleSets = collectionSetDefinitions.filter((definition) => {
    return !definition.itemIds.some((id) => challengeRewardIds.has(id));
  });
  const mergedItemIds = new Set(collapsibleSets.flatMap((definition) => definition.itemIds));
  const mergedItems = collapsibleSets.map((definition) => mergedCollectionSet(definition, itemsById)).filter(Boolean);

  return [
    ...items.filter((item) => !item.hidden && !mergedItemIds.has(item.id)),
    ...mergedItems
  ];
}


function collectionItems() {
  return itemDefinitions;
}

function unlockMatchesCollectionItem(unlock, item) {
  const itemIds = [item.id, ...(item.collectionIds ?? [])];
  if (itemIds.some((id) => (unlock.collectionIds ?? []).includes(id))) return true;

  const itemImages = new Set((item.images ?? []).map(normalizeAssetPath));
  return (unlock.images ?? [unlock.image]).some((image) => itemImages.has(normalizeAssetPath(image)));
}

function shopMatchesCollectionItem(shopItem, item) {
  const itemImages = new Set((item.images ?? []).map(normalizeAssetPath));
  const entries = shopItem.items ?? (shopItem.images ?? []).map((image) => ({ image }));
  return entries.some((entry) => itemImages.has(normalizeAssetPath(entry.image)));
}

function collectionIsUnlocked(item) {
  if (item.sourceType === "always") return true;
  if (challengeCollectionUnlocksItem(item)) return true;

  const tags = item.tags ?? [];
  const unlockedByTalent = tags.includes("talent") && unlocks.some((unlock) => state.purchased.includes(unlock.id) && unlockMatchesCollectionItem(unlock, item));
  const unlockedByShop = tags.includes("shop") && shopItems.some((shopItem) => (state.shopPurchases[shopItem.id] ?? 0) > 0 && shopMatchesCollectionItem(shopItem, item));

  if (unlockedByTalent || unlockedByShop) return true;
  if (tags.includes("talent") || tags.includes("shop")) return false;
  return state.basicUnlocks.includes(item.id);
}
function collectionStatusLabel(item) {
  if (item.sourceType === "always") return "Unlocked";
  return collectionIsUnlocked(item) ? "Unlocked" : "Locked";
}

function collectionMatchesFilter(item) {
  const unlocked = collectionIsUnlocked(item);
  if (collectionFilterMode === "unlocked") return unlocked;
  if (collectionFilterMode === "locked") return !unlocked;
  if (collectionFilterMode === "all" || !collectionActiveFilters.size) return true;

  const groups = collectionTagGroups(item.tags ?? []);
  return groups.some((group) => collectionActiveFilters.has(group));
}

function visibleCollectionItems() {
  const query = normalizeCollectionText(collectionSearch);
  const items = collectionItems().filter((item) => {
    return collectionMatchesFilter(item) && (!query || item.searchText.includes(query));
  });

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

function collectionGroups() {
  const groupMap = new Map();
  visibleCollectionItems().forEach((item) => {
    const category = item.category ?? "Collection";
    if (!groupMap.has(category)) groupMap.set(category, { category, items: [] });
    groupMap.get(category).items.push(item);
  });

  const groups = [...groupMap.values()].filter((group) => group.items.length);
  return groups.sort((a, b) => {
    if (a.category === "General") return -1;
    if (b.category === "General") return 1;
    return a.category.localeCompare(b.category);
  });
}

function renderUnlockCard(item) {
  const checkable = !item.automatic && item.sourceType === "collection";
  const label = document.createElement(checkable ? "label" : "article");
  const unlocked = collectionIsUnlocked(item);
  const status = collectionStatusLabel(item);
  label.className = `unlocked-item ${checkable ? "checkable" : "auto"} ${unlocked ? "is-unlocked" : "is-locked"} source-${item.sourceType}`;
  label.title = checkable ? `${unlocked ? "Lock" : "Unlock"} ${item.name}` : `${item.name} - ${status}`;
  if (checkable) label.setAttribute("aria-label", `${unlocked ? "Lock" : "Unlock"} ${item.name}`);

  const images = renderItemImages(item.images ?? [item.image]);
  label.innerHTML = `
    ${checkable ? `<input type="checkbox" ${unlocked ? "checked" : ""} aria-label="Unlock ${escapeHtml(item.name)}" />` : ""}
    <div class="unlocked-art">${images}</div>
    <div class="unlocked-copy">
      <h3>${escapeHtml(item.name)}</h3>
      <span>${escapeHtml(collectionDisplayTags(item).join(", ") || "No tags")}</span>
    </div>
  `;

  if (checkable) {
    label.querySelector("input").addEventListener("change", (event) => {
      setBasicUnlockChecked(item.id, event.target.checked);
      saveState();
      renderUnlocks();
    });
  }

  return label;
}

function refreshCollectionFilterButtons() {
  const target = document.getElementById("collectionFilters");
  if (!target) return;

  target.innerHTML = collectionFilterOptions().map((filter) => {
    const active = filter.type === "mode" ? filter.id === collectionFilterMode : collectionActiveFilters.has(filter.id);
    return `
    <button type="button" data-collection-filter="${filter.id}" class="${active ? "active" : ""}" aria-pressed="${active}">${filter.label}</button>
  `;
  }).join("");

  target.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = collectionFilterDefinitions.find((definition) => definition.id === button.dataset.collectionFilter);
      if (!filter) return;

      if (filter.type === "mode") {
        collectionFilterMode = filter.id;
        collectionActiveFilters.clear();
      } else {
        collectionFilterMode = "custom";
        if (collectionActiveFilters.has(filter.id)) collectionActiveFilters.delete(filter.id);
        else collectionActiveFilters.add(filter.id);
        if (!collectionActiveFilters.size) collectionFilterMode = "all";
      }

      refreshCollectionFilterButtons();
      renderUnlocks();
    });
  });
}

function refreshCollectionSearchDatalist() {
  const datalist = document.getElementById("collectionSearchResults");
  if (!datalist) return;

  const seen = new Set();
  const options = collectionItems()
    .filter((item) => {
      const key = normalizeCollectionText(item.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `<option value="${escapeHtml(item.name)}" label="${escapeHtml(collectionDisplayTags(item).join(", "))}"></option>`)
    .join("");

  datalist.innerHTML = options;
}

function manuallyUnlockSearchSelection() {
  const input = document.getElementById("collectionSearch");
  const value = input?.value ?? "";
  const normalized = normalizeCollectionText(value);
  if (!normalized) return;

  const match = collectionItems().find((item) => normalizeCollectionText(item.name) === normalized && item.sourceType === "collection");
  if (!match) return;

  setBasicUnlockChecked(match.id, true);
  collectionSearch = match.name;
  if (input) input.value = match.name;
  saveState();
  renderUnlocks();
}

function initCollectionControls() {
  refreshCollectionFilterButtons();
  refreshCollectionSearchDatalist();

  const searchInput = document.getElementById("collectionSearch");
  const unlockButton = document.getElementById("manualUnlockButton");

  searchInput?.addEventListener("input", (event) => {
    collectionSearch = event.target.value;
    renderUnlocks();
  });

  searchInput?.addEventListener("change", manuallyUnlockSearchSelection);
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    manuallyUnlockSearchSelection();
  });

  unlockButton?.addEventListener("click", manuallyUnlockSearchSelection);
}

function renderUnlocks() {
  const target = document.getElementById("unlocksList");
  if (!target) return;

  target.innerHTML = "";
  refreshCollectionSearchDatalist();

  const groups = collectionGroups();
  if (!groups.length) {
    target.innerHTML = `<p class="empty-unlocks">No collection items found.</p>`;
    return;
  }

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "unlocked-group";
    section.innerHTML = `<h3 class="unlocked-group-title">${escapeHtml(group.category)}</h3><div class="unlocked-grid"></div>`;

    const grid = section.querySelector(".unlocked-grid");
    group.items.forEach((item) => grid.appendChild(renderUnlockCard(item)));

    target.appendChild(section);
  });
}

function buyUnlock(id) {
  const unlock = unlocks.find((item) => item.id === id);
  if (!unlock || !canBuy(unlock)) return;
  state.purchased.push(id);
  saveState();
  renderStats();
  updateTalentTreeState();
  renderUnlocks();
}

function refundUnlock(id) {
  state.purchased = state.purchased.filter((item) => item !== id);
  saveState();
  renderStats();
  updateTalentTreeState();
  renderUnlocks();
}

function renderStats() {
  const pvmChallenges = flattenPvmChallenges();
  const pvpChallenges = flattenPvpChallenges();
  const repeatables = flattenRepeatables();
  const pvmCompleted = pvmChallenges.filter((challenge) => state.completed.includes(challenge.id)).length;
  const pvpCompleted = pvpChallenges.filter((challenge) => state.completed.includes(challenge.id)).length;
  const pvmPoints = pvmChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
  const pvpPoints = pvpChallenges.reduce((sum, challenge) => sum + challenge.points, 0);
  const pvmEarnedPoints = pvmChallenges.reduce((sum, challenge) => sum + (state.completed.includes(challenge.id) ? challenge.points : 0), 0);
  const pvpEarnedPoints = pvpChallenges.reduce((sum, challenge) => sum + (state.completed.includes(challenge.id) ? challenge.points : 0), 0);
  const repeatablePurchased = repeatables.reduce((sum, repeatable) => sum + (state.repeatablePurchases[repeatable.id] ?? 0), 0);
  const complete = totalCompleted();
  const total = pvmChallenges.length + pvpChallenges.length;
  const percent = total ? (complete / total) * 100 : 0;

  document.getElementById("availablePoints").textContent = availablePoints();
  document.getElementById("earnedPoints").textContent = earnedUnlockPoints();
  document.getElementById("spentPoints").textContent = totalSpent();
  document.getElementById("killPoints").textContent = availableKillPoints();
  document.getElementById("killsEarned").textContent = state.playerKills;
  document.getElementById("playerKills").value = state.playerKills;
  document.getElementById("shopSpent").textContent = totalShopSpent() + totalRepeatableSpent();
  document.getElementById("challengeProgress").textContent = `${complete} / ${total}`;
  document.getElementById("repeatableCount").textContent = `${repeatablePurchased} bought`;
  document.getElementById("pvmCount").textContent = `${pvmCompleted} / ${pvmChallenges.length} tasks | ${pvmEarnedPoints} / ${pvmPoints} points`;
  document.getElementById("pvpCount").textContent = `${pvpCompleted} / ${pvpChallenges.length} tasks | ${pvpEarnedPoints} / ${pvpPoints} points`;
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
  renderRepeatables();
  renderTalentTree();
  renderShop();
  renderChallengeUnlocks();
  renderUnlocks();
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});

document.getElementById("playerKills").addEventListener("input", (event) => {
  state.playerKills = Math.max(0, Math.floor(Number(event.target.value) || 0));
  saveState();
  renderStats();
  renderPvmChallenges();
  updateShopState();
  updateRepeatableState();
});

document.getElementById("addKillButton").addEventListener("click", () => {
  state.playerKills += 1;
  saveState();
  renderStats();
  renderPvmChallenges();
  updateShopState();
  updateRepeatableState();
});

document.getElementById("removeKillButton").addEventListener("click", () => {
  state.playerKills = Math.max(0, state.playerKills - 1);
  saveState();
  renderStats();
  renderPvmChallenges();
  updateShopState();
  updateRepeatableState();
});

document.getElementById("resetButton").addEventListener("click", () => {
  setSettingsOpen(false);
  const shouldReset = window.confirm("Reset completed challenges, talents, collection checks, challenge rolls, PK points, repeatables, and shop purchases?");
  if (!shouldReset) return;
  Object.assign(state, defaultState());
  saveState();
  render();
});

async function initApp() {
  await loadAppData();
  Object.assign(state, sanitizeState(state));
  initCollectionControls();
  showTab("tasks");
  render();
  initFirebaseAuth();

  if (dataWarnings.length) console.warn("Bronzeman data warnings", dataWarnings);
}

initApp();








