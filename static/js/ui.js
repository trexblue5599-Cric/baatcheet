// ================================
// UI — render functions
// ================================

const UI = {

  // ================================
  // User list (sidebar)
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

      let preview = user.bio || "Tap to chat";
      if (last) {
        if (last.gif_url) preview = "🎬 GIF";
        else if (last.image_url) preview = "📷 Photo";
        else if (last.sticker_url) preview = "🎨 Sticker";
        else if (last.text) {
          preview = last.text.length > 30
            ? last.text.slice(0, 30) + "…"
            : last.text;
        }
      }

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

    div.dataset.messageId = m.id;
    div.dataset.senderId = m.sender_id;

    let contentHTML = "";

    if (m.sticker_url) {
      contentHTML += `<img class="msg-sticker" src="${escapeHTML(m.sticker_url)}" alt="sticker" loading="lazy" />`;
    }

    if (m.gif_url) {
      contentHTML += `
        <div class="msg-media">
          <img class="msg-gif" src="${escapeHTML(m.gif_url)}" alt="gif" loading="lazy" />
        </div>`;
    }

    if (m.image_url && !m.image_expired) {
      contentHTML += `
        <div class="msg-media">
          <img class="msg-image" src="${escapeHTML(m.image_url)}" alt="photo" loading="lazy" />
          <a class="msg-download" href="${escapeHTML(m.image_url)}" download target="_blank" rel="noopener" title="Download">⬇</a>
        </div>`;
    }

    if (m.image_url && m.image_expired) {
      contentHTML += `<div class="msg-expired">📷 Photo expired</div>`;
    }

    if (m.text && m.text.trim()) {
      contentHTML += `<div class="msg-text">${linkify(escapeHTML(m.text))}</div>`;
    }

    contentHTML += `<span class="time">${formatTime(m.created_at)}</span>`;

    if (mine) {
      div.innerHTML = contentHTML;
    } else {
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
            ${contentHTML}
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
      statusEl.innerHTML = `@${escapeHTML(user.username)}`;
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
  // Mobile slide
  // ================================
  openMobileChat() {
    document.body.classList.add("chat-open");
    const el = document.getElementById("chatWindow");
    if (el) el.classList.add("open");
  },

  closeMobileChat() {
    document.body.classList.remove("chat-open");
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

// ================================
// Linkify — URL detection + clickable
// ================================

function linkify(text) {
  if (!text) return "";

  const urlRegex = /(\b(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+(?:com|in|org|net|io|co|app|dev|me|tv|xyz|info|biz|online|site|website|store|blog|tech|live|life|world|today|news|space|fun|art|club|social|chat|link|cloud|host|pro|gg|to|cc|be|us|uk|ca|au|de|fr|jp|ru|br|mx|za|pk|bd|lk|np|sg|my|th|ph|id|vn|kr|tw|hk)(?:\/[^\s]*)?)/gi;

  return text.replace(urlRegex, (match) => {
    let url = match.replace(/[.,;:!?)\]}'"]+$/, "");

    let href = url;
    if (!href.match(/^https?:\/\//i)) {
      href = "https://" + href;
    }

    const safeHref = href.replace(/"/g, "&quot;");
    const safeUrl = url.replace(/[<>"']/g, "");

    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="msg-link">${safeUrl}</a>`;
  });
}
