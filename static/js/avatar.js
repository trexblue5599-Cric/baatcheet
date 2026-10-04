// ================================
// Avatar — image upload + render
// ================================

const Avatar = {

  // ================================
  // Render avatar element (image or initial fallback)
  // ================================
  render(user, size = 48) {
    const initial = (user.username?.[0] || "?").toUpperCase();

    if (user.avatar_url) {
      return `
        <div class="avatar" style="width:${size}px;height:${size}px;">
          <img src="${escapeHTML(user.avatar_url)}" alt="${escapeHTML(user.username)}" />
        </div>
      `;
    }

    return `
      <div class="avatar" style="width:${size}px;height:${size}px;">
        ${escapeHTML(initial)}
      </div>
    `;
  },

  // ================================
  // Get avatar URL or null
  // ================================
  url(user) {
    return user?.avatar_url || null;
  },

  // ================================
  // Upload avatar to Supabase Storage
  // ================================
  async upload(file) {
    if (!file) return { ok: false, error: "Koi file nahi mili" };

    // Validate
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Sirf image files allowed" };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, error: "Image 2 MB se chhoti honi chahiye" };
    }

    const myId = State.me.id;
    if (!myId) return { ok: false, error: "Login karo pehle" };

    // Path: avatars/{userId}/avatar.jpg
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${myId}/avatar_${Date.now()}.${ext}`;

    // Upload
    const { error: uploadError } = await sb.storage
      .from("avatars")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { ok: false, error: "Upload fail hua. Try again." };
    }

    // Get public URL
    const { data: urlData } = sb.storage
      .from("avatars")
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    // Save URL to profiles table
    const { error: updateError } = await sb
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", myId);

    if (updateError) {
      console.error("Update error:", updateError);
      return { ok: false, error: "Profile update fail hua" };
    }

    return { ok: true, url: publicUrl };
  }
};
