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
  surgePotion: wikiImage("Surge potion(4).png"),
  lootKey: wikiImage("Loot key.png"),
  talentToken: wikiImage("Warrior guild token.png"),
  astral: wikiImage("Astral rune.png"),
  air: wikiImage("Air rune.png"),
  water: wikiImage("Water rune.png"),
  earth: wikiImage("Earth rune.png"),
  fire: wikiImage("Fire rune.png"),
  mind: wikiImage("Mind rune.png"),
  body: wikiImage("Body rune.png"),
  soul: wikiImage("Soul rune.png"),
  nature: wikiImage("Nature rune.png"),
  burningAmulet: wikiImage("Burning amulet(5).png"),
  ancientIceSack: wikiImage("Blighted ancient ice sack.png"),
  vengeanceSack: wikiImage("Blighted vengeance sack.png"),
  blood: wikiImage("Blood rune.png"),
  death: wikiImage("Death rune.png"),
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
  halibut: wikiImage("Halibut.png"),
  marlin: wikiImage("Marlin.png"),
  pineapplePizza: wikiImage("Pineapple pizza.png"),
  blightedManta: wikiImage("Blighted manta ray.png"),
  blightedRestore: wikiImage("Blighted super restore(4).png"),
  blightedEntangle: wikiImage("Blighted entangle sack.png"),
  blightedTeleport: wikiImage("Blighted teleport spell sack.png"),
  seedPod: wikiImage("Royal seed pod.png"),
  revenantEther: wikiImage("Revenant ether.png"),
  bracelet: wikiImage("Bracelet of ethereum.png"),
  blackDhideBody: wikiImage("Black d'hide body.png"),
  blackDhideChaps: wikiImage("Black d'hide chaps.png"),
  xericianHat: wikiImage("Xerician hat.png"),
  xericianTop: wikiImage("Xerician top.png"),
  xericianRobe: wikiImage("Xerician robe.png"),
  helmNeitiznot: wikiImage("Helm of neitiznot.png"),
  berserkerHelm: wikiImage("Berserker helm.png"),
  archerHelm: wikiImage("Archer helm.png"),
  farseerHelm: wikiImage("Farseer helm.png"),
  climbingBoots: wikiImage("Climbing boots.png"),
  amuletGlory: wikiImage("Amulet of glory(4).png"),
  runeGloves: wikiImage("Rune gloves.png"),
  barrowsGloves: wikiImage("Barrows gloves.png"),
  saradominCape: wikiImage("Saradomin cape.png"),
  guthixCape: wikiImage("Guthix cape.png"),
  zamorakCape: wikiImage("Zamorak cape.png"),
  saradominStaff: wikiImage("Saradomin staff.png"),
  guthixStaff: wikiImage("Guthix staff.png"),
  zamorakStaff: wikiImage("Zamorak staff.png"),
  mysticRobeTopLight: wikiImage("Mystic robe top (light).png"),
  mysticRobeTop: wikiImage("Mystic robe top.png"),
  mysticRobeBottom: wikiImage("Mystic robe bottom.png")
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
  { id: "god-capes", name: "God Capes", cost: 1, tier: 1, requires: [], images: [itemImages.saradominCape, itemImages.guthixCape, itemImages.zamorakCape] },
  { id: "god-staves", name: "God Staves", cost: 1, tier: 1, requires: [], images: [itemImages.saradominStaff, itemImages.guthixStaff, itemImages.zamorakStaff] },
  { id: "rcb", name: "Rune Crossbow", cost: 1, tier: 1, requires: [], images: [itemImages.rcb] },
  { id: "dds", name: "DDS", cost: 1, tier: 1, requires: [], images: [itemImages.dds] },
  { id: "arkan-blade", name: "Arkan Blade", cost: 1, tier: 1, requires: [], images: [itemImages.arkanBlade] },

  { id: "void", name: "Void", cost: 2, tier: 2, requires: [], images: [itemImages.void] },
  { id: "torso", name: "Fighter Torso", cost: 2, tier: 2, requires: [], images: [itemImages.torso] },
  { id: "defenders", name: "Defenders", cost: 2, tier: 2, requires: [], images: [itemImages.defenders] },
  { id: "msb", name: "MSB(i)", cost: 2, tier: 2, requires: [], images: [itemImages.msb] },
  { id: "trouver", name: "Trouver Parchment", cost: 2, tier: 2, requires: [], images: [itemImages.trouver] },
  { id: "rune-gloves", name: "Rune Gloves", cost: 2, tier: 2, requires: [], images: [itemImages.runeGloves] },

  { id: "firecape", name: "Fire Cape", cost: 3, tier: 3, requires: [], images: [itemImages.fireCape] },
  { id: "ma2-cape", name: "MA2 Cape", cost: 3, tier: 3, requires: [], images: [itemImages.ma2Cape] },
  { id: "surge-potions", name: "Surge Potions", cost: 3, tier: 3, requires: [], images: [itemImages.surgePotion] },
  { id: "dragon-knives", name: "Dragon Knives", cost: 3, tier: 3, requires: [], images: [itemImages.dragonKnife] },
  { id: "ancient-mace", name: "Ancient Mace", cost: 3, tier: 3, requires: [], images: [itemImages.ancientMace] },

  { id: "gmaul", name: "Granite Maul", cost: 4, tier: 4, requires: [], images: [itemImages.gmaul] },
  { id: "anchor", name: "Barrelchest Anchor", cost: 4, tier: 4, requires: [], images: [itemImages.barrelchest] },
  { id: "dark-bow", name: "Dark Bow + Seeker", cost: 4, tier: 4, requires: [], images: [itemImages.darkBow, itemImages.seekerArrow] },
  { id: "dragon-thrownaxe", name: "Dragon Thrownaxe", cost: 4, tier: 4, requires: [], images: [itemImages.dragonThrownaxe] },
  { id: "toxic-staff", name: "Toxic Staff", cost: 4, tier: 4, requires: [], images: [itemImages.toxicStaff] },
  { id: "barrows-gloves", name: "Barrows Gloves", cost: 4, tier: 4, requires: [], images: [itemImages.barrowsGloves] },

  { id: "ornate-maul", name: "Ornate Maul", cost: 5, tier: 5, requires: [], images: [itemImages.ornateMaul] },
  { id: "colossal-barrelchest", name: "Colossal / Anchor", cost: 5, tier: 5, requires: [], images: [itemImages.colossal, itemImages.barrelchest] },
  { id: "zgs", name: "ZGS Freeze", cost: 5, tier: 5, requires: [], images: [itemImages.zamorakGodsword] },
  { id: "accursed", name: "Accursed Sceptre", cost: 5, tier: 5, requires: [], images: [itemImages.accursed] },
  { id: "webweaver", name: "Webweaver Bow", cost: 5, tier: 5, requires: [], images: [itemImages.webweaver] },
  { id: "chainmace", name: "Ursine Chainmace", cost: 5, tier: 5, requires: [], images: [itemImages.chainmace] },
  { id: "voidwaker", name: "Voidwaker", cost: 6, tier: 5, requires: [], images: [itemImages.voidwaker] }
];

