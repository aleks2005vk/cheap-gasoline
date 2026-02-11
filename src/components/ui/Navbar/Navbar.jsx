import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, logout } from "../../../features/auth/authSlice";

export default function Navbar() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // --- ИСПРАВЛЕНИЕ ---
  // Мы просто проверяем, есть ли объект user.
  // Если Redux не пустой, значит мы авторизованы.
  const isAuth = !!user;

  // Отладка: посмотри в консоль браузера (F12), что там выводится
  useEffect(() => {
    console.log("Navbar Auth State:", { isAuth, user });
  }, [isAuth, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setProfileMenuOpen(false);
  };

  return (
    <header className="bg-[#1f2937] text-white shadow-md relative z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ЛОГОТИП */}
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-2 group" to="/">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center group-hover:bg-teal-400 transition shadow-lg shadow-teal-500/20">
                <span className="text-white font-bold text-lg">▲</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-100 group-hover:text-white">
                GasApp
              </span>
            </Link>

            {/* НАВИГАЦИЯ (DESKTOP) */}
            <nav className="hidden md:block">
              <ul className="flex items-center gap-6 text-sm font-medium text-gray-400">
                <li>
                  <Link to="/map" className="hover:text-teal-400 transition">
                    Карта
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="hover:text-teal-400 transition"
                  >
                    Сервисы
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          <div className="flex items-center gap-4">
            {/* Кнопка Добавить фото (всегда видна) */}
            <Link
              to="/add-photo"
              className="hidden sm:flex items-center gap-2 rounded-full bg-gray-700/50 px-4 py-2 text-sm font-medium text-green-400 hover:bg-gray-700 hover:text-green-300 transition border border-gray-600"
            >
              <span>📸</span>
              <span>Добавить фото</span>
            </Link>

            <div className="h-6 w-[1px] bg-gray-700 mx-2 hidden sm:block"></div>

            {/* БЛОК АВТОРИЗАЦИИ */}
            {isAuth ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 group focus:outline-none"
                >
                  <div className="flex flex-col items-end leading-none hidden md:flex">
                    <span className="text-sm font-bold text-gray-200 group-hover:text-white transition">
                      {user.name || user.email?.split("@")[0] || "User"}
                    </span>
                    <span className="text-[10px] text-teal-500 font-medium uppercase tracking-wider">
                      Online
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 p-[2px] shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition">
                    <div className="w-full h-full rounded-full bg-[#1f2937] flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          className="w-full h-full object-cover"
                          alt="avatar"
                        />
                      ) : (
                        <span className="text-teal-500 font-bold text-lg">
                          {(user.name || user.email || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                {profileMenuOpen && (
                  <>
                    {/* Прозрачная подложка, чтобы закрыть кликом вне меню */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    ></div>

                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 transform origin-top-right transition-all">
                      <div className="px-4 py-3 border-b border-gray-100 mb-1">
                        <p className="text-sm text-gray-500">Вы вошли как</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigate("/profile");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition flex items-center gap-3"
                      >
                        👤 Профиль
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition flex items-center gap-3 font-medium"
                      >
                        🚪 Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // ЕСЛИ НЕ АВТОРИЗОВАН
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white font-medium text-sm transition px-2"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-teal-500 px-5 py-2 text-sm font-bold text-white hover:bg-teal-400 transition shadow-lg shadow-teal-500/25"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
