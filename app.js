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

function localImage(folder, fileName) {
  return `${folder}/${encodeURIComponent(fileName)}`;
}

function itemImage(fileName) {
  return localImage("images/items", fileName);
}

function imageAsset(fileName) {
  return localImage("images", fileName);
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
  arkanBlade: "",
  standardSpellbook: imageAsset("Standard_spellbook.png"),
  ancientMagicks: imageAsset("Ancient_spellbook.png"),
  lunarSpellbook: imageAsset("Lunar_spellbook.png"),
  arceuusSpellbook: imageAsset("Arceuus_spellbook.png"),
  dragonScimitar: itemImage("Dragon scimitar.png"),
  dragonSpear: itemImage("Dragon spear.png"),
  dds: itemImage("Dragon dagger(p++).png"),
  msb: itemImage("Magic shortbow (i).png"),
  rcb: itemImage("Rune crossbow.png"),
  sunlightHuntersCrossbow: itemImage("Sunlight hunter's crossbow.png"),
  burningClaws: itemImage("Burning claws.png"),
  crimsonKisten: "",
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
  darkBow: itemImage("Dark bow.png"),
  seekerArrow: itemImage("Seeker arrow.png"),
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
  lootKey: imageAsset("Loot key.png"),
  talentToken: imageAsset("Warrior guild token.png"),
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
  coins: imageAsset("Coins 10000.png"),
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
  mysticRobeBottom: itemImage("Mystic robe bottom.png")
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
        repeatableTask("Get 25 KC at Chaos Fanatic", 5),
        repeatableTask("Get 25 KC at Scorpia", 5),
        repeatableTask("100 KC each baby Wilderness boss", 10)
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
        task("Get a Wilderness ring", 2),
        task("PvM a Wilderness weapon", 2),
        repeatableTask("Get 100 KC Chaos Elemental", 10),
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
        repeatableTask("100 KC each Wilderness boss", 10),
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
    task("Win a no-overhead honor fight", 2),
    task("2v1 a viewer", 2),
    task("BS a clanmate"),
    task("Get a KO with obby weapon"),
    task("Get a kill with range only"),
    task("Get a kill with only specs", 2)
  ]
};



