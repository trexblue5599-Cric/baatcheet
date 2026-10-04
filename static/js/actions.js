// ================================
// Actions — user actions
// ================================

const Actions = {

  // ================================
  // Session check (on page load)
  // ================================
  async checkSession() {
    const session = await Auth.getSession();

    if (!session || !session.user) {
      location.href = "/index.html";
      return false;
    }

    const user = session.user;
    const username = user.user_metadata?.username || "User";

    State.me.id       = user.id;
    State.me.username = username;

    Storage.saveSession({
      username: username,
      userId: user.id
    });

    const meLabel = document.getElementById("meLabel");
    if (meLabel) meLabel.textContent = username;

    return true;
  },

  // ================================
  // Open chat with user
  // ================================
  async openChat(user) {
    if (!user) return;

    State.activeUser = user;

    UI.setHeader(user);

    if (State.isMobile()) UI.openMobileChat();

    UI.renderUserList(document.getElementById("search")?.value || "");

    await Messages.load(user.id);

    setTimeout(() => {
      document.getElementById("messageInput")?.focus();
    }, 100);
  },

  // ================================
  // Send message
  // ================================
  async send(text) {
    await Messages.send(text);
  },

  // ================================
  // Logout
  // ================================
  async logout() {
    if (!confirm("Logout karna hai?")) return;

    await Auth.logout();
    location.href = "/index.html";
  }
};