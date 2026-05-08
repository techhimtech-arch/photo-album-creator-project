import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// PWA service worker — never register inside Lovable preview iframe / hosts.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();
const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("preview--") ||
  host.includes("lovableproject.com") ||
  host.includes("lovableproject-dev.com");

if (isInIframe || isPreviewHost) {
  navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
} else if ("serviceWorker" in navigator) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {});
}
