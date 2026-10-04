// ================================
// State — global app state
// ================================

const State = {

  // ---- Current user (logged in) ----
  me: {
    id: null,        // UUID (string)
    username: null
  },

  // ---- Currently open chat (other user) ----
  activeUser: null,  // { id, username }

  // ---- Users list (from Supabase) ----
  users: [],

  // ---- Messages cache: { userId: [msgs] } ----
  messages: {},

  // ---- Realtime channel ----
  channel: null,

  // ---- UI ----
  isMobile: () => window.innerWidth <= 700
};

// ================================
// Init — load session from storage
// ================================

function initState() {
  State.me.id       = Storage.getUserId();
  State.me.username = Storage.getUsername();

  const meLabel = document.getElementById("meLabel");
  if (meLabel && State.me.username) {
    meLabel.textContent = State.me.username;
  }
}

// ================================
// Reset — on logout
// ================================

function resetState() {
  State.me = { id: null, username: null };
  State.activeUser = null;
  State.users = [];
  State.messages = {};

  if (State.channel) {
    try { supabase.removeChannel(State.channel); } catch {}
    State.channel = null;
  }
}