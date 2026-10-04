// ================================
// Delete — delete message feature
// ================================

const Delete = {

  // Current long-press state
  _longPressTimer: null,
  _currentMessageId: null,
  _currentSenderId: null,
  _currentOtherId: null,

  // ================================
  // Attach long-press + right-click to message
  // ================================
  attachHandlers() {
    const messagesEl = document.getElementById("messages");
    if (!messagesEl) return;

    // Remove old listeners (avoid duplicates)
    if (this._delegated) return;

    // ---- Long press (mobile) ----
    messagesEl.addEventListener("touchstart", (e) => {
      const msgEl = e.target.closest(".message");
      if (!msgEl || msgEl.classList.contains("system")) return;

      this._startLongPress(msgEl);
    }, { passive: true });

    messagesEl.addEventListener("touchend", () => {
      this._cancelLongPress();
    });

    messagesEl.addEventListener("touchmove", () => {
      this._cancelLongPress();
    });

    // ---- Right-click (desktop) ----
    messagesEl.addEventListener("contextmenu", (e) => {
      const msgEl = e.target.closest(".message");
      if (!msgEl || msgEl.classList.contains("system")) return;

      e.preventDefault();
      this._openMenu(msgEl);
    });

    this._delegated = true;
  },

  // ================================
  // Long press start
  // ================================
  _startLongPress(msgEl) {
    this._cancelLongPress();

    this._longPressTimer = setTimeout(() => {
      // Haptic feedback (vibrate)
      if (navigator.vibrate) navigator.vibrate(30);

      this._openMenu(msgEl);
    }, 500); // 500ms hold
  },

  _cancelLongPress() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  },

  // ================================
  // Open delete menu
  // ================================
  _openMenu(msgEl) {
    const messageId = msgEl.dataset.messageId;
    const senderId = msgEl.dataset.senderId;

    if (!messageId) {
      console.warn("No message id");
      return;
    }

    this._currentMessageId = messageId;
    this._currentSenderId = senderId;
    this._currentOtherId = State.activeUser?.id;

    const isMine = senderId === State.me.id;

    // Build modal
    const modal = document.getElementById("deleteModal");
    if (!modal) return;

    const deleteEveryoneBtn = document.getElementById("deleteEveryoneBtn");

    // Show/hide "Delete for everyone" based on ownership
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

    // Get current message
    const msg = State.messages[otherId]?.find(m => m.id === msgId);
    if (!msg) return;

    // Get existing deleted_for array
    let deletedFor = msg.deleted_for || [];
    if (typeof deletedFor === "string") {
      try { deletedFor = JSON.parse(deletedFor); } catch { deletedFor = []; }
    }
    if (!Array.isArray(deletedFor)) deletedFor = [];

    // Add my id if not present
    if (!deletedFor.includes(State.me.id)) {
      deletedFor.push(State.me.id);
    }

    // Update in database
    const { error } = await sb
      .from("messages")
      .update({ deleted_for: deletedFor })
      .eq("id", msgId);

    if (error) {
      console.error("Delete failed:", error);
      alert("Delete nahi hua. Try again.");
      return;
    }

    // Remove from local state
    const list = State.messages[otherId];
    const idx = list.findIndex(m => m.id === msgId);
    if (idx !== -1) list.splice(idx, 1);

    // Re-render
    UI.renderMessages(list);
  },

  // ================================
  // Delete for everyone (sender only)
  // ================================
  async deleteForEveryone() {
    const msgId = this._currentMessageId;
    const otherId = this._currentOtherId;
    if (!msgId) return;

    // Double check: only sender can delete for everyone
    if (this._currentSenderId !== State.me.id) {
      alert("Ye message tumhara nahi hai");
      this.closeMenu();
      return;
    }

    // Confirm
    if (!confirm("Sabke liye delete karna hai? Ye undo nahi hoga.")) {
      return;
    }

    this.closeMenu();

    // Get message
    const msg = State.messages[otherId]?.find(m => m.id === msgId);
    if (!msg) return;

    // If photo, delete from storage
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

    // Mark as deleted for all + clear content
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

    // Remove from local state
    const list = State.messages[otherId];
    const idx = list.findIndex(m => m.id === msgId);
    if (idx !== -1) list.splice(idx, 1);

    // Re-render
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
