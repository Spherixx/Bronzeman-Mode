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

function task(title, points = 1) {
  return { title, points };
}

function repeatableTask(title, cost) {
  return { title, cost, repeatable: true };
}

const itemImages = {
  void: itemImage("Void knight top.png"),
  torso: itemImage("Fighter torso.png"),
  defenders: itemImage("Dragon defender.png"),
  fireCape: itemImage("Fire cape.png"),
  ma2Cape: itemImage("Imbued saradomin cape.png"),
  trouver: itemImage("Trouver parchment.png"),
  colossal: itemImage("Colossal blade.png"),
  barrelchest: itemImage("Barrelchest anchor.png"),
  gmaul: itemImage("Granite maul.png"),
  ornateMaul: itemImage("Ornate maul handle.png"),
  arkanBlade: itemImage("Arkan blade.png"),
  standardSpellbook: imageAsset("Standard_spellbook.png"),
  ancientMagicks: imageAsset("Ancient_spellbook.png"),
  lunarSpellbook: imageAsset("Lunar_spellbook.png"),
  arceuusSpellbook: imageAsset("Arceuus_spellbook.png"),
  dragonScimitar: itemImage("Dragon scimitar.png"),
  dragonSpear: itemImage("Dragon spear.png"),
  dds: itemImage("Dragon dagger(p++).png"),
  msb: itemImage("Magic shortbow (i).png"),
  rcb: itemImage("Rune crossbow.png"),
  sunlightHuntersCrossbow: itemImage("Hunters' sunlight crossbow.png"),
  burningClaws: itemImage("Burning claws.png"),
  crimsonKisten: itemImage("Crimson kisten.png"),
  dragonWarhammer: itemImage("Dragon warhammer.png"),
  dragonCrossbow: itemImage("Dragon crossbow.png"),
  obsidianCape: itemImage("Obsidian cape.png"),
  obsidianHelmet: itemImage("Obsidian helmet.png"),
  obsidianPlatebody: itemImage("Obsidian platebody.png"),
  obsidianPlatelegs: itemImage("Obsidian platelegs.png"),
  obsidianMaul: itemImage("Tzhaar-ket-om.png"),
  obsidianSword: itemImage("Toktz-xil-ek.png"),
  obsidianMace: itemImage("Tzhaar-ket-em.png"),
  obsidianThrowingRings: itemImage("Toktz-xil-ul.png"),
  obsidianStaff: itemImage("Toktz-mej-tal.png"),
  berserkerNecklace: itemImage("Berserker necklace.png"),
  tomeWater: itemImage("Tome of water.png"),
  tomeFire: itemImage("Tome of fire.png"),
  antlerGuard: itemImage("Antler guard.png"),
  archersRing: itemImage("Archers ring.png"),
  berserkerRing: itemImage("Berserker ring.png"),
  seersRing: itemImage("Seers ring.png"),
  warriorRing: itemImage("Warrior ring.png"),
  holyBook: itemImage("Holy book.png"),
  bookBalance: itemImage("Book of balance.png"),
  bookDarkness: itemImage("Book of darkness.png"),
  bookLaw: itemImage("Book of law.png"),
  bookWar: itemImage("Book of war.png"),
  unholyBook: itemImage("Unholy book.png"),
  darkBow: itemImage("Dark bow.png"),
  seekerArrow: itemImage("Seeking dragon arrow.png"),
  ancientMace: itemImage("Ancient mace.png"),
  dragonThrownaxe: itemImage("Dragon thrownaxe.png"),
  dragonKnife: itemImage("Dragon knife(p++).png"),
  amethystArrow: itemImage("Amethyst arrow 5.png"),
  dragonBolt: itemImage("Dragonstone dragon bolts (e) 5.png"),
  voidwaker: itemImage("Voidwaker.png"),
  accursed: itemImage("Accursed sceptre.png"),
  webweaver: itemImage("Webweaver bow.png"),
  chainmace: itemImage("Ursine chainmace.png"),
  toxicStaff: itemImage("Toxic staff of the dead.png"),
  zamorakGodsword: itemImage("Zamorak godsword.png"),
  surgePotion: itemImage("Surge potion(4).png"),
  lootKey: itemImage("Loot key.png"),
  talentToken: imageAsset("Blood_money_10000.png"),
  astral: itemImage("Astral rune.png"),
  air: itemImage("Air rune.png"),
  water: itemImage("Water rune.png"),
  earth: itemImage("Earth rune.png"),
  fire: itemImage("Fire rune.png"),
  mind: itemImage("Mind rune.png"),
  body: itemImage("Body rune.png"),
  soul: itemImage("Soul rune.png"),
  nature: itemImage("Nature rune.png"),
  burningAmulet: itemImage("Burning amulet.png"),
  ancientIceSack: itemImage("Blighted ancient ice sack.png"),
  vengeanceSack: itemImage("Blighted vengeance sack.png"),
  blood: itemImage("Blood rune.png"),
  death: itemImage("Death rune.png"),
  law: itemImage("Law rune.png"),
  chaos: itemImage("Chaos rune.png"),
  coins: imageAsset("Coins_10000.png"),
  stamina: itemImage("Stamina potion(4).png"),
  extendedStamina: itemImage("Extended stamina potion(4).png"),
  prayer: itemImage("Prayer potion(4).png"),
  brew: itemImage("Saradomin brew(4).png"),
  restore: itemImage("Super restore(4).png"),
  ranging: itemImage("Ranging potion(4).png"),
  superCombat: itemImage("Super combat potion(4).png"),
  antivenom: itemImage("Anti-venom+(4).png"),
  shark: itemImage("Shark.png"),
  angler: itemImage("Anglerfish.png"),
  karambwan: itemImage("Cooked karambwan.png"),
  halibut: itemImage("Halibut.png"),
  marlin: itemImage("Marlin.png"),
  pineapplePizza: itemImage("Pineapple pizza.png"),
  manta: itemImage("Manta ray.png"),
  blightedManta: itemImage("Blighted manta ray.png"),
  blightedRestore: itemImage("Blighted super restore(4).png"),
  blightedEntangle: itemImage("Blighted entangle sack.png"),
  blightedTeleport: itemImage("Blighted teleport spell sack.png"),
  seedPod: itemImage("Royal seed pod.png"),
  revenantEther: itemImage("Revenant ether 5.png"),
  bracelet: itemImage("Bracelet of ethereum.png"),
  blackDhideBody: itemImage("Black d'hide body.png"),
  blackDhideChaps: itemImage("Black d'hide chaps.png"),
  xericianHat: itemImage("Xerician hat.png"),
  xericianTop: itemImage("Xerician top.png"),
  xericianRobe: itemImage("Xerician robe.png"),
  helmNeitiznot: itemImage("Helm of neitiznot.png"),
  berserkerHelm: itemImage("Berserker helm.png"),
  archerHelm: itemImage("Archer helm.png"),
  farseerHelm: itemImage("Farseer helm.png"),
  climbingBoots: itemImage("Climbing boots.png"),
  amuletGlory: itemImage("Amulet of glory(4).png"),
  runeGloves: itemImage("Rune gloves.png"),
  barrowsGloves: itemImage("Barrows gloves.png"),
  saradominCape: itemImage("Saradomin cape.png"),
  guthixCape: itemImage("Guthix cape.png"),
  zamorakCape: itemImage("Zamorak cape.png"),
  saradominStaff: itemImage("Saradomin staff.png"),
  guthixStaff: itemImage("Guthix staff.png"),
  zamorakStaff: itemImage("Zamorak staff.png"),
  mysticRobeTopLight: itemImage("Mystic robe top (light).png"),
  mysticRobeTop: itemImage("Mystic robe top.png"),
  mysticRobeBottom: itemImage("Mystic robe bottom.png"),
  mysticHat: itemImage("Mystic hat.png"),
  mysticGloves: itemImage("Mystic gloves.png"),
  mysticBoots: itemImage("Mystic boots.png"),
  avasAccumulator: itemImage("Ava's accumulator.png"),
  avasAssembler: itemImage("Ava's assembler.png"),
  runePouch: itemImage("Rune pouch.png"),
  dragonMace: itemImage("Dragon mace.png"),
  dragonBattleaxe: itemImage("Dragon battleaxe.png"),
  abyssalWhip: itemImage("Abyssal whip.png"),
  zombieAxe: itemImage("Zombie axe.png"),
  dragonHalberd: itemImage("Dragon halberd.png"),
  lightBallista: itemImage("Light ballista.png"),
  heavyBallista: itemImage("Heavy ballista.png"),
  amuletFury: itemImage("Amulet of fury.png"),
  saradominSword: itemImage("Saradomin sword.png"),
  blessedSaradominSword: itemImage("Saradomin's blessed sword.png"),
  veracsHelm: itemImage("Verac's helm.png"),
  ahrimsHood: itemImage("Ahrim's hood.png"),
  karilsCoif: itemImage("Karil's coif.png"),
  dharoksHelm: itemImage("Dharok's helm.png"),
  abyssalDagger: itemImage("Abyssal dagger.png"),
  crystalHalberd: itemImage("Crystal halberd.png"),
  toxicBlowpipe: itemImage("Toxic blowpipe.png"),
  armadylCrossbow: itemImage("Armadyl crossbow.png"),
  occultNecklace: itemImage("Occult necklace.png"),
  serpentineHelm: itemImage("Serpentine helm.png"),
  piety: imageAsset("Piety.png"),
  augury: imageAsset("Augury.png"),
  rigour: imageAsset("Rigour.png"),
  amuletTorture: itemImage("Amulet of torture.png"),
  necklaceAnguish: itemImage("Necklace of anguish.png"),
  tormentedBracelet: itemImage("Tormented bracelet.png"),
  dinhsBulwark: itemImage("Dinh's bulwark.png"),
  dragonClaws: itemImage("Dragon claws.png"),
  volatileNightmareStaff: itemImage("Volatile nightmare staff.png"),
  armadylGodsword: itemImage("Armadyl godsword.png"),
  elderMaul: itemImage("Elder maul.png"),
  necklaceRupture: itemImage("Necklace of rupture.png"),
  ringOfSuffering: itemImage("Ring of suffering.png"),
  msbImbueScroll: itemImage("Magic shortbow scroll.png"),
  zulrahScales: imageAsset("Zulrah's_scales_5.png"),
  amethystDart: itemImage("Amethyst dart.png"),
  scrollOfImbuing: itemImage("Scroll of imbuing.png"),
  saradominsTear: itemImage("Saradomin's tear.png"),
  rechargeDragonstone: imageAsset("Recharge_Dragonstone.png")
};

