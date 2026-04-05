import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";

const initialState = {
  user: null,
  idToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false, // ← новое: защита от гонки при загрузке
  isAuthLoading: true, // ← новое: для предотвращения мерцания UI
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload.user;
      state.idToken = action.payload.idToken;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.idToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.error = null;
    },
    setInitialized(state) {
      state.isInitialized = true;
    },
    clearError(state) {
      state.error = null;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setAuthLoaded(state, action) {
      state.isAuthLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      apiSlice.endpoints.getProfile.matchFulfilled,
      (state, action) => {
        state.user = action.payload;
      },
    );
  },
});

export const {
  setUser,
  logout,
  setInitialized,
  clearError,
  setError,
  setLoading,
  setAuthLoaded,
} = authSlice.actions;

// SELECTORS
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.idToken; // ← был missing — это и вызывало редирект
export const selectAccessToken = (state) => state.auth.idToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsInitialized = (state) => state.auth.isInitialized;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAuthLoading = (state) => state.auth.isAuthLoading;
export const selectUserRole = (state) =>
  state.auth.user?.role || (state.auth.user?.is_admin ? "admin" : "guest");
export const selectIsAdmin = (state) =>
  state.auth.user?.role === "admin" || state.auth.user?.is_admin === true;
export const selectIsStationOwner = (state) =>
  state.auth.user?.role === "station_owner";
export const selectManagedStations = (state) =>
  state.auth.user?.managed_stations || [];

export default authSlice.reducer;
