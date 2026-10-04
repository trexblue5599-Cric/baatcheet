// ================================
// Main — init + event listeners
// ================================

document.addEventListener("DOMContentLoaded", async () => {

  // ---- 1. Init state ----
  initState();

  // ---- 2. Session check ----
  const ok = await Actions.checkSession();
  if (!ok) return;

  // ---- 3. Load my profile ----
  await Users.loadMe();

  // ---- 4. Update my avatar ----
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

      // Block send if select mode is on
      if (Delete.selecting) return;

      const text = input.value;
      input.value = "";
      Actions.send(text);
    });
  }

  // ---- 9. Back button ----
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.onclick = () => {
    if (Delete.selecting) {
      Delete.cancel();
      return;
    }
    UI.closeMobileChat();
  };

  // ---- 10. Logout ----
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => Actions.logout();

  // ---- 11. My Profile ----
  const myProfileBtn = document.getElementById("myProfileBtn");
  if (myProfileBtn) {
    myProfileBtn.onclick = () => Profile.openMyProfile();
  }

  // ---- 12. Profile modal close ----
  const modalClose = document.getElementById("modalClose");
  const modalBackdrop = document.getElementById("modalBackdrop");

  if (modalClose) modalClose.onclick = () => Profile.close();
  if (modalBackdrop) modalBackdrop.onclick = () => Profile.close();

  // ---- 13. GIF button ----
  const gifBtn = document.getElementById("gifBtn");
  if (gifBtn) {
    gifBtn.onclick = () => {
      if (!State.activeUser) {
        alert("Pehle kisi user se chat kholo");
        return;
      }
      if (Delete.selecting) return;
      GIFS.open();
    };
  }

  // ---- 14. GIF panel close ----
  const gifClose = document.getElementById("gifClose");
  const gifBackdrop = document.getElementById("gifBackdrop");

  if (gifClose) gifClose.onclick = () => GIFS.close();
  if (gifBackdrop) gifBackdrop.onclick = () => GIFS.close();

  // ---- 15. Photo button ----
  const photoBtn = document.getElementById("photoBtn");
  const photoInput = document.getElementById("photoInput");

  if (photoBtn) {
    photoBtn.onclick = () => {
      if (!State.activeUser) {
        alert("Pehle kisi user se chat kholo");
        return;
      }
      if (Delete.selecting) return;
      Photos.pick();
    };
  }

  if (photoInput) {
    photoInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) Photos.handleFile(file);
      photoInput.value = "";
    };
  }

  // ---- 16. Trash button — toggle select mode ----
  const trashBtn = document.getElementById("trashBtn");
  if (trashBtn) {
    trashBtn.onclick = () => {
      if (!State.activeUser) {
        alert("Pehle kisi user se chat kholo");
        return;
      }
      Delete.toggleSelectMode();
    };
  }

  // ---- 17. Select banner buttons ----
  const selectCancelBtn = document.getElementById("selectCancelBtn");
  const selectDeleteBtn = document.getElementById("selectDeleteBtn");

  if (selectCancelBtn) {
    selectCancelBtn.onclick = () => Delete.cancel();
  }

  if (selectDeleteBtn) {
    selectDeleteBtn.onclick = () => Delete.deleteSelected();
  }

  // ---- 18. Attach message click handlers ----
  Delete.attachHandlers();

  // ---- 19. ESC key ----
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      Profile.close();
      GIFS.close();
      if (Delete.selecting) {
        Delete.cancel();
        return;
      }
      UI.closeMobileChat();
    }
  });

  // ---- 20. Focus input on desktop ----
  if (!State.isMobile() && input) input.focus();

  console.log("🦖 Baatcheet ready —", State.me.username);
});

// ================================
// Helper
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
