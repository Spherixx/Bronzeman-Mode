import { STORAGE_KEY } from "./config.js";

export function createPersistence(ctx, firebaseService) {
  function serializeState() {
    return ctx.domain.sanitizeState(ctx.state);
  }

  function writeLocalState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
  }

  function setSaveStatus(message) {
    const status = document.getElementById("saveStatus");
    if (status) status.textContent = message;
  }

  function queueCloudSave() {
    if (!ctx.auth.currentUser || ctx.auth.isApplyingRemoteState) return;

    setSaveStatus("Saving to cloud...");
    window.clearTimeout(ctx.auth.saveTimer);
    ctx.auth.saveTimer = window.setTimeout(() => {
      saveCloudState();
    }, 650);
  }

  function saveState() {
    writeLocalState();
    queueCloudSave();
  }

  async function saveCloudState() {
    if (!ctx.auth.currentUser) return;

    try {
      await firebaseService.saveTrackerState({
        ...serializeState(),
        displayName: ctx.auth.currentUser.displayName ?? "",
        photoURL: ctx.auth.currentUser.photoURL ?? ""
      });
      setSaveStatus("Saved to cloud");
    } catch (error) {
      console.error("Cloud save failed", error);
      setSaveStatus("Saved locally");
    }
  }

  async function loadCloudState(user) {
    setSaveStatus("Loading cloud save...");

    try {
      const remoteState = await firebaseService.loadTrackerState();
      const nextState = remoteState ? ctx.domain.mergeStates(ctx.state, remoteState) : serializeState();

      ctx.auth.isApplyingRemoteState = true;
      Object.assign(ctx.state, nextState);
      writeLocalState();
      ctx.actions.render();
      ctx.auth.isApplyingRemoteState = false;

      await saveCloudState(user);
    } catch (error) {
      console.error("Cloud load failed", error);
      ctx.auth.isApplyingRemoteState = false;
      setSaveStatus("Saved locally");
    }
  }

  return {
    serializeState,
    writeLocalState,
    saveState,
    saveCloudState,
    loadCloudState,
    setSaveStatus
  };
}
