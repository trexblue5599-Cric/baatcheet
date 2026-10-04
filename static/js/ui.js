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

  // ⭐ Data attributes for delete feature
  div.dataset.messageId = m.id;
  div.dataset.senderId = m.sender_id;

  let contentHTML = "";

  // Sticker
  if (m.sticker_url) {
    contentHTML += `<img class="msg-sticker" src="${escapeHTML(m.sticker_url)}" alt="sticker" loading="lazy" />`;
  }

  // GIF
  if (m.gif_url) {
    contentHTML += `
      <div class="msg-media">
        <img class="msg-gif" src="${escapeHTML(m.gif_url)}" alt="gif" loading="lazy" />
      </div>`;
  }

  // Image
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

  // Text
  if (m.text && m.text.trim()) {
    contentHTML += `<div class="msg-text">${escapeHTML(m.text)}</div>`;
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
