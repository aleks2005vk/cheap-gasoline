import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/setTokens", "auth/setUser"],
        ignoredPaths: ["auth.user"],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