const legacyChallenges = {
  pvm: [
    {
      stage: "Early",
      killRequirement: 25,
      items: [
        // Basic Wilderness setup
        task("Obtain a looting bag"),
        task("Get a god cape from Mage Arena"),
        task("Obtain and charge a bracelet of ethereum"),

        // Wilderness Slayer and general content
        task("Obtain a Larran's key from Wilderness Slayer"),
        task("Complete a Wilderness Slayer task in one trip"),
        task("Complete 25 Wilderness Slayer tasks", 2),
        task("Thieve from Rogue's Castle chest"),
        task("Complete 100 Wilderness laps in one trip", 2),

        // Early PvM drops
        task("Get a dragon longsword from Zombie Pirates"),
        task("Get a rune crossbow from Crazy Archaeologist"),

        // Early boss progression
        task("Defeat Crazy Archaeologist, Chaos Fanatic, and Scorpia", 2),
        task("Defeat Chaos Elemental", 2),
        task("Defeat a Wilderness boss while skulled", 2),

        // Repeatable tasks
        repeatableTask("25 KC at any minor Wilderness boss", 5),
        repeatableTask("25 KC at any singles-plus Wilderness boss", 5),
        repeatableTask("Complete 10 Wilderness Slayer tasks", 5),
        repeatableTask("Kill 50 Revenants while skulled", 5)
      ]
    },
    {
      stage: "Mid",
      killRequirement: 50,
      items: [
        // Account and gear progression
        task("Get Fire Cape with challenge gear", 2),
        task("Get Mage Arena 2 cape with challenge gear", 2),
        task("Complete Wilderness Hard Diaries", 2),

        // Wilderness Slayer and Larran's keys
        task("Complete 50 duo Wilderness Slayer tasks", 3),
        task("Open 25 Larran's big chests", 2),

        // Singles-plus boss progression
        task("Defeat Artio, Calvar'ion, and Spindel", 2),
        task("Obtain one Voidwaker piece", 3),

        // Multi-combat and risk challenges
        task("Defeat Callisto, Vet'ion, or Venenatis with challenge gear", 2),
        task("Complete 10 Wilderness boss kills while skulled", 2),
        task("Defeat Artio, Calvar'ion, and Spindel in one trip", 3),

        // Wilderness boss drops
        task("Get a dragon pickaxe drop", 2),
        task("Obtain a Wilderness boss ring as a drop", 2),
        task("Complete an odium ward or malediction ward", 3),

        // Revenant progression
        task("Get a ring of wealth scroll from Wilderness content"),
        task("Obtain any revenant unique drop"),
        task("Obtain an amulet of avarice from a revenant", 2),
        task("Obtain an ancient crystal from a revenant", 2),

        // Repeatable tasks
        repeatableTask("50 KC at any singles-plus Wilderness boss", 10),
        repeatableTask("25 KC at any multi-combat Wilderness boss", 10),
        repeatableTask("10 KC at three different Wilderness bosses", 10),
        repeatableTask("50 KC at Chaos Elemental", 10),
        repeatableTask("Complete 25 Wilderness Slayer tasks", 10),
        repeatableTask("Kill 100 Revenants while skulled", 10)
      ]
    },
    {
      stage: "Late",
      killRequirement: 100,
      items: [
        // Major account progression
        task("Complete Wilderness Elite Diaries", 3),
        task("Complete 250 Wilderness Slayer tasks", 5),

        // High-risk boss challenges
        task("Defeat every Wilderness boss while skulled", 4),
        task("Defeat Callisto, Vet'ion, and Venenatis in one trip", 3),
        task("Complete 25 Wilderness boss kills in one trip", 3),

        // Major boss completion goals
        task("Complete a Voidwaker", 4),
        task("Obtain all three Wilderness boss rings", 4),
        task("Complete both an odium ward and a malediction ward", 4),
        task("Obtain a Wilderness weapon upgrade attachment", 3),

        // Revenant completion goals
        task("Obtain a revenant weapon as a PvM drop", 4),
        task("Build a full revenant ether stack", 2),

        // Larran's key completion goals
        task("Open 100 Larran's big chests", 3),
        task("Get a full Dagon'hai set from Larran's keys", 5),

        // Long-term RNG and collection goals
        task("Greenlog a Wilderness boss", 4),
        task("Get a Wilderness pet", 5),

        // Repeatable tasks
        repeatableTask("50 KC at each singles-plus Wilderness boss", 15),
        repeatableTask("25 KC at each multi-combat Wilderness boss", 20),
        repeatableTask("Gain 100 KC across five different Wilderness bosses", 15),
        repeatableTask("100 KC at Chaos Elemental", 15),
        repeatableTask("Complete 50 Wilderness Slayer tasks", 15),
        repeatableTask("Kill 250 Revenants while skulled", 15)
      ]
    }
  ],
  pvp: [
    // First milestones and Wilderness locations
    task("Get your first Wilderness kill"),
    task("Get your first smite"),
    task("Successfully rush a player"),
    task("Kill a player you teleblocked"),
    task("Kill a player at Chaos Altar"),
    task("Kill a player in Revenant Caves"),
    task("Get a kill above level 50 Wilderness"),

    // Budget and combat-style challenges
    task("Win a fight with a budget Xerician set"),
    task("Get a kill while risking under 500k"),
    task("Get a kill using ranged only"),
    task("Get a kill using magic only"),
    task("Get a kill using melee only"),
    task("Get a kill using all three combat styles", 2),
    task("Get a kill with a Dark bow special attack"),
    task("Get a KO with any obsidian weapon"),
    task("Get a kill with a poisoned dragon knife special attack", 2),
    task("Get a KO with Barrelchest's anchor", 2),
    task("Get a kill with a Dragon thrownaxe special attack", 2),
    task("Get a KO with Vengeance", 2),
    task("Get a kill using only special attacks", 2),
    task("Get an Ancient Mace smite kill", 3),

    // Smite milestones
    task("Smite a +1 worth 5m+", 2),
    task("Smite a +1 worth 10m+", 3),
    task("Smite a +1 worth 25m+", 4),
    task("Smite a +1 worth 50m+", 5),

    // Individual loot-value milestones
    task("Get a single loot key worth 10m+", 2),
    task("Get a single loot key worth 20m+", 3),
    task("Get a single loot key worth 50m+", 4),
    task("Get a single loot key worth 100m+", 5),
    task("PK a Wilderness weapon", 3),
    task("Earn 2.5m+ PKing one bot farm", 2),

    // Loot-key accumulation
    task("Carry 5 loot keys at once", 2),
    task("Carry 10 loot keys at once", 4),
    task("Obtain 50 loot keys total", 2),
    task("Obtain 100 loot keys total", 3),
    task("Obtain 250 loot keys total", 4),
    task("Obtain 500 loot keys total", 5),

    // Anti-PK challenges
    task("Anti-PK a 5m+ kill", 2),
    task("Anti-PK a 10m+ kill", 3),
    task("Anti-PK a 25m+ kill", 4),
    task("Anti-rush a rusher", 2),

    // Outnumbered and survival challenges
    task("Win a 1v2 or worse fight", 3),
    task("Win a 1v3 or worse fight", 5),
    task("Escape a multi team while carrying a loot key", 3),
    task("Escape after a full Tele Block while carrying a loot key", 3),
    task("Get another kill while carrying a 10m+ loot key", 3),
    task("Get a 10-kill streak without dying", 4),

    // High-risk fights
    task("Get a kill while risking over 10m", 3),
    task("Get a kill while risking over 25m", 4),
    task("Win a no-overhead honor fight", 2),

    // Trick and community challenges
    task("Skulltrick someone", 2),
    task("2v1 a viewer"),
    task("BS a clanmate")
  ]
};



