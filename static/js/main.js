// ================================
// Main — init + event listeners
// ================================

document.addEventListener("DOMContentLoaded", async () => {

  // ---- 1. Init state ----
  initState();

  // ---- 2. Session check ----
  const ok = await Actions.checkSession();
  if (!ok) return;

  // ---- 3. Load my profile (bio, avatar) ----
  await Users.loadMe();

  // ---- 4. Update my avatar in sidebar footer ----
  updateMyAvatar();

  // ---- 5. Load users ----
  await Users.load();

  // ---- 6. Subscribe to realtime ----
  Messages.subscribe();

  // ---- 7. Search filter ----
  const searchEl = document.getElementById("search");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      UI.renderUserList(e.target.value);
    });
  }

  // ---- 8. Composer ----
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

  // ---- 9. Back button ----
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.onclick = () => UI.closeMobileChat();

  // ---- 10. Logout ----
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => Actions.logout();

  // ---- 11. My Profile button ----
  const myProfileBtn = document.getElementById("myProfileBtn");
  if (myProfileBtn) {
    myProfileBtn.onclick = () => Profile.openMyProfile();
  }

  // ---- 12. Modal close ----
  const modalClose = document.getElementById("modalClose");
  const modalBackdrop = document.getElementById("modalBackdrop");

  if (modalClose) modalClose.onclick = () => Profile.close();
  if (modalBackdrop) modalBackdrop.onclick = () => Profile.close();

  // ESC closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Profile.close();
  });

  // ---- 13. Focus input on desktop ----
  if (!State.isMobile() && input) input.focus();

  console.log("🦖 Baatcheet ready —", State.me.username);
});

// ================================
// Helper — update my avatar in footer
// ================================

function updateMyAvatar() {
  const avatarEl = document.getElementById("myAvatar");
  if (!avatarEl) return;

  const initial = (State.me.username?.[0] || "?").toUpperCase();

  if (State.me.avatar_url) {
    avatarEl.innerHTML = `<img src="${escapeHTML(State.me.avatar_url)}" alt="" />`;
    avatarEl.classList.add("has-image");
  } else {
    avatarEl.textContent = initial;
    avatarEl.classList.remove("has-image");
  }
}
