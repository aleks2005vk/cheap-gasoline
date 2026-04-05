import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, selectIsAuthLoading, selectIsAdmin } from "../../../app/api/authSlice";
import { firebaseLogout } from "../../../app/api/firebaseAuth";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const isAuthLoading = useSelector(selectIsAuthLoading);
  const isAdmin = useSelector(selectIsAdmin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const LANG_OPTIONS = [
    { code: "ru", label: "🇷🇺 RU" },
    { code: "en", label: "🇬🇧 EN" },
    { code: "ka", label: "🇬🇪 KA" },
  ];

  const handleLogout = async () => {
    await firebaseLogout();
    dispatch(logout());
    navigate("/");
    setProfileMenuOpen(false);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
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
                    {t("map")}
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
                    {t("services")}
                    {isActive("/services") && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                    )}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          <div className="flex items-center gap-4">
            {/* ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКОВ */}
            <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/10">
              {LANG_OPTIONS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => changeLanguage(code)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    i18n.language.startsWith(code)
                      ? "bg-white text-black"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* КНОПКА ПЕРЕКЛЮЧЕНИЯ ТЕМЫ */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all duration-300 active:scale-95"
              title={isDark ? t("themeLight") : t("themeDark")}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {isAdmin && (
              <Link
                to="/add-photo"
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-300 active:scale-95"
              >
                <span className="text-xs">＋</span>
                <span className="hidden sm:inline">{t("updatePrice")}</span>
              </Link>
            )}

            {isAuthLoading ? null : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 focus:outline-none group"
                >
                  <div className="hidden sm:flex flex-col items-end mr-1 text-right">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider group-hover:opacity-70 transition">
                      {user?.name || user?.displayName || "User"}
                    </span>
                    <span className="text-[9px] text-white/30 font-medium">
                      {user?.role === "admin"
                        ? t("roleAdmin")
                        : t("statusVerifiedUser")}
                    </span>
                  </div>

                  <div className="w-9 h-9 rounded-full border border-white/20 p-0.5 group-hover:border-white/50 transition duration-300">
                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="profile"
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-white/50 text-xs uppercase font-bold">
                          {(user?.name || user?.email || "U")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-6 w-60 bg-[#111] border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="px-5 py-3 border-b border-white/5 mb-1">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                        {t("accountSecurityActive")}
                      </p>
                        <p className="text-xs text-white truncate font-medium">
                          {user?.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigate("/profile");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-5 py-3 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {t("profileSettings")}
                      </button>

                      {(user?.role === "admin" ||
                        user?.role === "moderator" ||
                        user?.is_admin) && (
                        <button
                          onClick={() => {
                            navigate("/moderate-prices");
                            setProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-5 py-3 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all"
                        >
                          {t("moderation")}
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-xs text-red-400 hover:bg-red-500/10 transition-all font-medium border-t border-white/5 mt-1"
                      >
                        {t("logout")} {/* ← было "Завершить сессию" */}
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
                  {t("login")}
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-black px-6 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-black hover:bg-neutral-200 transition-all active:scale-95"
                >
                  {t("join")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
