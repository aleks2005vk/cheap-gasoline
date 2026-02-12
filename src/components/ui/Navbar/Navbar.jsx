import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, logout } from "../../../features/auth/authSlice";

export default function Navbar() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isAuth = !!user;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setProfileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 w-full z-[1000] px-0 sm:px-6 sm:pt-4">
      <div className="mx-auto max-w-7xl bg-black/[0.85] backdrop-blur-2xl sm:rounded-3xl border-b sm:border border-white/10 shadow-2xl">
        <div className="flex h-16 items-center justify-between px-6">
          {/* ЛОГОТИП */}
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-3 group" to="/">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-[360deg]">
                <div className="w-3 h-3 bg-black transform rotate-45"></div>
              </div>
              <span className="font-medium text-lg tracking-[0.1em] text-white uppercase">
                Gas<span className="font-light opacity-50">App</span>
              </span>
            </Link>

            {/* НАВИГАЦИЯ */}
            <nav className="hidden md:block">
              <ul className="flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium">
                <li>
                  <Link
                    to="/map"
                    className={`relative py-1 transition-all ${isActive("/map") ? "text-white" : "text-white/40 hover:text-white"}`}
                  >
                    Карта
                    {isActive("/map") && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className={`relative py-1 transition-all ${isActive("/services") ? "text-white" : "text-white/40 hover:text-white"}`}
                  >
                    Сервисы
                    {isActive("/services") && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                    )}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          <div className="flex items-center gap-5">
            <Link
              to="/add-photo"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-300 active:scale-95"
            >
              <span className="text-xs">＋</span>
              <span className="hidden sm:inline">Обновить цену</span>
            </Link>

            {isAuth ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 focus:outline-none group"
                >
                  <div className="flex flex-col items-end mr-1 hidden sm:flex text-right">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider group-hover:opacity-70 transition">
                      {user.name || "User"}
                    </span>
                    <span className="text-[9px] text-white/30 font-medium">
                      {user.is_admin ? "Administrator" : "Verified Account"}
                    </span>
                  </div>

                  {/* КРУЖОК АВАТАРА */}
                  <div className="w-9 h-9 rounded-full border border-white/20 p-0.5 group-hover:border-white/50 transition duration-300">
                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="profile"
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-white/50 text-xs uppercase font-bold">
                          {(user.name || user.email || "U")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-6 w-60 bg-[#111] border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="px-5 py-3 border-b border-white/5 mb-1">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                          Account Security: Active
                        </p>
                        <p className="text-xs text-white truncate font-medium">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigate("/profile");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-5 py-3 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        Настройки профиля
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-xs text-red-400 hover:bg-red-500/10 transition-all font-medium border-t border-white/5 mt-1"
                      >
                        Завершить сессию
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-white/40 text-[11px] uppercase tracking-widest font-bold hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-black px-6 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-black hover:bg-neutral-200 transition-all active:scale-95"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
