import { COLLECTION_CATEGORY_PRIORITY, COLLECTION_FILTERS } from "../config.js";
import { itemImage } from "../assets.js";
import {
  normalizeAssetPath,
  normalizeCollectionText,
  titleCase,
  uniqueTags,
  slugifyItemId
} from "../utils.js";

const LEGACY_TAG_GROUPS = {
  "spec wep": ["spec", "weapon"],
  "range wep": ["range", "weapon"],
  "range arm": ["range", "armor"],
  "mage wep": ["mage", "weapon"],
  "mage arm": ["mage", "armor"],
  "melee wep": ["melee", "weapon"],
  "melee arm": ["melee", "armor"],
  "generic gear": ["armor"],
  potions: ["potion"],
  runes: ["rune"],
  consumables: ["consumable"]
};

const BEHAVIOR_TAGS = new Set(["hidden", "talent"]);

export function createCollection(ctx) {
  function itemDisplayName(item) {
    return item.alias || item.name || "Item";
  }

  function itemTagList(item) {
    const tags = uniqueTags(item.tags ?? []);
    return Array.isArray(item.behaviors) ? tags : tags.filter((tag) => !BEHAVIOR_TAGS.has(tag));
  }

  function itemBehaviorList(item) {
    if (Array.isArray(item.behaviors)) {
      return uniqueTags(item.behaviors).filter((behavior) => BEHAVIOR_TAGS.has(behavior));
    }
    return uniqueTags(item.tags ?? []).filter((tag) => BEHAVIOR_TAGS.has(tag));
  }

  function itemImagePath(item) {
    return item.imagePath || (item.imageName ? itemImage(item.imageName) : "");
  }

  function collectionSourceType(item) {
    const behaviors = itemBehaviorList(item);
    if (item.alwaysAvailable || item.unlocked) return "always";
    if (behaviors.includes("talent")) return "talent";
    if (item.shopItem) return "shop";
    return "collection";
  }

  function collectionTagGroups(tags) {
    const groups = new Set();

    (tags ?? []).forEach((tag) => {
      const mappedTags = LEGACY_TAG_GROUPS[tag] ?? [tag];
      mappedTags.forEach((mappedTag) => {
        if (COLLECTION_FILTERS.some((filter) => filter.id === mappedTag && filter.type === "tag")) groups.add(mappedTag);
      });
    });

    if (!groups.size) groups.add("other");
    return [...groups];
  }

  function collectionFilterOptions() {
    return COLLECTION_FILTERS;
  }

  function collectionFilterLabel(id) {
    return COLLECTION_FILTERS.find((filter) => filter.id === id)?.label ?? titleCase(id);
  }

  function collectionDisplayTag(tag) {
    return LEGACY_TAG_GROUPS[tag]?.[0] ?? tag;
  }

  function collectionDisplayTags(item) {
    return uniqueTags((item.tags ?? []).map(collectionDisplayTag));
  }

  function collectionExcluded(item) {
    const behaviors = itemBehaviorList(item);
    return Boolean(
      item.hidden ||
      item.excludeFromCollection ||
      item.collectionHidden ||
      behaviors.includes("hidden")
    );
  }

  function collectionPrimaryGroup(tags) {
    const groups = collectionTagGroups(tags);
    return COLLECTION_CATEGORY_PRIORITY.find((group) => groups.includes(group)) ?? "other";
  }

  function collectionCategoryFromTags(tags) {
    return collectionFilterLabel(collectionPrimaryGroup(tags));
  }

  function collectionItemFromDefinition(item) {
    const tags = itemTagList(item);
    const behaviors = itemBehaviorList(item);
    const name = itemDisplayName(item);
    const image = itemImagePath(item);
    const sourceType = collectionSourceType({ ...item, behaviors });
    const displayTags = uniqueTags(tags.map(collectionDisplayTag));

    return {
      ...item,
      id: item.uid || item.id || `item-${item.itemId ?? slugifyItemId(item.name)}`,
      name,
      originalName: item.name,
      itemId: item.itemId,
      category: collectionCategoryFromTags(tags),
      sourceType,
      automatic: false,
      images: image ? [image] : [],
      tags,
      behaviors,
      searchText: normalizeCollectionText(`${name} ${item.name ?? ""} ${tags.join(" ")} ${displayTags.join(" ")}`)
    };
  }

  function collectionItems() {
    return ctx.data.itemDefinitions;
  }

  function unlockMatchesCollectionItem(unlock, item) {
    const itemIds = [item.id, ...(item.collectionIds ?? [])];
    if (itemIds.some((id) => (unlock.collectionIds ?? []).includes(id))) return true;

    const itemImages = new Set((item.images ?? []).map(normalizeAssetPath));
    return (unlock.images ?? [unlock.image]).some((image) => itemImages.has(normalizeAssetPath(image)));
  }

  function shopMatchesCollectionItem(shopItem, item) {
    const itemIds = [item.id, ...(item.collectionIds ?? [])];
    if (itemIds.some((id) => (shopItem.collectionIds ?? []).includes(id))) return true;

    const itemImages = new Set((item.images ?? []).map(normalizeAssetPath));
    const entries = shopItem.items ?? (shopItem.images ?? []).map((image) => ({ image }));
    return entries.some((entry) => itemImages.has(normalizeAssetPath(entry.image)));
  }

  function challengeCollectionUnlocksItem(item) {
    const itemIds = [item.id, ...(item.collectionIds ?? [])];
    return itemIds.some((id) => ctx.domain.challengeRewardIsUnlocked(id));
  }

  function collectionIsUnlocked(item) {
    if (ctx.state.lockedItems.includes(item.id)) return false;
    if (ctx.state.basicUnlocks.includes(item.id)) return true;
    if (item.sourceType === "always") return true;
    if (challengeCollectionUnlocksItem(item)) return true;

    const behaviors = item.behaviors ?? [];
    const unlockedByTalent = behaviors.includes("talent") && ctx.data.unlocks.some((unlock) => {
      return ctx.state.purchased.includes(unlock.id) && unlockMatchesCollectionItem(unlock, item);
    });
    const unlockedByShop = ctx.data.shopItems.some((shopItem) => {
      return (ctx.state.shopPurchases[shopItem.id] ?? 0) > 0 && shopMatchesCollectionItem(shopItem, item);
    });

    if (unlockedByTalent || unlockedByShop) return true;
    return false;
  }

  function collectionStatusLabel(item) {
    return collectionIsUnlocked(item) ? "Unlocked" : "Locked";
  }

  function collectionMatchesFilter(item) {
    const unlocked = collectionIsUnlocked(item);
    if (ctx.collectionUi.filterMode === "unlocked") return unlocked;
    if (ctx.collectionUi.filterMode === "locked") return !unlocked;
    if (ctx.collectionUi.filterMode === "all" || !ctx.collectionUi.activeFilters.size) return true;

    const groups = collectionTagGroups(item.tags ?? []);
    const matchesTag = groups.some((group) => ctx.collectionUi.activeFilters.has(group));
    const matchesTalent = ctx.collectionUi.activeFilters.has("talent") && itemBehaviorList(item).includes("talent");
    const matchesShop = ctx.collectionUi.activeFilters.has("shop") && ctx.data.shopItems.some((shopItem) => {
      return shopMatchesCollectionItem(shopItem, item);
    });
    return matchesTag || matchesTalent || matchesShop;
  }

  function visibleCollectionItems() {
    const query = normalizeCollectionText(ctx.collectionUi.search);
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
    const label = document.createElement("label");
    const unlocked = collectionIsUnlocked(item);
    label.className = `unlocked-item checkable ${unlocked ? "is-unlocked" : "is-locked"} source-${item.sourceType}`;
    label.title = `${unlocked ? "Lock" : "Unlock"} ${item.name}`;
    label.setAttribute("aria-label", `${unlocked ? "Lock" : "Unlock"} ${item.name}`);

    const images = ctx.actions.renderItemImages(item.images ?? [item.image]);
    label.innerHTML = `
      <input type="checkbox" ${unlocked ? "checked" : ""} aria-label="${unlocked ? "Lock" : "Unlock"} ${ctx.actions.escapeHtml(item.name)}" />
      <div class="unlocked-art">${images}</div>
      <div class="unlocked-copy">
        <h3>${ctx.actions.escapeHtml(item.name)}</h3>
        <span>${ctx.actions.escapeHtml(collectionDisplayTags(item).join(", ") || "No tags")}</span>
      </div>
    `;

    label.querySelector("input").addEventListener("change", (event) => {
      const shouldUnlock = event.target.checked;
      if (!shouldUnlock && !window.confirm(`Are you sure you want to lock ${item.name}?`)) {
        event.target.checked = true;
        return;
      }

      const talentUnlockIds = ctx.data.unlocks
        .filter((unlock) => ctx.state.purchased.includes(unlock.id) && unlockMatchesCollectionItem(unlock, item))
        .map((unlock) => unlock.id);
      ctx.domain.setCollectionItemLocked(item.id, !shouldUnlock, talentUnlockIds);
    });

    return label;
  }

  function refreshCollectionFilterButtons() {
    const target = document.getElementById("collectionFilters");
    if (!target) return;

    target.innerHTML = collectionFilterOptions().map((filter) => {
      const active = filter.type === "mode" ? filter.id === ctx.collectionUi.filterMode : ctx.collectionUi.activeFilters.has(filter.id);
      return `
      <button type="button" data-collection-filter="${filter.id}" class="${active ? "active" : ""}" aria-pressed="${active}">${filter.label}</button>
    `;
    }).join("");

    target.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = COLLECTION_FILTERS.find((definition) => definition.id === button.dataset.collectionFilter);
        if (!filter) return;

        if (filter.type === "mode") {
          ctx.collectionUi.filterMode = filter.id;
          ctx.collectionUi.activeFilters.clear();
        } else {
          ctx.collectionUi.filterMode = "custom";
          if (ctx.collectionUi.activeFilters.has(filter.id)) ctx.collectionUi.activeFilters.delete(filter.id);
          else ctx.collectionUi.activeFilters.add(filter.id);
          if (!ctx.collectionUi.activeFilters.size) ctx.collectionUi.filterMode = "all";
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
      .map((item) => `<option value="${ctx.actions.escapeHtml(item.name)}" label="${ctx.actions.escapeHtml(collectionDisplayTags(item).join(", "))}"></option>`)
      .join("");

    datalist.innerHTML = options;
  }

  function manuallyUnlockSearchSelection() {
    const input = document.getElementById("collectionSearch");
    const value = input?.value ?? "";
    const normalized = normalizeCollectionText(value);
    if (!normalized) return;

    const match = collectionItems().find((item) => normalizeCollectionText(item.name) === normalized);
    if (!match) return;

    ctx.collectionUi.search = match.name;
    if (input) input.value = match.name;
    ctx.domain.setCollectionItemLocked(match.id, false);
  }

  function initCollectionControls() {
    refreshCollectionFilterButtons();
    refreshCollectionSearchDatalist();

    const searchInput = document.getElementById("collectionSearch");
    const unlockButton = document.getElementById("manualUnlockButton");

    searchInput?.addEventListener("input", (event) => {
      ctx.collectionUi.search = event.target.value;
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
      section.innerHTML = `<h3 class="unlocked-group-title">${ctx.actions.escapeHtml(group.category)}</h3><div class="unlocked-grid"></div>`;

      const grid = section.querySelector(".unlocked-grid");
      group.items.forEach((item) => grid.appendChild(renderUnlockCard(item)));

      target.appendChild(section);
    });
  }

  return {
    itemDisplayName,
    itemTagList,
    itemBehaviorList,
    itemImagePath,
    collectionSourceType,
    collectionTagGroups,
    collectionFilterOptions,
    collectionFilterLabel,
    collectionDisplayTag,
    collectionDisplayTags,
    collectionExcluded,
    collectionCategoryFromTags,
    collectionItemFromDefinition,
    collectionItems,
    unlockMatchesCollectionItem,
    shopMatchesCollectionItem,
    challengeCollectionUnlocksItem,
    collectionIsUnlocked,
    initCollectionControls,
    renderUnlocks
  };
}
