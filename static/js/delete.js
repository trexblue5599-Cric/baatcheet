// ================================
// Delete — select + bulk delete
// ================================

const Delete = {

  selecting: false,
  selectedIds: [],
  _delegated: false,

  // ================================
  // Toggle select mode
  // ================================
  toggleSelectMode() {
    if (!State.activeUser) {
      alert("Pehle chat kholo");
      return;
    }

    this.selecting = !this.selecting;
    this.selectedIds = [];

    const body = document.body;
    const messagesEl = document.getElementById("messages");

    if (this.selecting) {
      body.classList.add("select-mode");
      if (messagesEl) messagesEl.classList.add("select-mode");
      this._updateHeader();
    } else {
      body.classList.remove("select-mode");
      if (messagesEl) messagesEl.classList.remove("select-mode");
      this._clearSelectionUI();
    }
  },

  // ================================
  // Attach tap handlers
  // ================================
  attachHandlers() {
    const messagesEl = document.getElementById("messages");
    if (!messagesEl) return;
    if (this._delegated) return;

    messagesEl.addEventListener("click", (e) => {
      if (!this.selecting) return;

      const msgEl = e.target.closest(".message");
      if (!msgEl || msgEl.classList.contains("system")) return;

      const id = msgEl.dataset.messageId;
      if (!id) return;

      this._toggleSelect(id, msgEl);
    });

    this._delegated = true;
  },

  // ================================
  // Toggle selection
  // ================================
  _toggleSelect(id, msgEl) {
    const idx = this.selectedIds.indexOf(id);

    if (idx === -1) {
      this.selectedIds.push(id);
      msgEl.classList.add("selected");
    } else {
      this.selectedIds.splice(idx, 1);
      msgEl.classList.remove("selected");
    }

    this._updateHeader();
  },

  // ================================
  // Update top header
  // ================================
  _updateHeader() {
    const banner = document.getElementById("selectBanner");
    if (!banner) return;

    if (!this.selecting) {
      banner.classList.remove("show");
      return;
    }

    banner.classList.add("show");

    const countEl = document.getElementById("selectCount");
    if (countEl) {
      countEl.textContent = `${this.selectedIds.length} selected`;
    }

    const deleteBtn = document.getElementById("selectDeleteBtn");
    if (deleteBtn) {
      deleteBtn.disabled = this.selectedIds.length === 0;
    }
  },

  // ================================
  // Clear UI selection
  // ================================
  _clearSelectionUI() {
    document.querySelectorAll(".message.selected").forEach(el => {
      el.classList.remove("selected");
    });

    const banner = document.getElementById("selectBanner");
    if (banner) banner.classList.remove("show");

    this.selectedIds = [];
  },

  // ================================
  // Delete selected (permanent)
  // ================================
  async deleteSelected() {
    if (this.selectedIds.length === 0) return;

    const count = this.selectedIds.length;

    if (!confirm(`${count} message${count > 1 ? "s" : ""} permanently delete karne hain? Ye undo nahi hoga.`)) {
      return;
    }

    const otherId = State.activeUser?.id;
    if (!otherId) return;

    const deleteBtn = document.getElementById("selectDeleteBtn");
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";
    }

    try {
      for (const msgId of this.selectedIds) {
        await this._deleteOne(msgId, otherId);
      }

      const list = State.messages[otherId] || [];
      State.messages[otherId] = list.filter(m =>
        !this.selectedIds.includes(String(m.id))
      );

      this.toggleSelectMode();

      UI.renderMessages(State.messages[otherId]);
      UI.renderUserList(document.getElementById("search")?.value || "");

    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete fail hua. Try again.");
    } finally {
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = "Delete";
      }
    }
  },

  // ================================
  // Delete single message
  // ================================
  async _deleteOne(msgId, otherId) {
    const msg = State.messages[otherId]?.find(m => String(m.id) === String(msgId));

    if (msg && msg.image_url) {
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
      .delete()
      .eq("id", msgId);

    if (error) {
      console.error("DB delete failed:", error);
      throw error;
    }
  },

  // ================================
  // Cancel
  // ================================
  cancel() {
    if (this.selecting) {
      this.toggleSelectMode();
    }
  }
};
