const CACHE_NAME = "gratisfy-v1";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/index.js",
  "./js/firebase.js",
  "./images/spoticlone-logo.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS);
    })
  );
});

self.addEventListener("fetch", (evento) => {
  evento.respondWith(
    caches.match(evento.request).then((resposta) => {
      return resposta || fetch(evento.request);
    })
  );
});