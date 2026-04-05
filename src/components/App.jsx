import React, { Suspense, lazy } from "react";
import Navbar from "./ui/Navbar/Navbar";
import MapComponent from "./ui/map/MapComponent";
import AddStationPhoto from "./pages/AddStationPhoto";
import Login from "../features/Login";
import UserRegistrationForm from "./user/UserRegistrationForm";
import ResetRequest from "./user/ResetRequest";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  selectIsAuthenticated,
  selectIsInitialized,
  selectIsAdmin,
} from "../app/api/authSlice";
import { ThemeProvider } from "../context/ThemeContext";

// Lazy load heavy components
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const PriceModerationPanel = lazy(() => import("./pages/PriceModerationPanel"));
const UserProfile = lazy(() => import("./user/UserProfile"));
const MapPointsManager = lazy(() => import("./pages/MapPointsManager"));

// Показываем спиннер пока Firebase не инициализировался
const AdminRoute = ({ children }) => {
  const { t } = useTranslation();
  const isInitialized = useSelector(selectIsInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        {t("loading")}
      </div>
    );
  }
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const isInitialized = useSelector(selectIsInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isInitialized) return null; // ждём инициализации
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen w-full bg-neutral-950 overflow-hidden">
        <Navbar />
        <div className="flex-1 relative min-h-0 bg-neutral-900">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-white">Loading...</div>}>
            <Routes>
            <Route path="/" element={<MapComponent />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <UserRegistrationForm />
                </PublicOnlyRoute>
              }
            />
            <Route path="/forgot-password" element={<ResetRequest />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/points"
              element={
                <AdminRoute>
                  <MapPointsManager />
                </AdminRoute>
              }
            />
            <Route
              path="/moderate-prices"
              element={
                <AdminRoute>
                  <PriceModerationPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/debug"
              element={
                <div className="p-8 text-white">Debug: React rendering OK</div>
              }
            />
            <Route path="/add-photo" element={<AddStationPhoto />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<MapComponent />} />
          </Routes>
          </Suspense>
        </div>
      </div>
    </ThemeProvider>
  );
}
