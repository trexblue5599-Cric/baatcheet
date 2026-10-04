// ================================
// GIFs — Giphy integration
// ================================

const GIFS = {

  API_KEY: "Vm8BgrnlUJOFO03ldwiRiNcod9oaBYS8",
  BASE: "https://api.giphy.com/v1/gifs",

  // Current state
  currentTab: "trending",
  currentQuery: "",
  offset: 0,
  loading: false,

  // Categories
  categories: [
    { id: "trending",   label: "🔥",  query: null },
    { id: "funny",      label: "😂",  query: "funny memes" },
    { id: "reactions",  label: "💀",  query: "reaction" },
    { id: "animals",    label: "🐶",  query: "cute animals" },
    { id: "love",       label: "❤️",  query: "love" },
    { id: "party",      label: "🎉",  query: "celebration" },
    { id: "hype",       label: "💪",  query: "hype" },
    { id: "hello",      label: "👋",  query: "hello" },
  ],

  // ================================
  // Open GIF picker
  // ================================
  open() {
    const panel = document.getElementById("gifPanel");
    if (!panel) return;

    panel.classList.add("show");
    this.renderTabs();
    this.loadTrending();
    this._wireSearch();
    this._wireClose();
  },

  // ================================
  // Close panel
  // ================================
  close() {
    const panel = document.getElementById("gifPanel");
    if (panel) panel.classList.remove("show");
  },

  // ================================
  // Render category tabs
  // ================================
  renderTabs() {
    const tabsEl = document.getElementById("gifTabs");
    if (!tabsEl) return;

    tabsEl.innerHTML = "";

    this.categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "gif-tab" + (cat.id === this.currentTab ? " active" : "");
      btn.dataset.id = cat.id;
      btn.textContent = cat.label;
      btn.title = cat.id;

      btn.onclick = () => {
        this.currentTab = cat.id;
        this.currentQuery = cat.query || "";
        this.offset = 0;

        // Update tabs UI
        tabsEl.querySelectorAll(".gif-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Clear search bar
        const searchInput = document.getElementById("gifSearch");
        if (searchInput) searchInput.value = "";

        // Load
        if (cat.query) {
          this.search(cat.query, true);
        } else {
          this.loadTrending(true);
        }
      };

      tabsEl.appendChild(btn);
    });
  },

  // ================================
  // Load trending GIFs
  // ================================
  async loadTrending(reset = true) {
    if (this.loading) return;

    if (reset) {
      this.offset = 0;
      this._clearGrid();
    }

    this.loading = true;
    this._showLoader();

    try {
      const url = `${this.BASE}/trending?api_key=${this.API_KEY}&limit=20&offset=${this.offset}&rating=pg-13`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.data && data.data.length) {
        this._renderGifs(data.data);
        this.offset += 20;
      } else {
        this._showEmpty();
      }
    } catch (err) {
      console.error("Giphy error:", err);
      this._showError();
    }

    this.loading = false;
    this._hideLoader();
  },

  // ================================
  // Search GIFs
  // ================================
  async search(query, reset = true) {
    query = (query || "").trim();
    if (!query) {
      this.loadTrending(true);
      return;
    }

    if (this.loading) return;

    if (reset) {
      this.offset = 0;
      this._clearGrid();
    }

    this.loading = true;
    this._showLoader();

    try {
      const url = `${this.BASE}/search?api_key=${this.API_KEY}&q=${encodeURIComponent(query)}&limit=20&offset=${this.offset}&rating=pg-13`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.data && data.data.length) {
        this._renderGifs(data.data);
        this.offset += 20;
      } else {
        this._showEmpty();
      }
    } catch (err) {
      console.error("Giphy error:", err);
      this._showError();
    }

    this.loading = false;
    this._hideLoader();
  },

  // ================================
  // Render GIF grid
  // ================================
  _renderGifs(gifs) {
    const grid = document.getElementById("gifGrid");
    if (!grid) return;

    // Remove empty state
    const empty = grid.querySelector(".gif-empty");
    if (empty) empty.remove();

    gifs.forEach(gif => {
      // Use downsized for grid (smaller), original for sending
      const preview = gif.images?.fixed_height_small?.url
                   || gif.images?.fixed_height?.url
                   || gif.images?.downsized?.url;
      const full = gif.images?.downsized_medium?.url
                || gif.images?.downsized?.url
                || gif.images?.original?.url;

      if (!preview || !full) return;

      const item = document.createElement("button");
      item.className = "gif-item";
      item.type = "button";
      item.innerHTML = `<img src="${preview}" alt="" loading="lazy" />`;

      item.onclick = () => this._sendGif(full);

      grid.appendChild(item);
    });

    // Add "Load more" if not already
    this._addLoadMore();
  },

  // ================================
  // Load more button
  // ================================
  _addLoadMore() {
    const grid = document.getElementById("gifGrid");
    if (!grid) return;

    const old = grid.querySelector(".gif-load-more");
    if (old) old.remove();

    const btn = document.createElement("button");
    btn.className = "gif-load-more";
    btn.type = "button";
    btn.textContent = "Load more...";
    btn.onclick = () => {
      if (this.currentQuery) {
        this.search(this.currentQuery, false);
      } else {
        this.loadTrending(false);
      }
    };

    grid.parentElement.appendChild(btn);
  },

  // ================================
  // Send GIF as message
  // ================================
  async _sendGif(url) {
    if (!url || !State.activeUser) return;

    this.close();

    // Send via Messages — add gif_url support
    await Messages.send("", { gif_url: url });
  },

  // ================================
  // Search input wiring
  // ================================
  _wireSearch() {
    const input = document.getElementById("gifSearch");
    if (!input) return;

    // Debounce
    let timer;
    input.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = input.value.trim();
        this.currentQuery = q;
        this.offset = 0;

        if (q) {
          this.search(q, true);
        } else {
          this.loadTrending(true);
        }
      }, 400);
    };
  },

  // ================================
  // Close button wiring
  // ================================
  _wireClose() {
    const closeBtn = document.getElementById("gifClose");
    if (closeBtn) closeBtn.onclick = () => this.close();
  },

  // ================================
  // Grid helpers
  // ================================
  _clearGrid() {
    const grid = document.getElementById("gifGrid");
    if (grid) grid.innerHTML = "";
  },

  _showLoader() {
    const grid = document.getElementById("gifGrid");
    if (!grid) return;
    const loader = document.createElement("div");
    loader.className = "gif-loader";
    loader.id = "gifLoader";
    loader.textContent = "Loading...";
    grid.appendChild(loader);
  },

  _hideLoader() {
    const loader = document.getElementById("gifLoader");
    if (loader) loader.remove();
  },

  _showEmpty() {
    const grid = document.getElementById("gifGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="gif-empty">Kuch nahi mila 😕</div>`;
  },

  _showError() {
    const grid = document.getElementById("gifGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="gif-empty">Error aaya. Try again.</div>`;
  }
};
