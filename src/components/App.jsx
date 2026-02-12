import React from "react";
import Navbar from "./ui/Navbar/Navbar";
import Footer from "./ui/Footer/Footer";
import MapComponent from "./ui/map/MapComponent";
import AddStationPhoto from "./pages/AddStationPhoto";
import Login from "../features/Login";
import UserRegistrationForm from "./user/UserRegistrationForm";
import UserProfile from "./user/UserProfile";
import ResetRequest from "./user/ResetRequest"; // 1. Добавил импорт (проверь путь к файлу!)
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 overflow-hidden">
      <Navbar />

      <div className="flex-1 relative min-h-0 bg-neutral-900">
        <Routes>
          <Route path="/" element={<MapComponent />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<UserRegistrationForm />} />

          {/* 2. Добавил роут для восстановления пароля */}
          <Route path="/forgot-password" element={<ResetRequest />} />

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

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
