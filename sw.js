// =====================================================================
// sw.js — Service Worker: un script que el navegador instala aparte y
// que se pone "en medio" de las peticiones de red de la app.
// Es lo que permite instalarla como app y abrirla sin conexión.
//
// Estrategia "primero la red": si hay internet, siempre descarga la
// versión más nueva (así ves tus cambios al publicar). Si no hay
// internet, usa la copia guardada.
//
// Si cambias la lista de archivos, sube el número de VERSION.
// =====================================================================
const VERSION = "planck-v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./jugar.html",
  "./presentador.html",
  "./css/base.css",
  "./css/lectura.css",
  "./css/jugar.css",
  "./css/presentador.css",
  "./js/contenido.js",
  "./js/ui.js",
  "./js/lectura.js",
  "./js/jugar.js",
  "./js/presentador.js",
  "./js/sala.js",
  "./js/firebase-config.js",
  "./js/pwa.js",
  "./manifest.webmanifest",
  "./icons/icono.svg",
  "./icons/icono-192.png",
  "./icons/icono-512.png",
];

// 1. Instalación: guarda los archivos en la caché.
self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(ARCHIVOS)));
  self.skipWaiting();
});

// 2. Activación: borra cachés de versiones anteriores.
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))),
    ),
  );
  self.clients.claim();
});

// 3. Cada petición: red primero, caché como respaldo.
//    Solo manejamos archivos de nuestro propio sitio; Firebase, fuentes
//    y librerías externas pasan directo.
self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== "GET" || url.origin !== location.origin) return;

  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(VERSION).then((cache) => cache.put(evento.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(evento.request, { ignoreSearch: true })),
  );
});
