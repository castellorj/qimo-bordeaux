/* QIMO Bordeaux — Service Worker
   Estratégia:
   - App shell e páginas visitadas: cache-first com atualização em segundo plano (stale-while-revalidate)
   - Imagens: cache-first
   - API de clima (open-meteo): network-first com fallback ao cache
   Resultado: todo conteúdo já acessado funciona offline.
*/
const VERSION = "qimo-v1";
const SHELL = `${VERSION}-shell`;
const IMG = `${VERSION}-img`;

const PRECACHE = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Clima — network-first
  if (url.hostname.includes("open-meteo.com")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Imagens — cache-first
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              const copy = res.clone();
              caches.open(IMG).then((c) => c.put(request, copy));
              return res;
            })
            .catch(() => cached)
      )
    );
    return;
  }

  // Navegação e demais GET — stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => cached || caches.match("/offline"));
      return cached || network;
    })
  );
});
