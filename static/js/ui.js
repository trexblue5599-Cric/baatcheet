// ================================
// UI — render functions
// ================================

const UI = {

  // ================================
  // Chat list (sidebar) — user cards
  // ================================
  renderUserList(filter = "") {
    const el = document.getElementById("chatList");
    if (!el) return;

    el.innerHTML = "";

    const q = filter.trim().toLowerCase();
    const users = (State.users || []).filter(u =>
      u.username.toLowerCase().includes(q)
    );

    if (users.length === 0) {
      el.innerHTML = `
        <li style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">
          ${q ? "No users found" : "No other users yet"}
        </li>`;
      return;
    }

    users.forEach(user => {
      const isActive = State.activeUser && State.activeUser.id === user.id;

      const li = document.createElement("li");
      li.className = "chat-item" + (isActive ? " active" : "");
      li.dataset.userId = user.id;

      const initial = (user.username[0] || "?").toUpperCase();
      const msgs = State.messages[user.id] || [];
      const last = msgs[msgs.length - 1];
      const preview = last
        ? (last.text.length > 30 ? last.text.slice(0, 30) + "…" : last.text)
        : (user.bio || "Tap to chat");

      // Avatar — image or initial
      const avatarHTML = user.avatar_url
        ? `<div class="avatar has-image"><img src="${escapeHTML(user.avatar_url)}" alt="" /></div>`
        : `<div class="avatar">${escapeHTML(initial)}</div>`;

      li.innerHTML = `
        ${avatarHTML}
        <div class="chat-item-info">
          <h3>${escapeHTML(user.username)}</h3>
          <p>${escapeHTML(preview)}</p>
        </div>
      `;

      li.onclick = () => Actions.openChat(user);
      el.appendChild(li);
    });
  },

  // ================================
  // Render all messages
  // ================================
  renderMessages(messages) {
    const el = document.getElementById("messages");
    if (!el) return;

    el.innerHTML = "";

    if (!messages || messages.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-glow"></div>
          <p>Say hi 👋</p>
        </div>`;
      return;
    }

    messages.forEach(m => this.appendMessage(m));
    this.scrollToBottom();
  },

  // ================================
  // Append single message
  // ================================
  appendMessage(m) {
    const el = document.getElementById("messages");
    if (!el) return;

    const empty = el.querySelector(".empty-state");
    if (empty) empty.remove();

    const div = document.createElement("div");

    if (m.type === "system") {
      div.className = "message system";
      div.textContent = m.text;
      el.appendChild(div);
      this.scrollToBottom();
      return;
    }

    const mine = m.sender_id === State.me.id;
    div.className = "message " + (mine ? "me" : "them");

    if (mine) {
      div.innerHTML = `
        ${escapeHTML(m.text)}
        <span class="time">${formatTime(m.created_at)}</span>
      `;
    } else {
      // Dost ka avatar (chhota)
      const other = State.activeUser || {};
      const initial = (other.username?.[0] || "?").toUpperCase();
      const avatarHTML = other.avatar_url
        ? `<div class="msg-avatar has-image"><img src="${escapeHTML(other.avatar_url)}" alt="" /></div>`
        : `<div class="msg-avatar">${escapeHTML(initial)}</div>`;

      div.innerHTML = `
        <div class="msg-row">
          ${avatarHTML}
          <div class="msg-content">
            <strong>${escapeHTML(m.sender_name || other.username || "User")}</strong>
            ${escapeHTML(m.text)}
            <span class="time">${formatTime(m.created_at)}</span>
          </div>
        </div>
      `;
    }

    el.appendChild(div);
    this.scrollToBottom();
  },

  // ================================
  // Chat header
  // ================================
  setHeader(user) {
    if (!user) {
      const nameEl = document.getElementById("headerName");
      if (nameEl) nameEl.textContent = "Select a chat";
      return;
    }

    const nameEl   = document.getElementById("headerName");
    const avatarEl = document.getElementById("headerAvatar");
    const statusEl = document.getElementById("headerStatus");

    if (nameEl) nameEl.textContent = user.username;

    if (avatarEl) {
      const initial = (user.username?.[0] || "?").toUpperCase();
      if (user.avatar_url) {
        avatarEl.innerHTML = `<img src="${escapeHTML(user.avatar_url)}" alt="" />`;
        avatarEl.classList.add("has-image");
      } else {
        avatarEl.textContent = initial;
        avatarEl.classList.remove("has-image");
      }
    }

    if (statusEl) {
      statusEl.textContent = "online";
      statusEl.className = "status online";
    }
  },

  // ================================
  // Typing indicator
  // ================================
  showTyping() {
    const el = document.getElementById("messages");
    if (!el) return;
    this.hideTyping();

    const t = document.createElement("div");
    t.className = "typing";
    t.id = "typingIndicator";
    t.innerHTML = "<span></span><span></span><span></span>";
    el.appendChild(t);
    this.scrollToBottom();
  },

  hideTyping() {
    const t = document.getElementById("typingIndicator");
    if (t) t.remove();
  },

  // ================================
  // Scroll
  // ================================
  scrollToBottom() {
    const el = document.getElementById("messages");
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  },

  // ================================
  // Mobile
  // ================================
  openMobileChat() {
    const el = document.getElementById("chatWindow");
    if (el) el.classList.add("open");
  },

  closeMobileChat() {
    const el = document.getElementById("chatWindow");
    if (el) el.classList.remove("open");
  }
};

// ================================
// Helpers
// ================================

function escapeHTML(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
