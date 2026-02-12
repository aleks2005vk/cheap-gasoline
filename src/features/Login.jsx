import React, { useRef, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "./auth/authApiSlice";
import { setCredentials } from "./auth/authSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const userRef = useRef();
  const errRef = useRef();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (userRef.current) userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login({ email, password }).unwrap();
      dispatch(setCredentials(userData));
      navigate("/profile");
    } catch (err) {
      if (!err?.status) setErrMsg("Сервер не отвечает");
      else if (err.status === 400) setErrMsg("Введите Email и Пароль");
      else if (err.status === 401) setErrMsg("Неверный логин или пароль");
      else setErrMsg("Ошибка авторизации");
      if (errRef.current) errRef.current.focus();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-slate-900">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse delay-700"></div>

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-md">
            Welcome Back
          </h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
            GasApp Monitoring
          </p>
        </div>

        {errMsg && (
          <div
            ref={errRef}
            className="mb-6 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-200 text-xs font-bold text-center backdrop-blur-sm"
            aria-live="assertive"
            tabIndex={-1}
          >
            ⚠️ {errMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-white/40 group-focus-within:text-blue-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              name="email" // Важно для автозаполнения
              ref={userRef}
              autoComplete="email" // Подсказка браузеру
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
              placeholder="Email Address"
              className="w-full py-4 pl-12 pr-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 outline-none focus:border-blue-500/50 focus:bg-black/40 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-white/40 group-focus-within:text-purple-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password" // Важно для автозаполнения
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
              placeholder="Password"
              className="w-full py-4 pl-12 pr-12 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 outline-none focus:border-purple-500/50 focus:bg-black/40 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a9.04 9.04 0 012.119-.074m6.52 1.343a9.97 9.97 0 013.312 3.655c-1.274 4.057-5.064 7-9.542 7-1.132 0-2.213-.19-3.23-.532M9 17l6.01-6.01M15 12l3.35-3.35"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Добавленная секция: Запомнить + Забыли пароль */}
          <div className="flex justify-between items-center px-1 text-[11px] font-bold uppercase tracking-wider">
            <label className="flex items-center gap-2 cursor-pointer group text-white/40 hover:text-white transition-colors">
              <input
                type="checkbox"
                className="rounded bg-black/40 border-white/10 text-blue-600 focus:ring-0"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")} // Убедись, что путь совпадает в App.js
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? "Входим..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/30 text-xs mb-3">Нет аккаунта?</p>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-white font-bold text-sm border-b border-transparent hover:border-white transition-all pb-0.5"
          >
            Создать аккаунт
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