const unlocks = [
  { id: "god-capes", name: "God Capes", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], images: [itemImages.saradominCape, itemImages.guthixCape, itemImages.zamorakCape] },
  { id: "god-staves", name: "God Staves", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], images: [itemImages.saradominStaff, itemImages.guthixStaff, itemImages.zamorakStaff] },
  { id: "glory", name: "Amulet of Glory", cost: 1, tier: 1, collectionCategory: "Range Gear", requires: [], images: [itemImages.amuletGlory] },
  { id: "rcb", name: "Rune Crossbow", cost: 1, tier: 1, collectionCategory: "Range Weapons", requires: [], images: [itemImages.rcb] },
  { id: "sunlight-hunters-crossbow", name: "Sunlight Hunter's Crossbow", cost: 1, tier: 1, collectionCategory: "Range Weapons", requires: [], images: [itemImages.sunlightHuntersCrossbow] },
  { id: "tome-water", name: "Tome of Water", cost: 1, tier: 1, collectionCategory: "Mage Gear", requires: [], images: [itemImages.tomeWater] },
  { id: "dds", name: "DDS", cost: 1, tier: 1, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dds] },
  { id: "rune-gloves", name: "Rune Gloves", cost: 1, tier: 1, collectionCategory: "Melee Gear", requires: [], images: [itemImages.runeGloves] },
  { id: "extended-stamina-potions", name: "Extended Stam Pots", cost: 1, tier: 1, collectionCategory: "Potions", requires: [], images: [itemImages.extendedStamina] },

  { id: "void", name: "Void", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.void] },
  { id: "torso", name: "Fighter Torso", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.torso] },
  { id: "defenders", name: "Defenders", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.defenders] },
  { id: "msb", name: "MSB(i)", cost: 2, tier: 2, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.msb] },
  { id: "tome-fire", name: "Tome of Fire", cost: 2, tier: 2, collectionCategory: "Mage Gear", requires: [], images: [itemImages.tomeFire] },
  { id: "ancient-magicks", name: "Ancient Magicks", cost: 2, tier: 2, collectionCategory: "Spellbooks", requires: [], images: [itemImages.ancientMagicks], tags: ["spellbook"] },
  { id: "lunar-spellbook", name: "Lunar Spellbook", cost: 2, tier: 2, collectionCategory: "Spellbooks", requires: [], images: [itemImages.lunarSpellbook], tags: ["spellbook"] },
  { id: "arceuus-spellbook", name: "Arceuus Spellbook", cost: 2, tier: 2, collectionCategory: "Spellbooks", requires: [], images: [itemImages.arceuusSpellbook], tags: ["spellbook"] },
  { id: "arkan-blade", name: "Arkan Blade", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.arkanBlade] },
  { id: "crimson-kisten", name: "Crimson Kisten", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.crimsonKisten] },
  { id: "dragon-warhammer", name: "Dragon Warhammer", cost: 2, tier: 2, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonWarhammer] },
  { id: "dragon-crossbow", name: "Dragon Crossbow", cost: 2, tier: 2, collectionCategory: "Range Weapons", requires: [], images: [itemImages.dragonCrossbow] },
  { id: "obsidian-berserker", name: "Obsidian Weaponry + Berserker Neck", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.obsidianMaul, itemImages.obsidianSword, itemImages.obsidianMace, itemImages.obsidianThrowingRings, itemImages.obsidianStaff, itemImages.berserkerNecklace] },
  { id: "antler-guard", name: "Antler Guard", cost: 2, tier: 2, collectionCategory: "Range Gear", requires: [], images: [itemImages.antlerGuard] },
  { id: "dagannoth-rings", name: "Dagannoth Rings", cost: 2, tier: 2, collectionCategory: "Melee Gear", requires: [], images: [itemImages.archersRing, itemImages.berserkerRing, itemImages.seersRing, itemImages.warriorRing] },

  { id: "seed-pod", name: "Seed Pod", cost: 3, tier: 3, collectionCategory: "Teleports", requires: [], images: [itemImages.seedPod] },
  { id: "firecape", name: "Fire Cape", cost: 3, tier: 3, collectionCategory: "Melee Gear", requires: [], images: [itemImages.fireCape] },
  { id: "ma2-cape", name: "MA2 Cape", cost: 3, tier: 3, collectionCategory: "Mage Gear", requires: [], images: [itemImages.ma2Cape] },
  { id: "surge-potions", name: "Surge Potions", cost: 3, tier: 3, collectionCategory: "Potions", requires: [], images: [itemImages.surgePotion] },
  { id: "dragon-spear", name: "Dragon Spear", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonSpear] },
  { id: "dragon-knives", name: "Dragon Knives", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonKnife] },
  { id: "ancient-mace", name: "Ancient Mace", cost: 3, tier: 3, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.ancientMace] },

  { id: "gmaul", name: "Granite Maul + Ornate Handle", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.gmaul, itemImages.ornateMaul] },
  { id: "anchor", name: "Barrelchest Anchor", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.barrelchest] },
  { id: "dark-bow", name: "Dark Bow + Seeker", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.darkBow, itemImages.seekerArrow] },
  { id: "dragon-thrownaxe", name: "Dragon Thrownaxe", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.dragonThrownaxe] },
  { id: "toxic-staff", name: "Toxic Staff", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.toxicStaff] },
  { id: "barrows-gloves", name: "Barrows Gloves", cost: 4, tier: 4, collectionCategory: "Melee Gear", requires: [], images: [itemImages.barrowsGloves] },
  { id: "burning-claws", name: "Burning Claws", cost: 4, tier: 4, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.burningClaws] },

  { id: "colossal-barrelchest", name: "Colossal / Anchor", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.colossal, itemImages.barrelchest] },
  { id: "zgs", name: "ZGS Freeze", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.zamorakGodsword] },
  { id: "accursed", name: "Accursed Sceptre", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.accursed] },
  { id: "webweaver", name: "Webweaver Bow", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.webweaver] },
  { id: "chainmace", name: "Ursine Chainmace", cost: 5, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.chainmace] },
  { id: "voidwaker", name: "Voidwaker", cost: 6, tier: 5, collectionCategory: "Spec Weapons", requires: [], images: [itemImages.voidwaker] }
];







