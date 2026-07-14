export const STORAGE_KEY = "bronzeman-point-challenges-v2";

export const DATA_URLS = {
  items: "data/BronzemanItems.json",
  itemSets: "data/BronzemanItemSets.json",
  unlocks: "data/BronzemanUnlocks.json",
  pvm: "data/BronzemanPvM.json",
  pvp: "data/BronzemanPvP.json",
  challenges: "data/BronzemanChallenges.json"
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

export const CHALLENGE_COUNTDOWN_SECONDS = 3;
export const CHALLENGE_ROLL_DURATION_MS = 5000;
export const CHALLENGE_ROLL_RESULT_HOLD_MS = 3000;
