import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthGate from "./AuthGate.jsx";
import DeleteAccountInfoPage from "./screens/DeleteAccountInfoPage.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./index.css";
import { initTheme } from "./shared/themes";
import { isDeleteAccountInfoPath } from "./shared/publicPages";

initTheme();

// Public pages (no sign-in) are shown by address; everything else is the app behind sign-in.
// Two safety nets for the app: the outer one covers sign-in itself; the inner one wraps
// the app so a crashing screen still leaves the top strip (and Log out) usable.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isDeleteAccountInfoPath(window.location.pathname) ? (
        <DeleteAccountInfoPage />
      ) : (
        <AuthGate>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthGate>
      )}
    </ErrorBoundary>
  </React.StrictMode>,
);
