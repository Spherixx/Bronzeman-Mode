export function createAuth(ctx, firebaseService) {
  function renderAuthUser(user) {
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    const userPanel = document.getElementById("userPanel");
    const userPhoto = document.getElementById("userPhoto");
    const userName = document.getElementById("userName");

    if (!loginButton || !userPanel || !userPhoto || !userName) return;

    loginButton.hidden = Boolean(user);
    userPanel.hidden = !user;
    if (logoutButton) logoutButton.hidden = !user;

    if (!user) {
      userPhoto.removeAttribute("src");
      userName.textContent = "";
      return;
    }

    userPhoto.src = user.photoURL ?? "";
    userName.textContent = user.displayName ?? user.email ?? "Signed in";
  }

  function setSettingsOpen(open) {
    const settingsButton = document.getElementById("settingsButton");
    const settingsMenu = document.getElementById("settingsMenu");

    if (!settingsButton || !settingsMenu) return;

    settingsMenu.hidden = !open;
    settingsButton.setAttribute("aria-expanded", String(open));
  }

  function initFirebaseAuth() {
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    const settingsButton = document.getElementById("settingsButton");
    const settingsMenu = document.getElementById("settingsMenu");

    settingsButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      setSettingsOpen(settingsMenu?.hidden ?? true);
    });

    settingsMenu?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", () => setSettingsOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setSettingsOpen(false);
    });

    loginButton?.addEventListener("click", async () => {
      loginButton.disabled = true;
      ctx.actions.setSaveStatus("Opening Google login...");

      try {
        await firebaseService.signInWithGoogle();
      } catch (error) {
        console.error("Google login failed", error);
        ctx.actions.setSaveStatus("Saved locally");
      } finally {
        loginButton.disabled = false;
      }
    });

    logoutButton?.addEventListener("click", async () => {
      setSettingsOpen(false);

      try {
        await firebaseService.signOutCurrentUser();
      } catch (error) {
        console.error("Sign out failed", error);
      }
    });

    firebaseService.subscribeToAuthChanges(async (user) => {
      ctx.auth.currentUser = user;
      renderAuthUser(user);

      if (!user) {
        ctx.actions.setSaveStatus("Saved locally");
        return;
      }

      await ctx.actions.loadCloudState(user);
    });
  }

  return {
    initFirebaseAuth,
    setSettingsOpen,
    renderAuthUser
  };
}
