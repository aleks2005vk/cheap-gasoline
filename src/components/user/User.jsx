import React from "react";
import UserRegistrationForm from "./UserRegistrationForm";
import Login from "../../features/Login"; // Исправил путь

const User = ({ formType, setFormType, onClose }) => {
  const switchForm = (type) => {
    if (setFormType) setFormType(type);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Контейнер для формы */}
      <div className="relative w-full max-w-md z-10 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/40 hover:text-white text-2xl transition-all"
        >
          ✕
        </button>

        {formType === "signup" ? (
          <UserRegistrationForm switchForm={() => switchForm("signin")} />
        ) : (
          <Login switchForm={() => switchForm("signup")} />
        )}
      </div>
    </div>
  );
};

export default User;
