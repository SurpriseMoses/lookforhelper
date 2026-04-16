import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
  window.addEventListener(
    "load",
    () => {
      void (async () => {
        try {
          if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
          }

          if ("caches" in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
          }
        } catch {
          return;
        }
      })();
    },
    { once: true },
  );
}

createRoot(document.getElementById("root")!).render(<App />);