const unlockIdAliases = {
  "ornate-maul": "gmaul"
};

const shopCategories = ["Runes / Ammo", "Food", "Potions", "Other"];

const shopItems = [
  { id: "barrages", category: "Runes / Ammo", name: "Barrage sacks", cost: 1, items: [{ image: itemImages.ancientIceSack, amount: "100" }] },
  { id: "tb-sacks", category: "Runes / Ammo", name: "TB + entangle sacks", cost: 1, items: [{ image: itemImages.blightedTeleport, amount: "10" }, { image: itemImages.blightedEntangle, amount: "10" }] },
  { id: "veng-sacks", category: "Runes / Ammo", name: "Veng sacks", cost: 1, items: [{ image: itemImages.vengeanceSack, amount: "25" }] },
  { id: "amethyst-arrows", category: "Runes / Ammo", name: "Amethyst arrows", cost: 1, items: [{ image: itemImages.amethystArrow, amount: "250" }] },
  { id: "dragon-bolts", category: "Runes / Ammo", name: "Dragonstone bolts", cost: 1, items: [{ image: itemImages.dragonBolt, amount: "100" }] },
  { id: "dragon-knives", category: "Runes / Ammo", name: "Dragon knives", cost: 1, items: [{ image: itemImages.dragonKnife, amount: "50" }] },
  { id: "dragon-thrownaxes", category: "Runes / Ammo", name: "Dragon thrownaxes", cost: 1, items: [{ image: itemImages.dragonThrownaxe, amount: "50" }] },
  { id: "combo-food", category: "Food", name: "Halibut", cost: 2, items: [{ image: itemImages.halibut, amount: "50" }] },
  { id: "standard-food", category: "Food", name: "Anglers / marlin", cost: 1, items: [{ image: itemImages.angler, amount: "100" }, { image: itemImages.marlin, amount: "100" }] },
  { id: "surge-potions", category: "Potions", name: "Surge pots", cost: 2, items: [{ image: itemImages.surgePotion, amount: "5" }] },
  { id: "brews", category: "Potions", name: "Brews", cost: 1, items: [{ image: itemImages.brew, amount: "20" }] },
  { id: "restores", category: "Potions", name: "Restores", cost: 1, items: [{ image: itemImages.restore, amount: "10" }] },
  { id: "range-pots", category: "Potions", name: "Range pots", cost: 1, items: [{ image: itemImages.ranging, amount: "5" }] },
  { id: "super-combats", category: "Potions", name: "Super combats", cost: 1, items: [{ image: itemImages.superCombat, amount: "5" }] },
  { id: "antivenom", category: "Potions", name: "Antivenom", cost: 1, items: [{ image: itemImages.antivenom, amount: "2" }] },
  { id: "trouver", category: "Other", name: "Trouver Parchment", cost: 2, items: [{ image: itemImages.trouver }] },
  { id: "god-books", category: "Other", name: "God books", cost: 1, items: [{ image: itemImages.holyBook }, { image: itemImages.bookBalance }, { image: itemImages.bookDarkness }, { image: itemImages.bookLaw }, { image: itemImages.bookWar }] },
  { id: "rev-kit", category: "Other", name: "Rev kit", cost: 2, items: [{ image: itemImages.bracelet }, { image: itemImages.revenantEther, amount: "100" }, { image: itemImages.burningAmulet }] }
];
const shopIdAliases = {
  "tb-runes": "tb-sacks",
  "veng-runes": "veng-sacks"
};
const basicUnlockGroups = [
  {
    category: "Runes",
    source: "Loot unlock",
    sourceType: "loot",
    items: [
      { id: "rune-air", name: "Air Rune", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.air], tags: ["rune", "consumable", "always"] },
      { id: "rune-water", name: "Water Rune", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.water], tags: ["rune", "consumable", "always"] },
      { id: "rune-earth", name: "Earth Rune", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.earth], tags: ["rune", "consumable", "always"] },
      { id: "rune-fire", name: "Fire Rune", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.fire], tags: ["rune", "consumable", "always"] },
      { id: "rune-body", name: "Body Rune", images: [itemImages.body], tags: ["rune", "consumable", "loot"] },
      { id: "rune-mind", name: "Mind Rune", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.mind], tags: ["rune", "consumable", "always"] },
      { id: "rune-chaos", name: "Chaos Rune", images: [itemImages.chaos], tags: ["rune", "consumable", "loot"] },
      { id: "rune-death", name: "Death Rune", images: [itemImages.death], tags: ["rune", "consumable", "loot"] },
      { id: "rune-blood", name: "Blood Rune", images: [itemImages.blood], tags: ["rune", "consumable", "loot"] },
      { id: "rune-soul", name: "Soul Rune", images: [itemImages.soul], tags: ["rune", "consumable", "loot"] },
      { id: "rune-nature", name: "Nature Rune", images: [itemImages.nature], tags: ["rune", "consumable", "loot"] },
      { id: "rune-law", name: "Law Rune", images: [itemImages.law], tags: ["rune", "consumable", "loot"] },
      { id: "rune-astral", name: "Astral Rune", images: [itemImages.astral], tags: ["rune", "consumable", "loot"] }
    ]
  },
  {
    category: "Food",
    source: "Loot unlock",
    sourceType: "loot",
    items: [
      { id: "basic-sharks", name: "Sharks", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.shark], tags: ["food", "consumable", "always"] },
      { id: "basic-karambwan", name: "Karambwan", images: [itemImages.karambwan], tags: ["food", "consumable", "loot"] },
      { id: "basic-anglerfish", name: "Anglerfish", images: [itemImages.angler], tags: ["food", "consumable", "loot"] },
      { id: "basic-manta-ray", name: "Manta Ray", images: [itemImages.manta], tags: ["food", "consumable", "loot"] }
    ]
  },
  {
    category: "Potions",
    source: "Loot unlock",
    sourceType: "loot",
    items: [
      { id: "basic-prayer-potion", name: "Prayer Potion", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.prayer], tags: ["potion", "consumable", "always"] },
      { id: "basic-stamina-potion", name: "Stamina Potion", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.stamina], tags: ["potion", "consumable", "always"] },
      { id: "basic-blighted-restore", name: "Blighted Restore", images: [itemImages.blightedRestore], tags: ["potion", "consumable", "loot"] }
    ]
  },
  {
    category: "Range Weapons",
    source: "PK loot",
    sourceType: "loot",
    items: [
      { id: "basic-rcb", name: "Rune Crossbow", images: [itemImages.rcb], tags: ["loot"] }
    ]
  },
  {
    category: "Spec Weapons",
    source: "PK loot",
    sourceType: "loot",
    items: [
      { id: "basic-msb", name: "Magic Shortbow", images: [itemImages.msb], tags: ["loot"] },
      { id: "basic-dragon-scimitar", name: "Dragon Scimitar", images: [itemImages.dragonScimitar], tags: ["loot"] },
      { id: "basic-dds", name: "DDS", images: [itemImages.dds], tags: ["loot"] },
      { id: "basic-gmaul", name: "Granite Maul", images: [itemImages.gmaul], tags: ["loot"] }
    ]
  },
  {
    category: "Range Gear",
    source: "PK loot",
    sourceType: "loot",
    items: [
      { id: "basic-black-dhide", name: "Black d'hide", images: [itemImages.blackDhideBody], tags: ["loot"] },
      { id: "basic-glory", name: "Amulet of Glory", images: [itemImages.amuletGlory], tags: ["loot"] },
      { id: "basic-climbing-boots", name: "Climbing Boots", images: [itemImages.climbingBoots], tags: ["loot"] }
    ]
  },
  {
    category: "Mage Gear",
    source: "PK loot",
    sourceType: "loot",
    items: [
      { id: "basic-xerician", name: "Xerician Set", images: [itemImages.xericianTop], tags: ["loot"] },
      { id: "basic-mystic", name: "Mystic Set", images: [itemImages.mysticRobeTopLight], tags: ["loot"] }
    ]
  },
  {
    category: "Melee Gear",
    source: "PK loot",
    sourceType: "loot",
    items: [
      { id: "basic-fremmy-helms", name: "Fremmy Helms", images: [itemImages.berserkerHelm], tags: ["loot"] },
      { id: "basic-neitz", name: "Neitiznot Helm", images: [itemImages.helmNeitiznot], tags: ["loot"] }
    ]
  }
];
const state = loadState();
let currentUser = null;
let saveTimer = null;
let isApplyingRemoteState = false;
let collectionFilter = "all";
let collectionSort = "name";
let collectionSearch = "";
let itemSearchIndex = [];
let itemSearchIndexLoaded = false;

