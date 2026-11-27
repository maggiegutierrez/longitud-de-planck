// =====================================================================
// pwa.js — registra el Service Worker (sw.js).
// Los service workers solo funcionan en HTTPS o en localhost.
// GitHub Pages usa HTTPS, así que ahí funciona.
// =====================================================================
if ("serviceWorker" in navigator && !new URLSearchParams(location.search).has("emulador")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker no registrado:", e));
  });
}
