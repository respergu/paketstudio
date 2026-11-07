import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Prevent default browser right-click context menu (e.g. "Inspect Element", "Reload") in native desktop app
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
