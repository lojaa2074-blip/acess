const CACHE_NAME = "access-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./site.webmanifest",
  "./favicon.ico",
  "./favicon-16x16.png",
  "./favicon-32x32.png",
  "./apple-touch-icon.png",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png"
];

// Instala e guarda os arquivos do "casco" do app em cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Remove caches antigos quando uma nova versão é ativada
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Estratégia: dados do Supabase sempre vêm da rede (nunca do cache).
// Os arquivos do app (html/css/js/ícones) usam cache com fallback para rede.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  if (url.includes("supabase.co")) {
    return; // deixa passar direto para a rede
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
