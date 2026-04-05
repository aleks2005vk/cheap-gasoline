import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/api/store.js";
import App from "./components/App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { API_URL } from "./config";
import { onAuthStateChange } from "./app/api/firebaseAuth.js";
import { setUser, logout } from "./app/api/authSlice.js";

// Инициализация Firebase auth state listener
onAuthStateChange(async (user) => {
  if (user) {
    const idToken = await user.getIdToken();
    // Получить профиль из API
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.ok) {
        const profile = await response.json();
        store.dispatch(setUser({ user: profile, idToken }));
      } else {
        store.dispatch(
          setUser({ user: { email: user.email, uid: user.uid }, idToken }),
        );
      }
    } catch (error) {
      store.dispatch(
        setUser({ user: { email: user.email, uid: user.uid }, idToken }),
      );
    }
  } else {
    store.dispatch(logout());
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
