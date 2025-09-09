import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Initialize the service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New version available. Reload?")) {
      // Call the internal update function
      updateSW?.(); // optional chaining in case it's undefined
    }
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
