// ================================
// Auth — Supabase register/login
// ================================

const Auth = {

  // ================================
  // Register new user
  // ================================
  async register(username, password) {
    username = (username || "").trim();
    password = password || "";

    // ---- Validation ----
    if (!username || username.length < 3) {
      return { ok: false, error: "Username kam se kam 3 characters" };
    }
    if (username.length > 20) {
      return { ok: false, error: "Username 20 characters se zyada nahi" };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { ok: false, error: "Sirf letters, numbers, underscore allowed" };
    }
    if (!password || password.length < 4) {
      return { ok: false, error: "Password kam se kam 4 characters" };
    }
    if (password.length > 100) {
      return { ok: false, error: "Password bahut lamba hai" };
    }

    // ---- Fake email (Supabase needs email, we use username) ----
    const email = `${username.toLowerCase()}@baatcheet.local`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      return { ok: false, error: this._cleanError(error.message) };
    }

    if (!data.user) {
      return { ok: false, error: "Account nahi ban paya. Phir try karo." };
    }

    return {
      ok: true,
      user: data.user,
      session: data.session
    };
  },

  // ================================
  // Login existing user
  // ================================
  async login(username, password) {
    username = (username || "").trim().toLowerCase();
    password = password || "";

    if (!username || !password) {
      return { ok: false, error: "Username aur password dono chahiye" };
    }

    const email = `${username}@baatcheet.local`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { ok: false, error: "Galat username ya password" };
    }

    return {
      ok: true,
      user: data.user,
      session: data.session
    };
  },

  // ================================
  // Logout
  // ================================
  async logout() {
    await supabase.auth.signOut();
    Storage.clear();
    resetState();
  },

  // ================================
  // Get current session
  // ================================
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // ================================
  // Get profile from DB
  // ================================
  async getMyProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .single();

    if (error) return null;
    return data;
  },

  // ================================
  // Clean Supabase error messages
  // ================================
  _cleanError(msg) {
    if (!msg) return "Kuch galat ho gaya";

    const m = msg.toLowerCase();

    if (m.includes("already") || m.includes("registered")) {
      return "Username already taken";
    }
    if (m.includes("password")) {
      return "Password kamzor hai";
    }
    if (m.includes("email")) {
      return "Username invalid";
    }
    if (m.includes("rate") || m.includes("limit")) {
      return "Bahut jaldi try kar raha hai. Thoda ruk.";
    }

    return "Kuch galat ho gaya. Phir try karo.";
  }
};