const collectionFilterOptions = [
  { id: "all", label: "All" },
  { id: "unlocked", label: "Unlocked" },
  { id: "locked", label: "Locked" },
  { id: "loot", label: "Loot" },
  { id: "talent", label: "Talent" },
  { id: "shop", label: "Shop" },
  { id: "always", label: "Always Available" },
  { id: "consumables", label: "Consumables" }
];

function flattenBasicUnlocks() {
  return basicUnlockGroups.flatMap((group) => group.items);
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
  const validBasicUnlocks = new Set(flattenBasicUnlocks().map((item) => item.id));
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
    if (validRepeatables.has(id) && Number.isFinite(count)) {
      repeatablePurchases[id] = Math.max(repeatablePurchases[id] ?? 0, Math.floor(count));
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
    ? [...new Set(rawState.basicUnlocks)].filter((id) => validBasicUnlocks.has(id) || id.startsWith("manual-item-"))
    : [];

  if ((rawState?.shopPurchases?.["stamina-pots"] ?? 0) > 0 && !basicUnlocks.includes("basic-stamina-potion")) {
    basicUnlocks.push("basic-stamina-potion");
  }

  return {
    completed: Array.isArray(rawState?.completed)
      ? [...new Set(rawState.completed)].filter((id) => validChallenges.has(id))
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
      id: challengeId("pvm", groupIndex, index),
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
      id: challengeId("repeatable", groupIndex, index),
      legacyId: challengeId("pvm", groupIndex, index),
      title: challengeTitle(challenge),
      cost: challenge.cost ?? 5,
      stage: group.stage
    }] : [])
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

    const completed = visibleItems.filter(({ index }) => state.completed.includes(challengeId("pvm", groupIndex, index))).length;
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
  return `${cost} PK`;
}

