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

const BEHAVIOR_TAGS = new Set(["hidden", "talent"]);

export function createDataLoader(ctx) {
  function dataBehaviors(entry) {
    if (Array.isArray(entry?.behaviors)) {
      return uniqueTags(entry.behaviors).filter((behavior) => BEHAVIOR_TAGS.has(behavior));
    }
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
    ctx.indexes.itemRowsBySetUid = new Map();

    toArray(items).forEach((item) => {
      const uid = dataUid(item);
      ctx.indexes.itemRowsByUid.set(uid, item);
      if (item.itemId !== null && item.itemId !== undefined) ctx.indexes.itemRowsByItemId.set(String(item.itemId), item);
      [item.name, item.alias, item.imageUsed, item.imageName?.replace(/\.png$/i, "")].filter(Boolean).forEach((name) => {
        ctx.indexes.itemRowsByName.set(normalizeDataText(name), item);
      });

      const setUid = typeof item.set === "string" ? item.set.trim() : "";
      if (setUid) {
        const members = ctx.indexes.itemRowsBySetUid.get(setUid) ?? [];
        members.push(item);
        ctx.indexes.itemRowsBySetUid.set(setUid, members);
      }
    });
  }

  function itemIdsFromDataIds(itemIds) {
    return toArray(itemIds).map((id) => {
      const key = String(id);
      return ctx.indexes.itemRowsByItemId.get(key)?.uid || ctx.indexes.itemRowsByUid.get(key)?.uid || key;
    });
  }

  function dataSets(data) {
    return toArray(data?.sets ?? data?.itemSets);
  }

  function itemRowsForSet(entry) {
    const rows = [];
    const seen = new Set();

    itemIdsFromDataIds(entry?.itemIds).forEach((uid) => {
      const item = ctx.indexes.itemRowsByUid.get(uid);
      if (!item || seen.has(uid)) return;
      seen.add(uid);
      rows.push(item);
    });

    toArray(ctx.indexes.itemRowsBySetUid.get(dataUid(entry))).forEach((item) => {
      const uid = dataUid(item);
      if (seen.has(uid)) return;
      seen.add(uid);
      rows.push(item);
    });

    return rows;
  }

  function itemIdsForSet(entry) {
    const memberIds = itemRowsForSet(entry).map((item) => dataUid(item));
    return memberIds.length ? memberIds : itemIdsFromDataIds(entry?.itemIds);
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
      ? itemIdsForSet(entry)
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

  function isTalentEntry(entry) {
    return dataBehaviors(entry).includes("talent") || uniqueTags(entry?.tags ?? []).includes("talent");
  }

  function buildDataUnlocks(itemsData, itemSetsData, unlocksData) {
    const itemUnlocks = toArray(itemsData?.items)
      .filter(isTalentEntry)
      .map((item) => normalizeTalentUnlock(item, "item"));
    const setUnlocks = dataSets(itemSetsData)
      .filter(isTalentEntry)
      .map((itemSet) => normalizeTalentUnlock(itemSet, "set"));
    const nonItemUnlocks = toArray(unlocksData?.unlocks)
      .filter(isTalentEntry)
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

  function normalizeShopSection(category) {
    const value = String(category || "").trim().toLowerCase();
    if (value === "resupply") return "resupply";
    if (value === "unlock" || value === "unlocks") return "unlocks";
    return "other";
  }

  function shopAmount(entry, index) {
    if (Array.isArray(entry?.amount)) return entry.amount[index] ?? null;
    return entry?.amount ?? null;
  }

  function shopItemImages(entry, itemDefinition) {
    const configuredImages = toArray(entry?.images).map((imageEntry, index) => {
      const imageName = typeof imageEntry === "string"
        ? imageEntry
        : imageEntry?.image || imageEntry?.imagePath || imageEntry?.imageName;
      const amount = typeof imageEntry === "object" && imageEntry !== null
        ? imageEntry.amount ?? shopAmount(entry, index)
        : shopAmount(entry, index);
      const image = resolveDataImage(imageName);
      return image ? { image, amount } : null;
    }).filter(Boolean);

    if (configuredImages.length) return configuredImages;

    const image = imageForDataEntry(itemDefinition);
    return image ? [{ image, amount: shopAmount(entry, 0) }] : [];
  }

  function normalizeShopItem(entry) {
    const id = dataUid(entry, "shop");
    const itemDefinition = ctx.indexes.itemRowsByUid.get(id);
    const tags = dataTags(itemDefinition ?? entry);
    return {
      id,
      category: ctx.collection.collectionCategoryFromTags(tags),
      section: normalizeShopSection(entry.category),
      name: dataDisplayName(entry, "Shop item"),
      cost: toNumber(entry.cost, 1),
      note: entry.note,
      tags,
      collectionIds: [id],
      items: shopItemImages(entry, itemDefinition)
    };
  }

  function buildDataShopItems(shopData) {
    const seen = new Set();
    const shopItems = toArray(shopData?.shop).map(normalizeShopItem).filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    ctx.data.shopCategories = [...new Set(shopItems.map((item) => item.category))].sort((first, second) => {
      const filters = ctx.collection.collectionFilterOptions();
      const firstIndex = filters.findIndex((filter) => filter.label === first);
      const secondIndex = filters.findIndex((filter) => filter.label === second);
      const firstRank = firstIndex < 0 ? Number.MAX_SAFE_INTEGER : firstIndex;
      const secondRank = secondIndex < 0 ? Number.MAX_SAFE_INTEGER : secondIndex;
      return firstRank - secondRank || first.localeCompare(second);
    });
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
      const shopItem = ctx.data.shopItems.some((entry) => ctx.collection.shopMatchesCollectionItem(entry, item));

      const displayTags = uniqueTags(tags.map(ctx.collection.collectionDisplayTag));
      return {
        ...item,
        tags,
        behaviors,
        category: ctx.collection.collectionCategoryFromTags(tags),
        sourceType: ctx.collection.collectionSourceType({ ...item, behaviors, shopItem }),
        automatic: false,
        searchText: normalizeCollectionText(`${item.name} ${item.originalName ?? ""} ${tags.join(" ")} ${displayTags.join(" ")}`)
      };
    });
  }

  async function loadAppData() {
    try {
      const [itemsData, itemSetsData, unlocksData, shopData, pvmData, pvpData, challengesData] = await Promise.all([
        fetchJson(DATA_URLS.items),
        fetchJson(DATA_URLS.itemSets),
        fetchJson(DATA_URLS.unlocks),
        fetchJson(DATA_URLS.shop),
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
      ctx.data.shopItems = buildDataShopItems(shopData);

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
