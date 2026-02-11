import React from "react";
import Navbar from "./ui/Navbar/Navbar";
import Footer from "./ui/Footer/Footer";
import MapComponent from "./ui/map/MapComponentNew";
import { Routes, Route } from "react-router-dom";

import User from "./user/User";
import UserLoginForm from "./user/UserLoginForm";
import UserRegistrationForm from "./user/UserRegistrationForm";
import UserProfile from "./user/UserProfile";
import AddStationPhoto from "./pages/AddStationPhoto";
import ResetRequest from "./user/ResetRequest";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          {/* Главная страница с картой */}
          <Route path="/" element={<MapComponent />} />

          {/* Авторизация */}
          <Route path="/login" element={<UserLoginForm />} />
          <Route path="/register" element={<UserRegistrationForm />} />
          <Route path="/reset-password" element={<ResetRequest />} />

          {/* Профиль и пользовательские данные */}
          <Route path="/user" element={<User />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* Функционал АЗС */}
          <Route path="/add-station-photo" element={<AddStationPhoto />} />
          <Route path="/add-photo" element={<AddStationPhoto />} />

          {/* СКРЫТАЯ АДМИНКА */}
          <Route
            path="/manage-fuel-system-secure-777"
            element={<AdminPanel />}
          />

          {/* Редирект-заглушка: если юзер забрел не туда */}
          <Route path="*" element={<MapComponent />} />
        </Routes>
      </div>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
