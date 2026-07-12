import {
  CHALLENGE_CATALOG,
  HARD_CODED_DATA_NOTES,
  PERILOUS_MOONS_REWARD_IDS
} from "./js/config.js";
import { createAppContext, defaultState } from "./js/context.js";
import { createAuth } from "./js/auth.js";
import { createDataLoader } from "./js/data-loader.js";
import { createDomain } from "./js/domain.js";
import { createNavigation } from "./js/navigation.js";
import { createPersistence } from "./js/persistence.js";
import * as firebaseService from "./js/firebase-service.js";
import { createChallengeView } from "./js/views/challenges.js";
import { createCollection } from "./js/views/collection.js";
import { createShopView } from "./js/views/shop.js";
import { createStatsView } from "./js/views/stats.js";
import { createTaskView } from "./js/views/tasks.js";
import { createTalentView } from "./js/views/talents.js";
import { createViewHelpers } from "./js/views/shared.js";

const ctx = createAppContext();
ctx.config = {
  challengeCatalog: CHALLENGE_CATALOG,
  hardCodedDataNotes: HARD_CODED_DATA_NOTES,
  perilousMoonsRewardIds: PERILOUS_MOONS_REWARD_IDS
};

ctx.domain = createDomain(ctx);
Object.assign(ctx.actions, createViewHelpers(ctx));

ctx.collection = createCollection(ctx);
ctx.dataHelpers = createDataLoader(ctx);

const persistence = createPersistence(ctx, firebaseService);
const auth = createAuth(ctx, firebaseService);
const navigation = createNavigation(ctx);
const statsView = createStatsView(ctx);
const taskView = createTaskView(ctx);
const talentView = createTalentView(ctx);
const shopView = createShopView(ctx);
const challengeView = createChallengeView(ctx);

function render() {
  statsView.renderStats();
  taskView.renderPvmChallenges();
  taskView.renderPvpChallenges();
  taskView.renderRepeatables();
  talentView.renderTalentTree();
  shopView.renderShop();
  challengeView.renderChallengeUnlocks();
  ctx.collection.renderUnlocks();
}

Object.assign(ctx.actions, {
  defaultState,
  render,
  ...persistence,
  ...auth,
  ...navigation,
  ...statsView,
  ...taskView,
  ...talentView,
  ...shopView,
  ...challengeView,
  renderUnlocks: ctx.collection.renderUnlocks
});

async function initApp() {
  await ctx.dataHelpers.loadAppData();
  Object.assign(ctx.state, ctx.domain.sanitizeState(ctx.state));
  ctx.collection.initCollectionControls();
  navigation.bindNavigationEvents();
  navigation.showTab("tasks");
  render();
  auth.initFirebaseAuth();

  if (ctx.data.dataWarnings.length) console.warn("Bronzeman data warnings", ctx.data.dataWarnings);
  if (ctx.config.hardCodedDataNotes.length) console.info("Bronzeman hardcoded data notes", ctx.config.hardCodedDataNotes);
}

initApp();