const missingImageAssets = new Set([
  itemImage("Antler guard.png"),
  itemImage("Berserker necklace.png"),
  itemImage("Seeker arrow.png"),
  itemImage("Sunlight hunter's crossbow.png"),
  itemImage("Surge potion(4).png")
]);

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

function sourceTypeFromSource(source) {
  const normalized = normalizeCollectionText(source);
  if (normalized.includes("always")) return "always";
  if (normalized.includes("talent")) return "talent";
  if (normalized.includes("shop")) return "shop";
  return "loot";
}

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}

function inferItemTags(name, category = "") {
  const lower = `${name} ${category}`.toLowerCase();
  const tags = [];
  if (lower.includes("rune")) tags.push("rune", "consumable");
  if (lower.includes("potion") || lower.includes("brew") || lower.includes("restore") || lower.includes("anti-venom")) tags.push("potion", "consumable");
  if (["shark", "angler", "karambwan", "manta", "halibut", "marlin", "pizza"].some((food) => lower.includes(food))) tags.push("food", "consumable");
  if (["sack", "arrow", "bolt", "knife", "thrownaxe", "ether"].some((ammo) => lower.includes(ammo))) tags.push("ammo", "consumable");
  if (lower.includes("spellbook") || lower.includes("magicks")) tags.push("spellbook");
  return uniqueTags(tags);
}

