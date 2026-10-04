// ================================
// Service Worker — Baatcheet PWA
// ================================

const CACHE_NAME = "baatcheet-v1";
const RUNTIME_CACHE = "baatcheet-runtime-v1";

// Assets to precache
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./chat.html",
  "./manifest.json",
  "./static/css/base.css",
  "./static/css/sidebar.css",
  "./static/css/chat.css",
  "./static/css/messages.css",
  "./static/css/composer.css",
  "./static/css/mobile.css",
  "./static/css/profile.css",
  "./static/css/gifs.css",
  "./static/css/delete.css",
  "./static/js/supabase.js",
  "./static/js/storage.js",
  "./static/js/state.js",
  "./static/js/auth.js",
  "./static/js/avatar.js",
  "./static/js/photos.js",
  "./static/js/profile.js",
  "./static/js/delete.js",
  "./static/js/ui.js",
  "./static/js/users.js",
  "./static/js/messages.js",
  "./static/js/gifs.js",
  "./static/js/actions.js",
  "./static/js/main.js"
];

// ================================
// Install — cache everything
// ================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn("Failed to cache:", url, err))
        )
      );
    })
  );
});

// ================================
// Activate — clean old caches
// ================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ================================
// Fetch — smart routing
// ================================
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip external (Supabase, Giphy, CDN)
  if (url.origin !== self.location.origin) return;

  // Skip Supabase storage
  if (url.pathname.includes("/storage/")) return;

  // HTML — Network first
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CSS/JS — Network first
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Images — Cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  // Default
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

// ================================
// Message — manual skip waiting
// ================================
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
