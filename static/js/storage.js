// ================================
// Storage — localStorage wrapper
// ================================

const Storage = {

  KEY_USERNAME: "baatcheet-username",
  KEY_USER_ID:  "baatcheet-user-id",

  getUsername() {
    return localStorage.getItem(this.KEY_USERNAME);
  },
  setUsername(name) {
    if (!name) return;
    localStorage.setItem(this.KEY_USERNAME, name);
  },

  getUserId() {
    const v = localStorage.getItem(this.KEY_USER_ID);
    return v || null;   // UUID string
  },
  setUserId(id) {
    if (!id) return;
    localStorage.setItem(this.KEY_USER_ID, String(id));
  },

  saveSession({ username, userId }) {
    if (username) this.setUsername(username);
    if (userId)   this.setUserId(userId);
  },

  clear() {
    localStorage.removeItem(this.KEY_USERNAME);
    localStorage.removeItem(this.KEY_USER_ID);
  }
};