const legacyUnlocks = [
  { id: "god-capes", name: "God Capes", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], collectionIds: ["saradomin-cape", "guthix-cape", "zamorak-cape"], images: [itemImages.zamorakCape] },
  { id: "god-staves", name: "God Staves", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], collectionIds: ["saradomin-staff", "guthix-staff", "zamorak-staff"], images: [itemImages.zamorakStaff] },
  { id: "glory", name: "Amulet of Glory", cost: 1, tier: 1, collectionCategory: "Range Gear", requires: [], images: [itemImages.amuletGlory] },
  { id: "rcb", name: "Rune Crossbow", cost: 1, tier: 1, collectionCategory: "Range Weapons", requires: [], images: [itemImages.rcb] },
  { id: "tome-water", name: "Tome of Water", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], images: [itemImages.tomeWater] },
  { id: "god-books", name: "God Books", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], collectionIds: ["holy-book", "unholy-book", "book-of-balance", "book-of-war", "book-of-law", "book-of-darkness"], images: [itemImages.unholyBook] },
  { id: "dds", name: "DDS", cost: 1, tier: 1, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dds] },
  { id: "rune-gloves", name: "Rune Gloves", cost: 1, tier: 1, collectionCategory: "Melee Gear", requires: [], images: [itemImages.runeGloves] },
  { id: "extended-stamina-potions", name: "Extended Stam Pots", cost: 1, tier: 1, collectionCategory: "Potions", requires: [], images: [itemImages.extendedStamina] },
  { id: "dragon-scimitar", name: "Dragon Scimitar", cost: 1, tier: 1, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["dragon-scimitar"], images: [itemImages.dragonScimitar] },
  { id: "avas-accumulator", name: "Ava's Accumulator", cost: 1, tier: 1, collectionCategory: "Range Gear", requires: [], collectionIds: ["avas-accumulator"], images: [itemImages.avasAccumulator] },
  { id: "rune-pouch", name: "Rune Pouch", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], collectionIds: ["rune-pouch"], images: [itemImages.runePouch] },
  { id: "dragon-mace", name: "Dragon Mace", cost: 1, tier: 1, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["dragon-mace"], images: [itemImages.dragonMace] },
  { id: "dragon-battleaxe", name: "Dragon Battleaxe", cost: 1, tier: 1, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["dragon-battleaxe"], images: [itemImages.dragonBattleaxe] },
  { id: "mystic-set", name: "Mystic Set", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], collectionIds: ["mystic-hat", "mystic-robe-top", "mystic-robe-bottom", "mystic-gloves", "mystic-boots"], images: [itemImages.mysticHat] },

  { id: "void", name: "Void", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.void] },
  { id: "torso", name: "Fighter Torso", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.torso] },
  { id: "defenders", name: "Defenders", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.defenders] },
  { id: "msb", name: "MSB(i)", cost: 2, tier: 2, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.msb] },
  { id: "tome-fire", name: "Tome of Fire", cost: 2, tier: 2, collectionCategory: "Mage Gear", requires: [], images: [itemImages.tomeFire] },
  { id: "ancient-magicks", name: "Ancient Magicks", cost: 2, tier: 2, collectionCategory: "Spellbooks", requires: [], images: [itemImages.ancientMagicks], tags: ["spellbook"] },
  { id: "lunar-spellbook", name: "Lunar Spellbook", cost: 2, tier: 2, collectionCategory: "Spellbooks", requires: [], images: [itemImages.lunarSpellbook], tags: ["spellbook"] },
  { id: "arceuus-spellbook", name: "Arceuus Spellbook", cost: 2, tier: 2, collectionCategory: "Spellbooks", requires: [], images: [itemImages.arceuusSpellbook], tags: ["spellbook"] },
  { id: "crimson-kisten", name: "Crimson Kisten", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.crimsonKisten] },
  { id: "dragon-crossbow", name: "Dragon Crossbow", cost: 2, tier: 2, collectionCategory: "Range Weapons", requires: [], images: [itemImages.dragonCrossbow] },
  { id: "obsidian-berserker", name: "Obsidian Weaponry + Berserker Neck", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.obsidianMaul, itemImages.berserkerNecklace] },
  { id: "antler-guard", name: "Antler Guard", cost: 2, tier: 2, collectionCategory: "Range Gear", requires: [], images: [itemImages.antlerGuard] },
  { id: "dagannoth-rings", name: "Dagannoth Rings", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.berserkerRing] },
  { id: "sunlight-hunters-crossbow", name: "Hunters' Sunlight Crossbow", cost: 2, tier: 2, collectionCategory: "Range Weapons", requires: [], collectionIds: ["hunters-sunlight-crossbow"], images: [itemImages.sunlightHuntersCrossbow] },
  { id: "abyssal-whip", name: "Abyssal Whip", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], collectionIds: ["abyssal-whip"], images: [itemImages.abyssalWhip] },
  { id: "zombie-axe", name: "Zombie Axe", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], collectionIds: ["zombie-axe"], images: [itemImages.zombieAxe] },
  { id: "dragon-halberd", name: "Dragon Halberd", cost: 2, tier: 2, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["dragon-halberd"], images: [itemImages.dragonHalberd] },
  { id: "light-ballista", name: "Light Ballista", cost: 2, tier: 2, collectionCategory: "Range Weapons", requires: [], collectionIds: ["light-ballista"], images: [itemImages.lightBallista] },
  { id: "amulet-of-fury", name: "Amulet of Fury", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], collectionIds: ["amulet-of-fury"], images: [itemImages.amuletFury] },
  { id: "saradomin-sword", name: "Saradomin Sword", cost: 2, tier: 2, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["saradomin-sword"], images: [itemImages.saradominSword] },
  { id: "veracs-set", name: "Verac's Set", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], collectionIds: ["veracs-helm", "veracs-brassard", "veracs-plateskirt", "veracs-flail"], images: [itemImages.veracsHelm] },

  { id: "arkan-blade", name: "Arkan Blade", cost: 3, tier: 3, collectionCategory: "Melee Gear", requires: [], images: [itemImages.arkanBlade] },
  { id: "dragon-warhammer", name: "Dragon Warhammer", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonWarhammer] },
  { id: "seed-pod", name: "Seed Pod", cost: 3, tier: 3, collectionCategory: "Teleports", requires: [], images: [itemImages.seedPod] },
  { id: "firecape", name: "Fire Cape", cost: 3, tier: 3, collectionCategory: "Melee Gear", requires: [], images: [itemImages.fireCape] },
  { id: "ma2-cape", name: "MA2 Cape", cost: 3, tier: 3, collectionCategory: "Mage Gear", requires: [], collectionIds: ["imbued-saradomin-cape", "imbued-guthix-cape", "imbued-zamorak-cape"], images: [itemImages.ma2Cape] },
  { id: "dragon-spear", name: "Dragon Spear", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonSpear] },
  { id: "dragon-knives", name: "Dragon Knives", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonKnife] },
  { id: "ancient-mace", name: "Ancient Mace", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.ancientMace] },
  { id: "abyssal-dagger", name: "Abyssal Dagger", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["abyssal-dagger"], images: [itemImages.abyssalDagger] },
  { id: "crystal-halberd", name: "Crystal Halberd", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["crystal-halberd"], images: [itemImages.crystalHalberd] },
  { id: "blessed-saradomin-sword", name: "Blessed Saradomin Sword", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["saradomins-blessed-sword"], images: [itemImages.blessedSaradominSword] },
  { id: "ahrims-set", name: "Ahrim's Set", cost: 3, tier: 3, collectionCategory: "Mage Gear", requires: [], collectionIds: ["ahrims-hood", "ahrims-robetop", "ahrims-robeskirt", "ahrims-staff"], images: [itemImages.ahrimsHood] },
  { id: "karils-set", name: "Karil's Set", cost: 3, tier: 3, collectionCategory: "Range Gear", requires: [], collectionIds: ["karils-coif", "karils-leathertop", "karils-leatherskirt", "karils-crossbow"], images: [itemImages.karilsCoif] },
  { id: "toxic-blowpipe", name: "Toxic Blowpipe", cost: 3, tier: 3, collectionCategory: "Range Weapons", requires: [], collectionIds: ["toxic-blowpipe"], images: [itemImages.toxicBlowpipe] },
  { id: "armadyl-crossbow", name: "Armadyl Crossbow", cost: 3, tier: 3, collectionCategory: "Range Weapons", requires: [], collectionIds: ["armadyl-crossbow"], images: [itemImages.armadylCrossbow] },
  { id: "occult-necklace", name: "Occult Necklace", cost: 3, tier: 3, collectionCategory: "Mage Gear", requires: [], collectionIds: ["occult-necklace"], images: [itemImages.occultNecklace] },
  { id: "avas-assembler", name: "Ava's Assembler", cost: 3, tier: 3, collectionCategory: "Range Gear", requires: [], collectionIds: ["avas-assembler"], images: [itemImages.avasAssembler] },

  { id: "surge-potions", name: "Surge Potions", cost: 4, tier: 4, collectionCategory: "Potions", requires: [], images: [itemImages.surgePotion] },
  { id: "gmaul", name: "Granite Maul + Ornate Handle", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.gmaul, itemImages.ornateMaul] },
  { id: "anchor", name: "Barrelchest Anchor", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.barrelchest] },
  { id: "dark-bow", name: "Dark Bow + Seeker", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.darkBow, itemImages.seekerArrow] },
  { id: "dragon-thrownaxe", name: "Dragon Thrownaxe", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonThrownaxe] },
  { id: "toxic-staff", name: "Toxic Staff", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.toxicStaff] },
  { id: "barrows-gloves", name: "Barrows Gloves", cost: 4, tier: 4, collectionCategory: "Melee Gear", requires: [], images: [itemImages.barrowsGloves] },
  { id: "burning-claws", name: "Burning Claws", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.burningClaws] },
  { id: "colossal-blade", name: "Colossal Blade", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["colossal-blade"], images: [itemImages.colossal] },
  { id: "heavy-ballista", name: "Heavy Ballista", cost: 4, tier: 4, collectionCategory: "Range Weapons", requires: [], collectionIds: ["heavy-ballista"], images: [itemImages.heavyBallista] },
  { id: "dharoks-set", name: "Dharok's Set", cost: 4, tier: 4, collectionCategory: "Melee Gear", requires: [], collectionIds: ["dharoks-helm", "dharoks-platebody", "dharoks-platelegs", "dharoks-greataxe"], images: [itemImages.dharoksHelm] },
  { id: "serpentine-helm", name: "Serpentine Helm", cost: 4, tier: 4, collectionCategory: "Melee Gear", requires: [], collectionIds: ["serpentine-helm"], images: [itemImages.serpentineHelm] },
  { id: "piety", name: "Piety", cost: 4, tier: 4, collectionCategory: "Prayers", requires: [], collectionIds: ["piety"], images: [itemImages.piety] },
  { id: "augury", name: "Augury", cost: 4, tier: 4, collectionCategory: "Prayers", requires: [], collectionIds: ["augury"], images: [itemImages.augury] },
  { id: "amulet-of-torture", name: "Amulet of Torture", cost: 4, tier: 4, collectionCategory: "Melee Gear", requires: [], collectionIds: ["amulet-of-torture"], images: [itemImages.amuletTorture] },
  { id: "necklace-of-anguish", name: "Necklace of Anguish", cost: 4, tier: 4, collectionCategory: "Range Gear", requires: [], collectionIds: ["necklace-of-anguish"], images: [itemImages.necklaceAnguish] },
  { id: "tormented-bracelet", name: "Tormented Bracelet", cost: 4, tier: 4, collectionCategory: "Mage Gear", requires: [], collectionIds: ["tormented-bracelet"], images: [itemImages.tormentedBracelet] },
  { id: "dinhs-bulwark", name: "Dinh's Bulwark", cost: 4, tier: 4, collectionCategory: "Melee Gear", requires: [], collectionIds: ["dinhs-bulwark"], images: [itemImages.dinhsBulwark] },

  { id: "zgs", name: "ZGS Freeze", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.zamorakGodsword] },
  { id: "accursed", name: "Accursed Sceptre", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.accursed] },
  { id: "webweaver", name: "Webweaver Bow", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.webweaver] },
  { id: "chainmace", name: "Ursine Chainmace", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.chainmace] },
  { id: "voidwaker", name: "Voidwaker", cost: 6, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.voidwaker] },
  { id: "dragon-claws", name: "Dragon Claws", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["dragon-claws"], images: [itemImages.dragonClaws] },
  { id: "volatile-nightmare-staff", name: "Volatile Nightmare Staff", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["volatile-nightmare-staff"], images: [itemImages.volatileNightmareStaff] },
  { id: "rigour", name: "Rigour", cost: 5, tier: 5, collectionCategory: "Prayers", requires: [], collectionIds: ["rigour"], images: [itemImages.rigour] },
  { id: "armadyl-godsword", name: "Armadyl Godsword", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], collectionIds: ["armadyl-godsword"], images: [itemImages.armadylGodsword] },
  { id: "elder-maul", name: "Elder Maul", cost: 5, tier: 5, collectionCategory: "Melee Gear", requires: [], collectionIds: ["elder-maul"], images: [itemImages.elderMaul] },
  { id: "necklace-of-rupture", name: "Necklace of Rupture", cost: 5, tier: 5, collectionCategory: "Melee Gear", requires: [], collectionIds: ["necklace-of-rupture"], images: [itemImages.necklaceRupture] },
  { id: "ring-of-suffering", name: "Ring of Suffering", cost: 5, tier: 5, collectionCategory: "Melee Gear", requires: [], collectionIds: ["ring-of-suffering"], images: [itemImages.ringOfSuffering] }
];

