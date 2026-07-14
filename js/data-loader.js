import { DATA_URLS } from "./config.js";
import { itemImage, otherImage } from "./assets.js";
import {
  normalizeAssetPath,
  normalizeCollectionText,
  slugifyItemId,
  toArray,
  toNumber,
  uniqueTags,
  withoutTrailingPeriod
} from "./utils.js";

const BEHAVIOR_TAGS = new Set(["hidden", "shop", "talent", "unlock", "resupply"]);

export function createDataLoader(ctx) {
  function dataBehaviors(entry) {
    if (Array.isArray(entry?.behaviors)) return uniqueTags(entry.behaviors);
    return uniqueTags(entry?.tags ?? []).filter((tag) => BEHAVIOR_TAGS.has(tag));
  }

  function dataTags(entry) {
    const tags = uniqueTags(entry?.tags ?? []);
    return Array.isArray(entry?.behaviors) ? tags : tags.filter((tag) => !BEHAVIOR_TAGS.has(tag));
  }

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

  function resolveDataImage(name) {
  if (!name) return "";

  const value = String(name).trim();

  if (value.includes("/")) {
    return value;
  }

  const baseName = value.replace(/\.png$/i, "");
  const normalizedBaseName = baseName.replace(/_/g, " ");

  const itemRow = ctx.indexes.itemRowsByName.get(
    normalizeDataText(normalizedBaseName)
  );

  if (itemRow?.imageName) {
    return itemImage(itemRow.imageName);
  }

  const fileName = /\.png$/i.test(value)
    ? value.replace(/_/g, " ")
    : `${value.replace(/_/g, " ")}.png`;

  return otherImage(fileName);
}

  function imageForDataEntry(entry) {
    return entry?.imagePath || resolveDataImage(entry?.imageName || entry?.imageUsed);
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

  function normalizeUnlockChallenges(data) {
    return toArray(data?.challenges).map((challenge, index) => {
      const title = String(challenge?.challengeName || ("Challenge " + (index + 1)));
      const requiredItems = toArray(challenge?.requiredItems).map(String).filter(Boolean);
      const rewardIds = toArray(challenge?.rewardItems).map((name) => {
        return ctx.indexes.itemRowsByName.get(normalizeDataText(name))?.uid || slugifyItemId(name);
      });
      const completionTarget = toNumber(challenge?.completionsRequired, NaN);
      const isMilestone = Number.isFinite(completionTarget);

      return {
        id: slugifyItemId(title),
        title,
        rules: toArray(challenge?.challengeRules).map(String).filter(Boolean),
        disclaimer: String(challenge?.disclaimer || ""),
        requirementGroups: Array.from(
          { length: Math.ceil(requiredItems.length / 3) },
          (_, groupIndex) => requiredItems.slice(groupIndex * 3, (groupIndex + 1) * 3)
        ),
        rewardIds,
        mode: isMilestone ? "milestone" : "roulette",
        completionTarget: isMilestone ? Math.max(1, completionTarget) : null
      };
    });
  }

  function normalizeTalentUnlock(entry, sourceType) {
    const cost = toNumber(entry.cost, NaN);
    const tier = toNumber(entry.tier, NaN);
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(tier) || tier <= 0) return null;

    const tags = dataTags(entry);
    const behaviors = dataBehaviors(entry);
    const collectionIds = sourceType === "set"
      ? itemIdsFromDataIds(entry.itemIds)
      : [dataUid(entry)].filter(Boolean);

    return {
      id: dataUid(entry),
      name: dataDisplayName(entry, "Unlock"),
      cost,
      tier,
      tags,
      behaviors,
      requires: toArray(entry.requires),
      collectionIds,
      images: [imageForDataEntry({ ...entry, tags })].filter(Boolean),
      collectionCategory: ctx.collection.collectionCategoryFromTags(tags)
    };
  }

  function buildDataUnlocks(itemsData, itemSetsData, unlocksData) {
    const itemUnlocks = toArray(itemsData?.items)
      .filter((item) => dataBehaviors(item).includes("talent"))
      .map((item) => normalizeTalentUnlock(item, "item"));
    const setUnlocks = toArray(itemSetsData?.itemSets)
      .filter((itemSet) => dataBehaviors(itemSet).includes("talent"))
      .map((itemSet) => normalizeTalentUnlock(itemSet, "set"));
    const nonItemUnlocks = toArray(unlocksData?.unlocks)
      .filter((unlock) => dataBehaviors(unlock).includes("talent"))
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

  function normalizeShopSection(entry, behaviors) {
    if (behaviors.includes("resupply") || entry.section === "resupply") return "resupply";
    if (behaviors.includes("unlock") || entry.section === "unlocks") return "unlocks";
    return "unlocks";
  }

  function normalizeShopCategory(entry, tags) {
    const categoryTags = tags.filter((tag) => !["shop", "resupply", "unlock"].includes(tag));
    if (categoryTags.length) return ctx.collection.collectionCategoryFromTags(categoryTags);
    return entry.category || "Other";
  }

  function shopItemImages(entry, sourceType) {
    if (sourceType === "set") {
      return itemIdsFromDataIds(entry.itemIds).map((uid) => {
        const item = ctx.indexes.itemRowsByUid.get(uid);
        return { image: imageForDataEntry(item) };
      }).filter((item) => item.image);
    }

    const image = imageForDataEntry(entry);
    return image ? [{ image }] : [];
  }

  function normalizeShopItem(entry, sourceType) {
    const tags = dataTags(entry);
    const behaviors = dataBehaviors(entry);
    return {
      id: dataUid(entry, "shop"),
      category: normalizeShopCategory(entry, tags),
      section: normalizeShopSection(entry, behaviors),
      name: dataDisplayName(entry, "Shop item"),
      cost: toNumber(entry.cost, 1),
      note: entry.note,
      tags,
      behaviors,
      items: shopItemImages(entry, sourceType)
    };
  }

  function buildDataShopItems(itemsData, itemSetsData, unlocksData) {
    const sources = [
      [itemsData?.items, "item"],
      [itemSetsData?.itemSets, "set"],
      [unlocksData?.unlocks, "unlock"]
    ];
    const seen = new Set();
    const shopItems = sources.flatMap(([entries, sourceType]) => {
      return toArray(entries)
        .filter((entry) => dataBehaviors(entry).includes("shop"))
        .map((entry) => normalizeShopItem(entry, sourceType));
    }).filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    ctx.data.shopCategories = [...new Set(shopItems.map((item) => item.category))];
    return shopItems;
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  function enrichCollectionSignals(items) {
    return items.map((item) => {
      const tags = uniqueTags(item.tags ?? []);
      const behaviors = uniqueTags(item.behaviors ?? []);
      if (ctx.data.unlocks.some((unlock) => ctx.collection.unlockMatchesCollectionItem(unlock, item)) && !behaviors.includes("talent")) behaviors.push("talent");
      if (ctx.data.shopItems.some((shopItem) => ctx.collection.shopMatchesCollectionItem(shopItem, item)) && !behaviors.includes("shop")) behaviors.push("shop");

      const displayTags = uniqueTags(tags.map(ctx.collection.collectionDisplayTag));
      return {
        ...item,
        tags,
        behaviors,
        category: ctx.collection.collectionCategoryFromTags(tags),
        sourceType: ctx.collection.collectionSourceType({ ...item, behaviors }),
        automatic: false,
        searchText: normalizeCollectionText(`${item.name} ${item.originalName ?? ""} ${tags.join(" ")} ${displayTags.join(" ")}`)
      };
    });
  }

  async function loadAppData() {
    try {
      const [itemsData, itemSetsData, unlocksData, pvmData, pvpData, challengesData] = await Promise.all([
        fetchJson(DATA_URLS.items),
        fetchJson(DATA_URLS.itemSets),
        fetchJson(DATA_URLS.unlocks),
        fetchJson(DATA_URLS.pvm),
        fetchJson(DATA_URLS.pvp),
        fetchJson(DATA_URLS.challenges)
      ]);

      ctx.indexes.challengeIdAliases = {};
      ctx.indexes.repeatableIdAliases = {};
      indexItemRows(itemsData.items);
      ctx.config.challengeCatalog = normalizeUnlockChallenges(challengesData);
      ctx.data.challengeCatalog = ctx.config.challengeCatalog;

      ctx.data.challenges = {
        pvm: normalizePvmChallenges(pvmData),
        pvp: normalizePvpChallenges(pvpData)
      };
      ctx.data.unlocks = mergeUnlocks(buildDataUnlocks(itemsData, itemSetsData, unlocksData));
      ctx.data.shopItems = buildDataShopItems(itemsData, itemSetsData, unlocksData);

      const seen = new Set();
      const items = toArray(itemsData.items)
        .map(ctx.collection.collectionItemFromDefinition)
        .filter((item) => {
          const key = item.id || normalizeAssetPath(item.images?.[0]) || normalizeCollectionText(item.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      ctx.data.itemDefinitions = enrichCollectionSignals(items.filter((item) => !ctx.collection.collectionExcluded(item)));
    } catch (error) {
      console.warn("Could not load Bronzeman JSON data", error);
      ctx.data.dataWarnings.push("Could not load one or more Bronzeman JSON files.");
      ctx.data.challenges = { pvm: [], pvp: [] };
      ctx.config.challengeCatalog = [];
      ctx.data.challengeCatalog = [];
      ctx.data.unlocks = [];
      ctx.data.shopItems = [];
      ctx.data.shopCategories = [];
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
