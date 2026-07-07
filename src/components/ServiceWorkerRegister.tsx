"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let refreshing = false;
    // Quando o novo service worker assume o controle, recarrega uma vez para
    // o usuário nunca ficar preso numa versão antiga.
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Checa por atualização ao registrar e sempre que a aba volta ao foco.
      reg.update().catch(() => {});
      const onVisible = () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); };
      document.addEventListener("visibilitychange", onVisible);

      // Se já houver um SW esperando, ativa-o (dispara controllerchange → reload).
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        nw?.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            nw.postMessage?.({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch(() => {});

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
