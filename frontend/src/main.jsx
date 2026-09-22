import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthGate from "./AuthGate.jsx";
import DeleteAccountInfoPage from "./screens/DeleteAccountInfoPage.jsx";
import PrivacyPolicyPage from "./screens/PrivacyPolicyPage.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./index.css";
import { initTheme } from "./shared/themes";
import { isDeleteAccountInfoPath, isPrivacyPath } from "./shared/publicPages";

initTheme();

// Public pages (no sign-in) are shown by address; everything else is the app behind sign-in.
// Two safety nets for the app: the outer one covers sign-in itself; the inner one wraps
// the app so a crashing screen still leaves the top strip (and Log out) usable.
function Root() {
  const path = window.location.pathname;
  if (isDeleteAccountInfoPath(path)) return <DeleteAccountInfoPage />;
  if (isPrivacyPath(path)) return <PrivacyPolicyPage />;
  return (
    <AuthGate>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AuthGate>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);