const shopCategories = ["Runes / Ammo", "Food", "Potions", "Other"];

const shopItems = [
  { id: "barrages", category: "Runes / Ammo", name: "Barrage sacks", cost: 1, items: [{ image: itemImages.ancientIceSack, amount: "100" }] },
  { id: "tb-sacks", category: "Runes / Ammo", name: "TB sacks", cost: 1, items: [{ image: itemImages.blightedTeleport, amount: "10" }] },
  { id: "veng-sacks", category: "Runes / Ammo", name: "Veng sacks", cost: 1, items: [{ image: itemImages.vengeanceSack, amount: "25" }] },
  { id: "amethyst-arrows", category: "Runes / Ammo", name: "Amethyst arrows", cost: 1, items: [{ image: itemImages.amethystArrow, amount: "250" }] },
  { id: "dragon-bolts", category: "Runes / Ammo", name: "Dragonstone bolts", cost: 1, items: [{ image: itemImages.dragonBolt, amount: "100" }] },
  { id: "dragon-knives", category: "Runes / Ammo", name: "Dragon knives", cost: 1, items: [{ image: itemImages.dragonKnife, amount: "50" }] },
  { id: "dragon-thrownaxes", category: "Runes / Ammo", name: "Dragon thrownaxes", cost: 1, items: [{ image: itemImages.dragonThrownaxe, amount: "50" }] },
  { id: "combo-food", category: "Food", name: "Halibut", cost: 2, items: [{ image: itemImages.halibut, amount: "50" }] },
  { id: "standard-food", category: "Food", name: "Anglers / marlin", cost: 1, items: [{ image: itemImages.angler, amount: "100" }, { image: itemImages.marlin, amount: "100" }] },
  { id: "surge-potions", category: "Potions", name: "Surge pots", cost: 2, items: [{ image: itemImages.surgePotion, amount: "5" }] },
  { id: "stamina-pots", category: "Potions", name: "Stam pots", cost: 2, items: [{ image: itemImages.stamina, amount: "5" }] },
  { id: "brews", category: "Potions", name: "Brews", cost: 1, items: [{ image: itemImages.brew, amount: "20" }] },
  { id: "restores", category: "Potions", name: "Restores", cost: 1, items: [{ image: itemImages.restore, amount: "10" }] },
  { id: "range-pots", category: "Potions", name: "Range pots", cost: 1, items: [{ image: itemImages.ranging, amount: "5" }] },
  { id: "super-combats", category: "Potions", name: "Super combats", cost: 1, items: [{ image: itemImages.superCombat, amount: "5" }] },
  { id: "antivenom", category: "Potions", name: "Antivenom", cost: 1, items: [{ image: itemImages.antivenom, amount: "2" }] },
  { id: "rev-kit", category: "Other", name: "Rev kit", cost: 2, items: [{ image: itemImages.bracelet }, { image: itemImages.revenantEther, amount: "100" }, { image: itemImages.burningAmulet }] }
];
const shopIdAliases = {
  "tb-runes": "tb-sacks",
  "veng-runes": "veng-sacks"
};
const basicUnlockGroups = [
  {
    category: "Elemental Runes",
    source: "Loot unlock",
    items: [
      { id: "rune-air", name: "Air Rune", images: [itemImages.air] },
      { id: "rune-water", name: "Water Rune", images: [itemImages.water] },
      { id: "rune-earth", name: "Earth Rune", images: [itemImages.earth] },
      { id: "rune-fire", name: "Fire Rune", images: [itemImages.fire] }
    ]
  },
  {
    category: "Basic Runes",
    source: "Loot unlock",
    items: [
      { id: "rune-body", name: "Body Rune", images: [itemImages.body] },
      { id: "rune-mind", name: "Mind Rune", images: [itemImages.mind] },
      { id: "rune-chaos", name: "Chaos Rune", images: [itemImages.chaos] },
      { id: "rune-death", name: "Death Rune", images: [itemImages.death] }
    ]
  },
  {
    category: "High Runes",
    source: "Loot unlock",
    items: [
      { id: "rune-blood", name: "Blood Rune", images: [itemImages.blood] },
      { id: "rune-soul", name: "Soul Rune", images: [itemImages.soul] },
      { id: "rune-nature", name: "Nature Rune", images: [itemImages.nature] },
      { id: "rune-law", name: "Law Rune", images: [itemImages.law] }
    ]
  },
  {
    category: "Food",
    source: "Always available",
    items: [
      { id: "basic-sharks", name: "Sharks", images: [itemImages.shark] },
      { id: "basic-karambwan", name: "Karambwan", images: [itemImages.karambwan] }
    ]
  },
  {
    category: "Weapons",
    source: "PK loot",
    items: [
      { id: "basic-msb", name: "Magic Shortbow", images: [itemImages.msb] },
      { id: "basic-rcb", name: "Rune Crossbow", images: [itemImages.rcb] },
      { id: "basic-dds", name: "DDS", images: [itemImages.dds] },
      { id: "basic-gmaul", name: "Granite Maul", images: [itemImages.gmaul] }
    ]
  },
  {
    category: "Range Gear",
    source: "PK loot",
    items: [
      { id: "basic-black-dhide", name: "Black d'hide", images: [itemImages.blackDhideBody] },
      { id: "basic-glory", name: "Amulet of Glory", images: [itemImages.amuletGlory] },
      { id: "basic-climbing-boots", name: "Climbing Boots", images: [itemImages.climbingBoots] }
    ]
  },
  {
    category: "Mage Gear",
    source: "PK loot",
    items: [
      { id: "basic-xerician", name: "Xerician Set", images: [itemImages.xericianTop] },
      { id: "basic-mystic", name: "Mystic Set", images: [itemImages.mysticRobeTopLight] }
    ]
  },
  {
    category: "Melee Gear",
    source: "PK loot",
    items: [
      { id: "basic-fremmy-helms", name: "Fremmy Helms", images: [itemImages.berserkerHelm] },
      { id: "basic-neitz", name: "Neitiznot Helm", images: [itemImages.helmNeitiznot] }
    ]
  }
];
const state = loadState();
let currentUser = null;
let saveTimer = null;
let isApplyingRemoteState = false;

