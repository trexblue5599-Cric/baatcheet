// ================================
// Photos — image upload + compress + send
// ================================

const Photos = {

  // ================================
  // Max file size before compression
  // ================================
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB

  // ================================
  // Compress settings
  // ================================
  MAX_WIDTH: 1200,
  QUALITY: 0.8,

  // ================================
  // Open file picker
  // ================================
  pick() {
    const input = document.getElementById("photoInput");
    if (!input) return;
    input.value = "";
    input.click();
  },

  // ================================
  // Handle file selection
  // ================================
  async handleFile(file) {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      alert("Sirf image files allowed hain");
      return;
    }

    // Validate size
    if (file.size > this.MAX_FILE_SIZE) {
      alert("Image 10 MB se choti honi chahiye");
      return;
    }

    // Check active chat
    if (!State.activeUser) {
      alert("Pehle kisi user se chat kholo");
      return;
    }

    // Show uploading indicator
    this._showUploading();

    try {
      // Compress
      const blob = await this.compress(file);

      // Upload
      const url = await this.upload(blob);

      if (!url) {
        this._hideUploading();
        alert("Upload fail hua. Try again.");
        return;
      }

      // Send message with image
      await Messages.send("", { image_url: url });

      this._hideUploading();

    } catch (err) {
      console.error("Photo error:", err);
      this._hideUploading();
      alert("Kuch galat ho gaya. Try again.");
    }
  },

  // ================================
  // Compress image using canvas
  // ================================
  compress(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Calculate dimensions
          let w = img.width;
          let h = img.height;

          if (w > this.MAX_WIDTH) {
            h = Math.round((h * this.MAX_WIDTH) / w);
            w = this.MAX_WIDTH;
          }

          canvas.width = w;
          canvas.height = h;

          // Draw
          ctx.drawImage(img, 0, 0, w, h);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Compression failed"));
            },
            "image/jpeg",
            this.QUALITY
          );
        };

        img.onerror = () => reject(new Error("Image load failed"));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  },

  // ================================
  // Upload to Supabase Storage
  // ================================
  async upload(blob) {
    const myId = State.me.id;
    const path = `${myId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { error } = await sb.storage
      .from("photos")
      .upload(path, blob, {
        cacheControl: "3600",
        contentType: "image/jpeg",
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    // Get public URL
    const { data } = sb.storage
      .from("photos")
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // ================================
  // Cleanup old photos (per chat limit)
  // ================================
  async cleanupChat(otherUserId) {
    const myId = State.me.id;

    // Get all messages with images in this chat
    const { data, error } = await sb
      .from("messages")
      .select("id, image_url, created_at")
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`)
      .not("image_url", "is", null)
      .neq("image_url", "")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Cleanup query failed:", error.message);
      return;
    }

    if (!data || data.length <= 100) return;

    // Delete oldest beyond 100
    const toDelete = data.slice(100);

    for (const msg of toDelete) {
      // Extract path from URL
      const url = msg.image_url;
      const idx = url.indexOf("/photos/");
      if (idx === -1) continue;

      const path = url.slice(idx + "/photos/".length);

      // Delete from storage
      try {
        await sb.storage.from("photos").remove([path]);
      } catch (e) {
        console.warn("Storage delete failed:", e);
      }

      // Mark message as expired
      await sb
        .from("messages")
        .update({ image_expired: true, image_url: "" })
        .eq("id", msg.id);
    }
  },

  // ================================
  // Uploading indicator
  // ================================
  _showUploading() {
    const el = document.getElementById("messages");
    if (!el) return;

    const indicator = document.createElement("div");
    indicator.className = "message me uploading";
    indicator.id = "uploadingIndicator";
    indicator.innerHTML = `
      <div class="uploading-inner">
        <span class="uploading-spinner"></span>
        <span>Sending photo...</span>
      </div>
    `;
    el.appendChild(indicator);
    el.scrollTop = el.scrollHeight;
  },

  _hideUploading() {
    const el = document.getElementById("uploadingIndicator");
    if (el) el.remove();
  }
};
