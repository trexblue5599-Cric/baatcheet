// ================================
// Delete — delete message feature
// ================================

const Delete = {

  _longPressTimer: null,
  _currentMessageId: null,
  _currentSenderId: null,
  _currentOtherId: null,
  _delegated: false,

  // ================================
  // Attach handlers
  // ================================
  attachHandlers() {
    const messagesEl = document.getElementById("messages");
    if (!messagesEl) return;
    if (this._delegated) return;

    messagesEl.addEventListener("touchstart", (e) => {
      const msgEl = e.target.closest(".message");
      if (!msgEl || msgEl.classList.contains("system")) return;

      e.preventDefault();

      this._startLongPress(msgEl, e);
    }, { passive: false });

    messagesEl.addEventListener("touchend", () => this._cancelLongPress());
    messagesEl.addEventListener("touchmove", () => this._cancelLongPress());

    messagesEl.addEventListener("contextmenu", (e) => {
      const msgEl = e.target.closest(".message");
      if (!msgEl || msgEl.classList.contains("system")) return;

      e.preventDefault();
      this._openMenu(msgEl);
    });

    this._delegated = true;
  },

  // ================================
  // Start long press
  // ================================
  _startLongPress(msgEl, event) {
    this._cancelLongPress();

    if (event && event.preventDefault) {
      event.preventDefault();
    }

    this._longPressTimer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(30);
      this._openMenu(msgEl);
    }, 500);
  },

  // ================================
  // Cancel long press
  // ================================
  _cancelLongPress() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  },

  // ================================
  // Open menu
  // ================================
  _openMenu(msgEl) {
    const messageId = msgEl.dataset.messageId;
    const senderId = msgEl.dataset.senderId;

    if (!messageId) return;

    this._currentMessageId = messageId;
    this._currentSenderId = senderId;
    this._currentOtherId = State.activeUser?.id;

    const isMine = senderId === State.me.id;

    const modal = document.getElementById("deleteModal");
    if (!modal) return;

    const deleteEveryoneBtn = document.getElementById("deleteEveryoneBtn");

    if (isMine) {
      deleteEveryoneBtn.style.display = "flex";
    } else {
      deleteEveryoneBtn.style.display = "none";
    }

    modal.classList.add("show");
  },

  // ================================
  // Delete for me
  // ================================
  async deleteForMe() {
    const msgId = this._currentMessageId;
    const otherId = this._currentOtherId;
    if (!msgId) return;

    this.closeMenu();

    const msg = State.messages[otherId]?.find(m => m.id === msgId);
    if (!msg) return;

    let deletedFor = msg.deleted_for || [];
    if (typeof deletedFor === "string") {
      try { deletedFor = JSON.parse(deletedFor); } catch { deletedFor = []; }
    }
    if (!Array.isArray(deletedFor)) deletedFor = [];

    if (!deletedFor.includes(State.me.id)) {
      deletedFor.push(State.me.id);
    }

    const { error } = await sb
      .from("messages")
      .update({ deleted_for: deletedFor })
      .eq("id", msgId);

    if (error) {
      console.error("Delete failed:", error);
      alert("Delete nahi hua. Try again.");
      return;
    }

    const list = State.messages[otherId];
    const idx = list.findIndex(m => m.id === msgId);
    if (idx !== -1) list.splice(idx, 1);

    UI.renderMessages(list);
  },

  // ================================
  // Delete for everyone
  // ================================
  async deleteForEveryone() {
    const msgId = this._currentMessageId;
    const otherId = this._currentOtherId;
    if (!msgId) return;

    if (this._currentSenderId !== State.me.id) {
      alert("Ye message tumhara nahi hai");
      this.closeMenu();
      return;
    }

    if (!confirm("Sabke liye delete karna hai? Ye undo nahi hoga.")) {
      return;
    }

    this.closeMenu();

    const msg = State.messages[otherId]?.find(m => m.id === msgId);
    if (!msg) return;

    if (msg.image_url) {
      try {
        const url = msg.image_url;
        const idx = url.indexOf("/photos/");
        if (idx !== -1) {
          const path = url.slice(idx + "/photos/".length);
          await sb.storage.from("photos").remove([path]);
        }
      } catch (e) {
        console.warn("Storage delete failed:", e);
      }
    }

    const { error } = await sb
      .from("messages")
      .update({
        deleted_for_all: true,
        text: "",
        image_url: "",
        gif_url: "",
        sticker_url: ""
      })
      .eq("id", msgId);

    if (error) {
      console.error("Delete failed:", error);
      alert("Delete nahi hua. Try again.");
      return;
    }

    const list = State.messages[otherId];
    const idx = list.findIndex(m => m.id === msgId);
    if (idx !== -1) list.splice(idx, 1);

    UI.renderMessages(list);
  },

  // ================================
  // Close menu
  // ================================
  closeMenu() {
    const modal = document.getElementById("deleteModal");
    if (modal) modal.classList.remove("show");
    this._currentMessageId = null;
    this._currentSenderId = null;
    this._currentOtherId = null;
  }
};
