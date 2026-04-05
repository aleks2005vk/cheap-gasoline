import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { onAuthStateChange, firebaseLogout } from "./firebaseAuth";

const initialState = {
  user: null,
  idToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Установить пользователя из Firebase
    setUser(state, action) {
      state.user = action.payload.user;
      state.idToken = action.payload.idToken;
      state.isAuthenticated = true;
      state.error = null;
    },

    // Выход
    logout(state) {
      state.user = null;
      state.idToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    // Очистить ошибку
    clearError(state) {
      state.error = null;
    },

    // Установить ошибку
    setError(state, action) {
      state.error = action.payload;
    },

    // Загрузка
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
  },

  extraReducers: (builder) => {
    // Get Profile
    builder.addMatcher(
      apiSlice.endpoints.getProfile.matchFulfilled,
      (state, action) => {
        state.user = action.payload;
      },
    );
  },
});

export const { setTokens, setUser, logout, clearError, setError } =
  authSlice.actions;

// SELECTORS
export const selectCurrentUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthError = (state) => state.auth.error;

// DERIVED SELECTORS
export const selectUserRole = (state) => state.auth.user?.role || "guest";
export const selectManagedStations = (state) =>
  state.auth.user?.managed_stations || [];
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";
export const selectIsStationOwner = (state) =>
  state.auth.user?.role === "station_owner";

export default authSlice.reducer;
