// ================================
// Messages — Supabase realtime chat
// ================================

const Messages = {

  // ================================
  // Load conversation
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
      .select("id, sender_id, receiver_id, text, image_url, gif_url, sticker_url, image_expired, deleted_for, deleted_for_all, created_at")
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.warn("Failed to load messages:", error.message);
      return;
    }

    const msgs = (data || [])
      .filter(m => {
        if (m.deleted_for_all) return false;

        let deletedFor = m.deleted_for || [];
        if (typeof deletedFor === "string") {
          try { deletedFor = JSON.parse(deletedFor); } catch { deletedFor = []; }
        }
        if (Array.isArray(deletedFor) && deletedFor.includes(myId)) {
          return false;
        }

        return true;
      })
      .map(m => ({
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
  async send(text, extra = {}) {
    text = (text || "").trim();

    if (!State.activeUser) return;

    const hasGif     = !!extra.gif_url;
    const hasImage   = !!extra.image_url;
    const hasSticker = !!extra.sticker_url;

    if (!text && !hasGif && !hasImage && !hasSticker) return;

    const receiverId = State.activeUser.id;

    const tempMsg = {
      id: "temp-" + Date.now(),
      sender_id: State.me.id,
      sender_name: State.me.username,
      receiver_id: receiverId,
      text: text,
      image_url: extra.image_url || "",
      gif_url: extra.gif_url || "",
      sticker_url: extra.sticker_url || "",
      created_at: new Date().toISOString(),
      _temp: true
    };

    if (!State.messages[receiverId]) State.messages[receiverId] = [];
    State.messages[receiverId].push(tempMsg);

    UI.appendMessage(tempMsg);
    UI.renderUserList(document.getElementById("search")?.value || "");

    const payload = {
      sender_id: State.me.id,
      receiver_id: receiverId,
      text: text || ""
    };

    if (hasGif)     payload.gif_url = extra.gif_url;
    if (hasImage)   payload.image_url = extra.image_url;
    if (hasSticker) payload.sticker_url = extra.sticker_url;

    const { data, error } = await sb
      .from("messages")
      .insert(payload)
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

    if (hasImage && typeof Photos !== "undefined") {
      Photos.cleanupChat(receiverId).catch(() => {});
    }
  },

  // ================================
  // Realtime subscribe
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
  // Handle incoming
  // ================================
  _onNewMessage(m) {
    const myId = State.me.id;

    if (m.sender_id !== myId && m.receiver_id !== myId) return;

    if (m.deleted_for_all) return;

    const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;

    if (!State.messages[otherId]) State.messages[otherId] = [];

    const existingIdx = State.messages[otherId].findIndex(x =>
      x.id === m.id ||
      (x._temp && x.sender_id === m.sender_id && x.text === m.text)
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
  // Helper
  // ================================
  _nameOf(userId) {
    const u = State.users.find(x => x.id === userId);
    return u ? u.username : null;
  }
};