const unlockIdAliases = {
  "ornate-maul": "gmaul",
  "colossal-barrelchest": "colossal-blade"
};

let shopCategories = [];
let shopItems = [];
const shopIdAliases = {
  "tb-runes": "tb-sacks",
  "veng-runes": "veng-sacks"
};
let challenges = legacyChallenges;
let unlocks = legacyUnlocks;

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
const hiddenCollectionItemIds = new Set(["warrior-guild-token"]);
const legacyCollectionSetDefinitions = [
  { id: "set-god-capes", name: "God Capes", itemIds: ["saradomin-cape", "guthix-cape", "zamorak-cape"] },
  { id: "set-imbued-god-capes", name: "Imbued God Capes", itemIds: ["imbued-saradomin-cape", "imbued-guthix-cape", "imbued-zamorak-cape"] },
  { id: "set-god-books", name: "God Books", itemIds: ["holy-book", "unholy-book", "book-of-balance", "book-of-war", "book-of-law", "book-of-darkness"] },
  { id: "set-mystic", name: "Mystic Set", itemIds: ["mystic-hat", "mystic-robe-top", "mystic-robe-bottom", "mystic-gloves", "mystic-boots"] },
  { id: "set-veracs", name: "Verac's Set", itemIds: ["veracs-helm", "veracs-brassard", "veracs-plateskirt", "veracs-flail"] },
  { id: "set-ahrims", name: "Ahrim's Set", itemIds: ["ahrims-hood", "ahrims-robetop", "ahrims-robeskirt", "ahrims-staff"] },
  { id: "set-karils", name: "Karil's Set", itemIds: ["karils-coif", "karils-leathertop", "karils-leatherskirt", "karils-crossbow"] },
  { id: "set-dharoks", name: "Dharok's Set", itemIds: ["dharoks-helm", "dharoks-platebody", "dharoks-platelegs", "dharoks-greataxe"] },
  { id: "set-obsidian-weapons", name: "Obsidian Weapons", itemIds: ["toktz-xil-ek", "toktz-xil-ak", "tzhaar-ket-em", "tzhaar-ket-om", "toktz-xil-ul", "toktz-mej-tal"] }
];
collectionSetDefinitions = legacyCollectionSetDefinitions;

