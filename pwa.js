if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The game still runs if service workers are unavailable on file:// or during local testing.
    });
  });
}
