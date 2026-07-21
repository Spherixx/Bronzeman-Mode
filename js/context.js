import { STORAGE_KEY } from "./config.js";

export function defaultState() {
  return {
    completed: [],
    purchased: [],
    shopPurchases: {},
    repeatablePurchases: {},
    basicUnlocks: [],
    lockedItems: [],
    challengeCompletions: {},
    challengeRewardUnlocks: [],
    challengeRolls: {},
    playerKills: 0
  };
}

function loadLocalState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState(), ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return defaultState();
  }
}

export function createAppContext() {
  return {
    state: loadLocalState(),
    data: {
      challenges: { pvm: [], pvp: [] },
      challengeCatalog: [],
      unlocks: [],
      shopCategories: [],
      shopItems: [],
      itemDefinitions: [],
      dataWarnings: []
    },
    indexes: {
      challengeIdAliases: {},
      repeatableIdAliases: {},
      itemRowsByUid: new Map(),
      itemRowsByItemId: new Map(),
      itemRowsByName: new Map(),
      itemRowsBySetUid: new Map()
    },
    auth: {
      currentUser: null,
      saveTimer: null,
      isApplyingRemoteState: false
    },
    collectionUi: {
      filterMode: "all",
      activeFilters: new Set(),
      search: ""
    },
    challengeUi: {
      rewardDisplayOrders: {},
      activeRoll: null,
      countdownTimer: null
    },
    domain: {},
    collection: {},
    actions: {}
  };
}
