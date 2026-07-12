import { DATA_URLS } from "./config.js";
import { imageAsset, itemImage } from "./assets.js";
import {
  normalizeAssetPath,
  normalizeCollectionText,
  slugifyItemId,
  titleCase,
  toArray,
  toNumber,
  uniqueTags,
  withoutTrailingPeriod
} from "./utils.js";

export function createDataLoader(ctx) {
  function dataDisplayName(entry, fallback = "Item") {
    return entry?.alias || entry?.name || fallback;
  }

  function dataUid(entry, fallbackPrefix = "item") {
    return String(entry?.uid || entry?.id || slugifyItemId(dataDisplayName(entry, fallbackPrefix)));
  }

  function normalizeDataText(value) {
    return normalizeCollectionText(withoutTrailingPeriod(value));
  }

  function indexItemRows(items) {
    ctx.indexes.itemRowsByUid = new Map();
    ctx.indexes.itemRowsByItemId = new Map();
    ctx.indexes.itemRowsByName = new Map();

    toArray(items).forEach((item) => {
      const uid = dataUid(item);
      ctx.indexes.itemRowsByUid.set(uid, item);
      if (item.itemId !== null && item.itemId !== undefined) ctx.indexes.itemRowsByItemId.set(String(item.itemId), item);
      [item.name, item.alias, item.imageUsed, item.imageName?.replace(/\.png$/i, "")].filter(Boolean).forEach((name) => {
        ctx.indexes.itemRowsByName.set(normalizeDataText(name), item);
      });
    });
  }

  function itemIdsFromDataIds(itemIds) {
    return toArray(itemIds).map((id) => {
      const key = String(id);
      return ctx.indexes.itemRowsByItemId.get(key)?.uid || ctx.indexes.itemRowsByUid.get(key)?.uid || key;
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

    const itemRow = ctx.indexes.itemRowsByName.get(normalizeDataText(value));
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
    if (legacyId) ctx.indexes.challengeIdAliases[legacyId] = id;

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
        const legacyId = ctx.domain.challengeId("pvm", groupIndex, index);
        const normalized = normalizeChallengeTask(taskEntry, "pvm", legacyId);
        if (normalized.repeatable) {
          normalized.id = `repeatable-${dataUid(taskEntry, "task")}`;
          ctx.indexes.repeatableIdAliases[ctx.domain.challengeId("repeatable", groupIndex, index)] = normalized.id;
          ctx.indexes.repeatableIdAliases[legacyId] = normalized.id;
        }
        return normalized;
      })
    }));
  }

  function normalizePvpChallenges(data) {
    return toArray(data?.pvpTasks).map((taskEntry, index) => normalizeChallengeTask(taskEntry, "pvp", ctx.domain.challengeId("pvp", index)));
  }

  function normalizeCollectionSetDefinitions(data) {
    return toArray(data?.itemSets).map((setEntry) => ({
      ...setEntry,
      id: dataUid(setEntry, "set"),
      name: dataDisplayName(setEntry, "Set"),
      originalName: setEntry.name,
      itemIds: itemIdsFromDataIds(setEntry.itemIds),
      tags: uniqueTags(setEntry.tags ?? []),
      images: [imageForDataEntry(setEntry)].filter(Boolean)
    }));
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
      collectionCategory: ctx.collection.collectionCategoryFromTags(tags)
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
      section: shopItem.section === "unlocks" || shopItem.category === "Gear" ? "unlocks" : "resupply",
      name: dataDisplayName(shopItem, "Shop item"),
      cost: toNumber(shopItem.cost, 1),
      note: shopItem.note,
      items: toArray(shopItem.items).map((entry) => ({
        image: entry.image ? resolveDataImage(entry.image, entry.tags) : resolveDataImage(entry.imageUsed || entry.name || entry.uid, entry.tags),
        amount: entry.amount
      }))
    }));

    ctx.data.shopCategories = toArray(data?.categories).length
      ? toArray(data.categories).map((category) => String(category)).filter(Boolean)
      : [...new Set(jsonShopItems.map((item) => item.category))];

    if (!jsonShopItems.length) ctx.data.dataWarnings.push("BronzemanShop.json does not define any shopItems.");
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
      if (ctx.data.unlocks.some((unlock) => ctx.collection.unlockMatchesCollectionItem(unlock, item)) && !tags.includes("talent")) tags.push("talent");
      if (ctx.data.shopItems.some((shopItem) => ctx.collection.shopMatchesCollectionItem(shopItem, item)) && !tags.includes("shop")) tags.push("shop");

      const displayTags = uniqueTags(tags.map(ctx.collection.collectionDisplayTag));
      return {
        ...item,
        tags,
        category: ctx.collection.collectionCategoryFromTags(tags),
        sourceType: ctx.collection.collectionSourceType({ ...item, tags }),
        automatic: ctx.collection.collectionSourceType({ ...item, tags }) !== "collection",
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

      ctx.indexes.challengeIdAliases = {};
      ctx.indexes.repeatableIdAliases = {};
      indexItemRows(itemsData.items);

      ctx.data.challenges = {
        pvm: normalizePvmChallenges(pvmData),
        pvp: normalizePvpChallenges(pvpData)
      };
      ctx.data.collectionSetDefinitions = normalizeCollectionSetDefinitions(itemSetsData);
      ctx.data.unlocks = mergeUnlocks(buildDataUnlocks(itemsData, itemSetsData, unlocksData));
      ctx.data.shopItems = normalizeShopItems(shopData);

      const seen = new Set();
      const items = toArray(itemsData.items)
        .map(ctx.collection.collectionItemFromDefinition)
        .filter((item) => {
          const key = item.id || normalizeAssetPath(item.images?.[0]) || normalizeCollectionText(item.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      ctx.data.itemDefinitions = enrichCollectionSignals(ctx.collection.collapseCollectionSets(items));
    } catch (error) {
      console.warn("Could not load Bronzeman JSON data", error);
      ctx.data.dataWarnings.push("Could not load one or more Bronzeman JSON files.");
      ctx.data.challenges = { pvm: [], pvp: [] };
      ctx.data.unlocks = [];
      ctx.data.shopItems = [];
      ctx.data.shopCategories = [];
      ctx.data.collectionSetDefinitions = [];
      ctx.data.itemDefinitions = [];
    }
  }

  return {
    dataDisplayName,
    dataUid,
    normalizeDataText,
    resolveDataImage,
    imageForDataEntry,
    loadAppData
  };
}
