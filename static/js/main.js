// ================================
// Main — init + event listeners
// ================================

document.addEventListener("DOMContentLoaded", async () => {

  // ---- 1. Init state ----
  initState();

  // ---- 2. Session check ----
  const ok = await Actions.checkSession();
  if (!ok) return;

  // ---- 3. Load users ----
  await Users.load();

  // ---- 4. Subscribe to realtime messages ----
  Messages.subscribe();

  // ---- 5. Search filter ----
  const searchEl = document.getElementById("search");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      UI.renderUserList(e.target.value);
    });
  }

  // ---- 6. Composer: send message ----
  const composer = document.getElementById("composer");
  const input    = document.getElementById("messageInput");

  if (composer && input) {
    composer.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value;
      input.value = "";
      Actions.send(text);
    });
  }

  // ---- 7. Back button (mobile) ----
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.onclick = () => UI.closeMobileChat();
  }

  // ---- 8. Logout button ----
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => Actions.logout();
  }

  // ---- 9. Focus input on desktop ----
  if (!State.isMobile() && input) {
    input.focus();
  }

  console.log("🦖 Baatcheet ready —", State.me.username);
});