const dataWarnings = [];
let challengeIdAliases = {};
let repeatableIdAliases = {};
let itemRowsByUid = new Map();
let itemRowsByItemId = new Map();
let itemRowsByName = new Map();

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
  return { completed: [], purchased: [], shopPurchases: {}, repeatablePurchases: {}, basicUnlocks: [], playerKills: 0 };
}

function sanitizeState(rawState) {
  const validUnlocks = new Set(unlocks.map((unlock) => unlock.id));
  const validShopItems = new Set(shopItems.map((item) => item.id));
  const validChallenges = new Set([...flattenPvmChallenges(), ...flattenPvpChallenges()].map((challenge) => challenge.id));
  const repeatables = flattenRepeatables();
  const validRepeatables = new Set(repeatables.map((repeatable) => repeatable.id));
  const shopPurchases = {};
  const repeatablePurchases = {};

  Object.entries(rawState?.shopPurchases ?? {}).forEach(([id, count]) => {
    const nextId = shopIdAliases[id] ?? id;
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


  return {
    completed: Array.isArray(rawState?.completed)
      ? [...new Set(rawState.completed.map((id) => challengeIdAliases[id] ?? id))].filter((id) => validChallenges.has(id))
      : [],
    purchased: Array.isArray(rawState?.purchased)
      ? [...new Set(rawState.purchased.map((id) => unlockIdAliases[id] ?? id))].filter((id) => validUnlocks.has(id))
      : [],
    shopPurchases,
    repeatablePurchases,
    basicUnlocks,
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
    repeatablePurchases: mergeCountMaps(local.repeatablePurchases, remote.repeatablePurchases),
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
    return `${titleCase(normalized).replace(/ /g, "_")}.png`;
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

  return sets.length ? sets : legacyCollectionSetDefinitions;
}

function normalizeTalentUnlock(entry, sourceType) {
  const cost = toNumber(entry.cost, NaN);
  const tier = toNumber(entry.tier, NaN);
  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(tier) || tier <= 0) return null;

  const tags = uniqueTags([...(entry.tags ?? []), "talent"]);
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
    .filter((item) => toArray(item.tags).includes("talent") || item.cost !== null || item.tier !== null)
    .map((item) => normalizeTalentUnlock(item, "item"));
  const setUnlocks = toArray(itemSetsData?.itemSets)
    .filter((itemSet) => toArray(itemSet.tags).includes("talent") || itemSet.cost !== null || itemSet.tier !== null)
    .map((itemSet) => normalizeTalentUnlock(itemSet, "set"));
  const nonItemUnlocks = toArray(unlocksData?.unlocks).map((unlock) => normalizeTalentUnlock(unlock, "unlock"));

  return [...itemUnlocks, ...setUnlocks, ...nonItemUnlocks].filter(Boolean);
}

function mergeUnlocks(dataUnlocks) {
  const byId = new Map(dataUnlocks.map((unlock) => [unlock.id, unlock]));
  const byName = new Map(dataUnlocks.map((unlock) => [normalizeDataText(unlock.name), unlock]));
  const used = new Set();

  const merged = legacyUnlocks.map((legacyUnlock) => {
    const replacement = byId.get(legacyUnlock.id) || byName.get(normalizeDataText(legacyUnlock.name));
    if (!replacement) return legacyUnlock;
    used.add(replacement.id);
    return { ...legacyUnlock, ...replacement, id: legacyUnlock.id };
  });

  dataUnlocks.forEach((unlock) => {
    if (!used.has(unlock.id) && !merged.some((item) => normalizeDataText(item.name) === normalizeDataText(unlock.name))) {
      merged.push(unlock);
    }
  });

  return merged;
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
    dataWarnings.push("Could not load one or more Bronzeman JSON files; using built-in task/talent fallback and an empty shop.");
    challenges = legacyChallenges;
    unlocks = legacyUnlocks;
    shopItems = [];
    collectionSetDefinitions = legacyCollectionSetDefinitions;
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
  const mergedItemIds = new Set(collectionSetDefinitions.flatMap((definition) => definition.itemIds));
  const mergedItems = collectionSetDefinitions.map((definition) => mergedCollectionSet(definition, itemsById)).filter(Boolean);

  return [
    ...items.filter((item) => !hiddenCollectionItemIds.has(item.id) && !mergedItemIds.has(item.id)),
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
  renderRepeatables();
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
  const shouldReset = window.confirm("Reset completed challenges, talents, collection checks, PK points, repeatables, and shop purchases?");
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








