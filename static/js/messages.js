// ================================
// Messages — Supabase realtime chat
// ================================

const Messages = {

  // ================================
  // Load conversation with a user
  // ================================
  async load(otherId) {
    if (State.messages[otherId]) {
      UI.renderMessages(State.messages[otherId]);
    } else {
      UI.renderMessages([]);
    }

    const myId = State.me.id;

    const { data, error } = await sb
      .from("messages")
      .select("id, sender_id, receiver_id, text, created_at")
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.warn("Failed to load messages:", error.message);
      return;
    }

    const msgs = (data || []).map(m => ({
      ...m,
      sender_name: m.sender_id === myId ? State.me.username : this._nameOf(otherId)
    }));

    State.messages[otherId] = msgs;

    if (State.activeUser && State.activeUser.id === otherId) {
      UI.renderMessages(msgs);
    }
  },

  // ================================
  // Send message
  // ================================
  async send(text) {
    text = (text || "").trim();
    if (!text || !State.activeUser) return;

    const receiverId = State.activeUser.id;

    const tempMsg = {
      id: "temp-" + Date.now(),
      sender_id: State.me.id,
      sender_name: State.me.username,
      receiver_id: receiverId,
      text: text,
      created_at: new Date().toISOString(),
      _temp: true
    };

    if (!State.messages[receiverId]) State.messages[receiverId] = [];
    State.messages[receiverId].push(tempMsg);

    UI.appendMessage(tempMsg);
    UI.renderUserList(document.getElementById("search")?.value || "");

    const { data, error } = await sb
      .from("messages")
      .insert({
        sender_id: State.me.id,
        receiver_id: receiverId,
        text: text
      })
      .select()
      .single();

    if (error) {
      console.error("Send failed:", error.message);
      UI.appendMessage({
        type: "system",
        text: "❌ Message failed to send"
      });
      return;
    }

    const list = State.messages[receiverId];
    const idx = list.findIndex(m => m.id === tempMsg.id);
    if (idx !== -1) {
      list[idx] = { ...data, sender_name: State.me.username };
    }
  },

  // ================================
  // Realtime — subscribe to new messages
  // ================================
  subscribe() {
    if (State.channel) return;

    State.channel = sb
      .channel("baatcheet-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        (payload) => this._onNewMessage(payload.new)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime connected");
        }
      });
  },

  // ================================
  // Handle incoming message
  // ================================
  _onNewMessage(m) {
    const myId = State.me.id;

    if (m.sender_id !== myId && m.receiver_id !== myId) return;

    const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;

    if (!State.messages[otherId]) State.messages[otherId] = [];

    const existingIdx = State.messages[otherId].findIndex(x =>
      x.id === m.id ||
      (x._temp && x.text === m.text && x.sender_id === m.sender_id)
    );

    let senderName;
    if (m.sender_id === myId) {
      senderName = State.me.username;
    } else {
      senderName = this._nameOf(otherId) || State.activeUser?.username || "User";
    }

    const msg = { ...m, sender_name: senderName };

    if (existingIdx !== -1) {
      State.messages[otherId][existingIdx] = msg;
    } else {
      State.messages[otherId].push(msg);
    }

    if (State.activeUser && State.activeUser.id === otherId) {
      UI.renderMessages(State.messages[otherId]);
    }

    UI.renderUserList(document.getElementById("search")?.value || "");
  },

  // ================================
  // Helper — username by id
  // ================================
  _nameOf(userId) {
    const u = State.users.find(x => x.id === userId);
    return u ? u.username : null;
  }
};
