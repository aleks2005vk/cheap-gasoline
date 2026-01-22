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

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<MapComponent />} />
          <Route path="/login" element={<UserLoginForm />} />
          <Route path="/userloginform" element={<UserRegistrationForm />} />
          <Route path="/user" element={<User />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/reset/request" element={<ResetRequest />} />
          <Route path="/add-station-photo" element={<AddStationPhoto />} />
        </Routes>
      </div>

      {/* Footer hidden on mobile (max-width: 768px) */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
