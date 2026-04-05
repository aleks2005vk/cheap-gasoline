import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/api/store.js";
import App from "./components/App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./i18n"; // ← подключаем i18n
import { API_URL } from "./config";
import { onAuthStateChange } from "./app/api/firebaseAuth.js";
import { setUser, logout, setAuthLoaded } from "./app/api/authSlice.js";

onAuthStateChange(async (firebaseUser) => {
  if (!firebaseUser) {
    store.dispatch(logout()); // logout уже ставит isInitialized = true
    store.dispatch(setAuthLoaded(false));
    return;
  }

  const idToken = await firebaseUser.getIdToken();
  const tokenResult = await firebaseUser.getIdTokenResult();
  const claims = tokenResult.claims || {};
  const inferredRole =
    claims.role ||
    (claims.admin === true ? "admin" : null) ||
    (claims.is_admin === true ? "admin" : null);

  const fallbackUser = {
    email: firebaseUser.email,
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email,
    role: inferredRole || "user",
  };

  try {
    const response = await fetch(`${API_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
      const profile = await response.json();
      store.dispatch(
        setUser({
          user: {
            ...profile,
            name: profile.name || firebaseUser.displayName || profile.email,
            role: profile.role || inferredRole || "user",
          },
          idToken,
        }),
      );
      store.dispatch(setAuthLoaded(false));
    } else {
      store.dispatch(setUser({ user: fallbackUser, idToken }));
      store.dispatch(setAuthLoaded(false));
    }
  } catch (error) {
    console.error("Auth state initialization failed:", error);
    store.dispatch(setUser({ user: fallbackUser, idToken: null }));
    store.dispatch(setAuthLoaded(false));
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
