import { createSlice } from "@reduxjs/toolkit";

const saved = (() => {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
})();

const authSlice = createSlice({
  name: "auth",
  initialState: { user: saved.user || null, token: saved.token || null },
  reducers: {
    setCredentials: (state, action) => {
      // ИСПРАВЛЕНО: Бэкенд присылает 'token', а не 'accessToken'
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      try {
        localStorage.setItem("auth", JSON.stringify({ user, token }));
      } catch {
        /* ignore */
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      try {
        localStorage.removeItem("auth");
      } catch {
        /* ignore */
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
