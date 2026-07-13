export const STORAGE_KEY = "bronzeman-point-challenges-v2";

export const DATA_URLS = {
  items: "data/BronzemanItems.json",
  itemSets: "data/BronzemanItemSets.json",
  unlocks: "data/BronzemanUnlocks.json",
  pvm: "data/BronzemanPvM.json",
  pvp: "data/BronzemanPvP.json",
  shop: "data/BronzemanShop.json"
};

export const COLLECTION_FILTERS = [
  { id: "all", label: "All", type: "mode" },
  { id: "unlocked", label: "Unlocked", type: "mode" },
  { id: "locked", label: "Locked", type: "mode" },
  { id: "spec", label: "Spec", type: "tag" },
  { id: "range", label: "Range", type: "tag" },
  { id: "mage", label: "Mage", type: "tag" },
  { id: "melee", label: "Melee", type: "tag" },
  { id: "weapon", label: "Weapon", type: "tag" },
  { id: "armor", label: "Armor", type: "tag" },
  { id: "jewellery", label: "Jewellery", type: "tag" },
  { id: "talent", label: "Talent", type: "tag" },
  { id: "shop", label: "Shop", type: "tag" },
  { id: "rune", label: "Runes", type: "tag" },
  { id: "ammo", label: "Ammo", type: "tag" },
  { id: "food", label: "Food", type: "tag" },
  { id: "potion", label: "Potions", type: "tag" },
  { id: "teleport", label: "Teleports", type: "tag" },
  { id: "consumable", label: "Consumables", type: "tag" },
  { id: "other", label: "Other", type: "tag" }
];

export const COLLECTION_CATEGORY_PRIORITY = [
  "spec",
  "range",
  "mage",
  "melee",
  "weapon",
  "armor",
  "jewellery",
  "rune",
  "ammo",
  "food",
  "potion",
  "teleport",
  "talent",
  "shop",
  "consumable",
  "other"
];

export const TALENT_TIER_REQUIREMENT = 10;

export const PERILOUS_MOONS_REWARD_IDS = [
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

export const CHALLENGE_CATALOG = [
  {
    id: "obsidian-tri-brid",
    title: "Obsidian Tri-Brid",
    requirementGroups: [
      ["Rock-shell plate", "Spined body", "Skeletal top"],
      ["Tzhaar-ket-om", "Toktz-xil-ul", "Toktz-mej-tal"]
    ],
    rules: [
      "Defeat a real opponent while using one full set of Rock-shell, Spined, or Skeletal armor.",
      "Wear at least two pieces from each of the other two sets.",
      "Use an obsidian melee weapon, obsidian staff, and obsidian thrown weapon.",
      "Damage the opponent with melee, ranged, and magic during the fight using only obsidian weapons.",
      "The opponent must either be a legitimate pker or have a key worth at least 500k",
      "Challenge requirements must be observed by all participating players in multi combat areas."
    ]
  }
];

export const CHALLENGE_COUNTDOWN_SECONDS = 3;
export const CHALLENGE_ROLL_DURATION_MS = 5000;
export const CHALLENGE_ROLL_RESULT_HOLD_MS = 3000;

export const HARD_CODED_DATA_NOTES = [
  "Firebase project settings and tracker document path are currently configured in js/firebase-service.js.",
  "Collection filter definitions, category priority, talent tier requirement, and Perilous Moons reward IDs live in js/config.js and could move into JSON if they should be admin-editable.",
  "The Obsidian Tri-Brid challenge rules are still a code constant in js/config.js; future challenge definitions could be loaded from data/BronzemanChallenges.json.",
  "Special image folder routing for spellbooks, prayers, and misc assets lives in js/assets.js and could move to an asset manifest JSON."
];