function inferCollectionCategory(name, fallback = "Loot") {
  const lower = name.toLowerCase();
  if (lower.includes("spellbook") || lower.includes("magicks")) return "General";
  if (lower.includes("rune") || lower.includes("sack") || lower.includes("arrow") || lower.includes("bolt") || lower.includes("ether")) return "Runes / Ammo";
  if (lower.includes("potion") || lower.includes("brew") || lower.includes("restore") || lower.includes("anti-venom")) return "Potions";
  if (["shark", "angler", "karambwan", "manta", "halibut", "marlin", "pizza"].some((food) => lower.includes(food))) return "Food";
  if (lower.includes("bow") || lower.includes("crossbow")) return "Range Weapons";
  if (lower.includes("robe") || lower.includes("cape") || lower.includes("staff") || lower.includes("book") || lower.includes("tome") || lower.includes("sceptre")) return "Mage Gear";
  if (lower.includes("ring") || lower.includes("helm") || lower.includes("body") || lower.includes("chaps") || lower.includes("boots") || lower.includes("gloves")) return "Gear";
  return fallback;
}

function buildManualCollectionItem(item) {
  const category = inferCollectionCategory(item.name);
  const tags = uniqueTags([...inferItemTags(item.name, category), "loot"]);
  return {
    id: `manual-item-${item.itemId ?? slugifyItemId(item.name)}`,
    name: item.name,
    category,
    source: "Loot unlock",
    sourceType: "loot",
    automatic: false,
    images: [itemImage(item.imageName)],
    tags,
    wikiLink: item.wikiLink,
    searchText: normalizeCollectionText(`${item.name} ${category} ${tags.join(" ")}`)
  };
}

async function loadItemSearchIndex() {
  try {
    const response = await fetch("tools/BronzemanItems.json");
    if (!response.ok) throw new Error(`Item index returned ${response.status}`);
    const items = await response.json();
    itemSearchIndex = Array.isArray(items) ? items.map(buildManualCollectionItem) : [];
  } catch (error) {
    console.warn("Could not load BronzemanItems.json", error);
    itemSearchIndex = [];
  } finally {
    itemSearchIndexLoaded = true;
    refreshCollectionSearchDatalist();
    renderUnlocks();
  }
}

function basicCollectionItems() {
  return basicUnlockGroups.flatMap((group) => group.items.map((item) => {
    const source = item.source ?? group.source;
    const sourceType = item.sourceType ?? group.sourceType ?? sourceTypeFromSource(source);
    return {
      ...item,
      category: group.category,
      source,
      sourceType,
      tags: uniqueTags([...(group.tags ?? []), ...(item.tags ?? []), sourceType === "always" ? "always" : sourceType]),
      automatic: Boolean(item.automatic)
    };
  }));
}

function spellbookCollectionItems() {
  const talentSpellbooks = unlocks
    .filter((unlock) => unlock.collectionCategory === "Spellbooks")
    .map((unlock) => ({ ...unlock, category: "General", source: "Talent", sourceType: "talent", automatic: true, tags: uniqueTags([...(unlock.tags ?? []), "talent", "spellbook"]) }));

  return [
    { id: "spellbook-standard", name: "Standard Spellbook", category: "General", source: "Always available", sourceType: "always", automatic: true, images: [itemImages.standardSpellbook], tags: ["always", "spellbook"] },
    ...talentSpellbooks
  ];
}

function talentCollectionItems() {
  return unlocks
    .filter((unlock) => unlock.collectionCategory !== "Spellbooks")
    .map((unlock) => ({ ...unlock, category: unlock.collectionCategory ?? "Weapons", source: "Talent", sourceType: "talent", automatic: true, tags: uniqueTags([...(unlock.tags ?? []), "talent", ...inferItemTags(unlock.name, unlock.collectionCategory ?? "")]) }));
}

