const SPECIAL_IMAGE_FOLDERS = {
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

export function localImage(folder, fileName) {
  return `${folder}/${encodeURIComponent(fileName)}`;
}

export function itemImage(fileName) {
  return localImage("images/items", fileName);
}

export function imageAsset(fileName) {
  return localImage(`images/${SPECIAL_IMAGE_FOLDERS[fileName] ?? "other"}`, fileName);
}
