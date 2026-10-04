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
    .select("id, sender_id, receiver_id, text, image_url, gif_url, sticker_url, image_expired, deleted_for, deleted_for_all, created_at")
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.warn("Failed to load messages:", error.message);
    return;
  }

  // ⭐ Filter out deleted messages
  const msgs = (data || [])
    .filter(m => {
      // Deleted for everyone
      if (m.deleted_for_all) return false;

      // Deleted for me
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