function shopCollectionItems() {
  return shopItems.map((item) => {
    const entries = item.items ?? (item.images ?? []).map((image) => ({ image }));
    return {
      id: `shop-${item.id}`,
      shopId: item.id,
      name: item.name,
      category: item.category,
      source: "Shop",
      sourceType: "shop",
      automatic: true,
      images: entries.map((entry) => entry.image),
      tags: uniqueTags(["shop", ...inferItemTags(item.name, item.category)])
    };
  });
}

function collectionItems() {
  return [
    ...spellbookCollectionItems(),
    ...basicCollectionItems(),
    ...itemSearchIndex,
    ...talentCollectionItems(),
    ...shopCollectionItems()
  ].map((item) => ({
    ...item,
    searchText: item.searchText ?? normalizeCollectionText(`${item.name} ${item.category} ${item.source} ${(item.tags ?? []).join(" ")}`)
  }));
}

function collectionIsUnlocked(item) {
  if (item.sourceType === "always") return true;
  if (item.sourceType === "talent") return state.purchased.includes(item.id);
  if (item.sourceType === "shop") return (state.shopPurchases[item.shopId] ?? 0) > 0;
  return state.basicUnlocks.includes(item.id);
}

function collectionStatusLabel(item) {
  if (item.sourceType === "always") return "Always";
  return collectionIsUnlocked(item) ? "Unlocked" : "Locked";
}

function collectionMatchesFilter(item) {
  const unlocked = collectionIsUnlocked(item);
  if (collectionFilter === "unlocked") return unlocked;
  if (collectionFilter === "locked") return !unlocked;
  if (collectionFilter === "loot") return item.sourceType === "loot";
  if (collectionFilter === "talent") return item.sourceType === "talent";
  if (collectionFilter === "shop") return item.sourceType === "shop";
  if (collectionFilter === "always") return item.sourceType === "always" || (item.tags ?? []).includes("always");
  if (collectionFilter === "consumables") return (item.tags ?? []).includes("consumable");
  return true;
}

function visibleCollectionItems() {
  const query = normalizeCollectionText(collectionSearch);
  const items = collectionItems().filter((item) => {
    return collectionMatchesFilter(item) && (!query || item.searchText.includes(query));
  });

  return items.sort((a, b) => {
    if (collectionSort === "source") return `${a.source} ${a.name}`.localeCompare(`${b.source} ${b.name}`);
    if (collectionSort === "status") return `${collectionStatusLabel(a)} ${a.name}`.localeCompare(`${collectionStatusLabel(b)} ${b.name}`);
    return a.name.localeCompare(b.name);
  });
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
  const checkable = !item.automatic && item.sourceType === "loot";
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
      <span>${escapeHtml(item.source)} / ${status}</span>
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

  target.innerHTML = collectionFilterOptions.map((filter) => `
    <button type="button" data-collection-filter="${filter.id}" class="${filter.id === collectionFilter ? "active" : ""}" aria-pressed="${filter.id === collectionFilter}">${filter.label}</button>
  `).join("");

  target.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      collectionFilter = button.dataset.collectionFilter;
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
    .map((item) => `<option value="${escapeHtml(item.name)}" label="${escapeHtml(item.source)}"></option>`)
    .join("");

  datalist.innerHTML = options;
}

function manuallyUnlockSearchSelection() {
  const input = document.getElementById("collectionSearch");
  const value = input?.value ?? "";
  const normalized = normalizeCollectionText(value);
  if (!normalized) return;

  const match = collectionItems().find((item) => normalizeCollectionText(item.name) === normalized && item.sourceType === "loot");
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
  const sortSelect = document.getElementById("collectionSort");
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

  sortSelect?.addEventListener("change", (event) => {
    collectionSort = event.target.value;
    renderUnlocks();
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

initCollectionControls();
showTab("tasks");
render();
loadItemSearchIndex();
initFirebaseAuth();