function flattenBasicUnlocks() {
  return basicUnlockGroups.flatMap((group) => group.items);
}

function defaultState() {
  return { completed: [], purchased: [], shopPurchases: {}, basicUnlocks: [], playerKills: 0 };
}

function sanitizeState(rawState) {
  const validUnlocks = new Set(unlocks.map((unlock) => unlock.id));
  const validBasicUnlocks = new Set(flattenBasicUnlocks().map((item) => item.id));
  const validShopItems = new Set(shopItems.map((item) => item.id));
  const shopPurchases = {};

  Object.entries(rawState?.shopPurchases ?? {}).forEach(([id, count]) => {
    const nextId = shopIdAliases[id] ?? id;
    if (validShopItems.has(nextId) && Number.isFinite(count)) {
      shopPurchases[nextId] = Math.max(shopPurchases[nextId] ?? 0, Math.floor(count));
    }
  });

  return {
    completed: Array.isArray(rawState?.completed) ? [...new Set(rawState.completed)] : [],
    purchased: Array.isArray(rawState?.purchased)
      ? [...new Set(rawState.purchased)].filter((id) => validUnlocks.has(id))
      : [],
    shopPurchases,
    basicUnlocks: Array.isArray(rawState?.basicUnlocks)
      ? [...new Set(rawState.basicUnlocks)].filter((id) => validBasicUnlocks.has(id))
      : [],
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
    basicUnlocks: [...local.basicUnlocks, ...remote.basicUnlocks],
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
  return `${cost} ${cost === 1 ? "Kill" : "Kills"}`;
}

function renderShopStack(entry) {
  return `
    <span class="shop-stack">
      <img src="${entry.image}" alt="" loading="lazy" />
      ${entry.amount ? `<span class="stack-amount">${entry.amount}</span>` : ""}
    </span>
  `;
}

function renderItemImages(images) {
  return images.filter(Boolean)
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
      <span class="purchase-count">Bought ${owned}</span>
    </div>
    <button type="button" ${canAfford ? "" : "disabled"}>${killCostLabel(item.cost)}</button>
  `;

  card.querySelector("button").addEventListener("click", () => {
    if (availableKillPoints() < item.cost) return;
    const currentOwned = state.shopPurchases[item.id] ?? 0;
    state.shopPurchases[item.id] = currentOwned + 1;
    saveState();
    renderStats();
    updateShopState();
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

function renderUnlockCard(item, source, checkable = false) {
  const label = document.createElement(checkable ? "label" : "article");
  label.className = `unlocked-item ${checkable ? "checkable" : "auto"}`;
  const images = renderItemImages(item.images ?? [item.image]);
  const checked = checkable && state.basicUnlocks.includes(item.id);

  label.innerHTML = `
    ${checkable ? `<input type="checkbox" ${checked ? "checked" : ""} aria-label="Unlock ${item.name}" />` : ""}
    <div class="unlocked-art">${images}</div>
    <div class="unlocked-copy">
      <h3>${item.name}</h3>
      <span>${source}</span>
    </div>
  `;

  if (checkable) {
    label.querySelector("input").addEventListener("change", (event) => {
      setBasicUnlockChecked(item.id, event.target.checked);
      saveState();
    });
  }

  return label;
}

function renderUnlocks() {
  const target = document.getElementById("unlocksList");
  if (!target) return;

  target.innerHTML = "";

  const groups = [
    ...basicUnlockGroups,
    {
      category: "Talent Unlocks",
      source: "Talent",
      items: unlocks.filter((unlock) => state.purchased.includes(unlock.id)),
      automatic: true
    }
  ];

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "unlocked-group";
    section.innerHTML = `<h3 class="unlocked-group-title">${group.category}</h3><div class="unlocked-grid"></div>`;

    const grid = section.querySelector(".unlocked-grid");
    if (group.items.length) {
      group.items.forEach((item) => grid.appendChild(renderUnlockCard(item, group.source, !group.automatic)));
    } else {
      grid.innerHTML = `<p class="empty-unlocks">Bought talents will appear here.</p>`;
    }

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
  const pvmCompleted = pvmChallenges.filter((challenge) => state.completed.includes(challenge.id)).length;
  const pvpCompleted = pvpChallenges.filter((challenge) => state.completed.includes(challenge.id)).length;
  const complete = totalCompleted();
  const total = pvmChallenges.length + pvpChallenges.length;
  const percent = total ? (complete / total) * 100 : 0;

  document.getElementById("availablePoints").textContent = availablePoints();
  document.getElementById("earnedPoints").textContent = earnedUnlockPoints();
  document.getElementById("spentPoints").textContent = totalSpent();
  document.getElementById("killPoints").textContent = availableKillPoints();
  document.getElementById("killsEarned").textContent = state.playerKills;
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
});

document.getElementById("addKillButton").addEventListener("click", () => {
  state.playerKills += 1;
  saveState();
  renderStats();
  renderPvmChallenges();
  updateShopState();
});

document.getElementById("removeKillButton").addEventListener("click", () => {
  state.playerKills = Math.max(0, state.playerKills - 1);
  saveState();
  renderStats();
  renderPvmChallenges();
  updateShopState();
});

document.getElementById("resetButton").addEventListener("click", () => {
  setSettingsOpen(false);
  const shouldReset = window.confirm("Reset all completed challenges, unlocks, kills, and shop purchases?");
  if (!shouldReset) return;
  Object.assign(state, defaultState());
  saveState();
  render();
});

showTab("tasks");
render();
initFirebaseAuth();








