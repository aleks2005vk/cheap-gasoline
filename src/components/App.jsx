import React from "react";
import Navbar from "./ui/Navbar/Navbar";
import MapComponent from "./ui/map/MapComponent";
import AddStationPhoto from "./pages/AddStationPhoto";
import AdminPanel from "./pages/AdminPanel";
import Login from "../features/Login";
import UserRegistrationForm from "./user/UserRegistrationForm";
import UserProfile from "./user/UserProfile";
import ResetRequest from "./user/ResetRequest";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectCurrentToken,
} from "../features/auth/authSlice";

// Компонент-обертка для защиты админки
const AdminRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

  // Проверяем админские права
  const isAdmin =
    user?.is_admin || user?.role === "admin" || user?.role === "superadmin";

  if (!token || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Компонент для скрытия страниц логина от авторизованных
const PublicOnlyRoute = ({ children }) => {
  const token = useSelector(selectCurrentToken);
  if (token) {
    return <Navigate to="/profile" replace />;
  }
  return children;
};

export default function App() {
  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 overflow-hidden">
      <Navbar />

      <div className="flex-1 relative min-h-0 bg-neutral-900">
        <Routes>
          <Route path="/" element={<MapComponent />} />

          {/* Скрываем логин/регистрацию если уже вошел */}
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

          {/* Защищенная админка */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
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

          {/* Редирект на карту для всех неизвестных путей */}
          <Route path="*" element={<MapComponent />} />
        </Routes>
      </div>
    </div>
  );
}
