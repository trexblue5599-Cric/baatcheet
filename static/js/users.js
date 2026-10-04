// ================================
// Users — Supabase se user list
// ================================

const Users = {

  // ================================
  // Load all users (except me)
  // ================================
  async load() {
    if (!State.me.id) {
      console.warn("No user id — login first");
      return;
    }

    const { data, error } = await sb
      .from("profiles")
      .select("id, username")
      .neq("id", State.me.id)
      .order("username", { ascending: true });

    if (error) {
      console.warn("Failed to load users:", error.message);
      return;
    }

    State.users = data || [];
    UI.renderUserList(document.getElementById("search")?.value || "");
  },

  // ================================
  // Find user by id (from cache)
  // ================================
  findById(id) {
    return State.users.find(u => u.id === id);
  },

  // ================================
  // Get username by id
  // ================================
  nameOf(id) {
    const u = this.findById(id);
    return u ? u.username : "User";
  },

  // ================================
  // Refresh user list
  // ================================
  async refresh() {
    await this.load();
  }
};
