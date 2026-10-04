// ================================
// Profile — view/edit
// ================================

const Profile = {

  // ================================
  // Open my profile modal
  // ================================
  async openMyProfile() {
    const myId = State.me.id;
    if (!myId) return;

    const { data, error } = await sb
      .from("profiles")
      .select("id, username, bio, avatar_url")
      .eq("id", myId)
      .single();

    if (error) {
      console.error("Failed to load profile:", error);
      return;
    }

    this._openModal({
      user: data,
      isMe: true
    });
  },

  // ================================
  // Open someone else's profile
  // ================================
  async openUserProfile(userId) {
    if (!userId) return;

    const { data, error } = await sb
      .from("profiles")
      .select("id, username, bio, avatar_url")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to load user:", error);
      return;
    }

    this._openModal({
      user: data,
      isMe: false
    });
  },

  // ================================
  // Save bio
  // ================================
  async saveBio(bio) {
    bio = (bio || "").trim().slice(0, 150);

    const { error } = await sb
      .from("profiles")
      .update({ bio })
      .eq("id", State.me.id);

    if (error) {
      console.error("Bio save failed:", error);
      return { ok: false, error: "Save nahi hua" };
    }

    // Update local state
    State.me.bio = bio;
    const u = State.users.find(x => x.id === State.me.id);
    if (u) u.bio = bio;

    // Refresh sidebar user list
    UI.renderUserList(document.getElementById("search")?.value || "");

    return { ok: true };
  },

  // ================================
  // Upload and save avatar
  // ================================
  async saveAvatar(file) {
    const result = await Avatar.upload(file);
    if (!result.ok) return result;

    // Update local state
    State.me.avatar_url = result.url;
    const u = State.users.find(x => x.id === State.me.id);
    if (u) u.avatar_url = result.url;

    // Refresh sidebar user list
    UI.renderUserList(document.getElementById("search")?.value || "");

    // Refresh my footer avatar
    if (typeof updateMyAvatar === "function") {
      updateMyAvatar();
    }

    return { ok: true, url: result.url };
  },

  // ================================
  // Modal open/close
  // ================================
  _openModal({ user, isMe }) {
    const modal = document.getElementById("profileModal");
    if (!modal) {
      console.warn("Profile modal not in HTML");
      return;
    }

    const avatarEl  = document.getElementById("modalAvatar");
    const nameEl    = document.getElementById("modalName");
    const editBtn   = document.getElementById("modalEditBtn");
    const saveBtn   = document.getElementById("modalSaveBtn");
    const fileInput = document.getElementById("modalFileInput");
    const uploadBtn = document.getElementById("modalUploadBtn");

    // Render avatar
    const initial = (user.username?.[0] || "?").toUpperCase();
    if (user.avatar_url) {
      avatarEl.innerHTML = `<img src="${escapeHTML(user.avatar_url)}" alt="" />`;
      avatarEl.classList.add("has-image");
    } else {
      avatarEl.textContent = initial;
      avatarEl.classList.remove("has-image");
    }

    nameEl.textContent = "@" + user.username;

    const bioView = document.getElementById("modalBioView");
    const bioEdit = document.getElementById("modalBioEdit");

    bioView.textContent = user.bio || "Koi bio nahi 😶";

    if (isMe) {
      bioEdit.value = user.bio || "";
      editBtn.style.display = "block";
      uploadBtn.style.display = "block";
    } else {
      editBtn.style.display = "none";
      uploadBtn.style.display = "none";
    }

    // Reset view mode
    bioView.style.display = "block";
    bioEdit.style.display = "none";
    saveBtn.style.display = "none";

    modal.classList.add("show");

    // ---- Edit button ----
    editBtn.onclick = () => {
      bioView.style.display = "none";
      bioEdit.style.display = "block";
      editBtn.style.display = "none";
      saveBtn.style.display = "block";
      bioEdit.focus();
    };

    // ---- Save button ----
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const result = await this.saveBio(bioEdit.value);

      saveBtn.disabled = false;
      saveBtn.textContent = "Save";

      if (result.ok) {
        bioView.textContent = bioEdit.value.trim() || "Koi bio nahi 😶";
        bioView.style.display = "block";
        bioEdit.style.display = "none";
        editBtn.style.display = "block";
        saveBtn.style.display = "none";
      } else {
        alert(result.error);
      }
    };

    // ---- Upload button ----
    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";

      const result = await this.saveAvatar(file);

      uploadBtn.disabled = false;
      uploadBtn.textContent = "Change Photo";

      if (result.ok) {
        avatarEl.innerHTML = `<img src="${escapeHTML(result.url)}" alt="" />`;
        avatarEl.classList.add("has-image");
      } else {
        alert(result.error);
      }

      fileInput.value = "";
    };
  },

  // ================================
  // Close modal
  // ================================
  close() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("show");
  }
};
