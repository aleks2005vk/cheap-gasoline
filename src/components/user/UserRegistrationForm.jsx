import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../../features/auth/authSlice";
import { register as fakeRegister } from "../../app/api/fakeAuth";

const UserRegistrationForm = () => {
  const [values, setValues] = useState({ email: "", name: "", password: "" });
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await fakeRegister({ ...values, avatar: previewUrl });
      dispatch(setCredentials(result));
      navigate("/profile");
    } catch (err) {
      setError(err?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-slate-900">
      <div className="relative w-full max-w-md flex flex-col items-center justify-center">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-700" />

        <div className="relative w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-md">
              Join GasApp
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
              Create new account
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-200 text-xs font-bold text-center backdrop-blur-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex justify-center mb-4">
              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-black/40 group-focus-within:border-blue-500/50 transition-all">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-8 h-8 text-white/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full border-4 border-[#1a1a1a] shadow-lg">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              </label>
            </div>

            <div className="space-y-4">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  name="name"
                  placeholder="Full Name"
                  value={values.name}
                  onChange={handleChange}
                  required
                  className="w-full py-4 pl-12 pr-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 outline-none focus:border-blue-500/50 focus:bg-black/40 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              </div>

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
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={values.email}
                  onChange={handleChange}
                  required
                  className="w-full py-4 pl-12 pr-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 outline-none focus:border-blue-500/50 focus:bg-black/40 focus:ring-1 focus:ring-blue-500/50 transition-all"
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create Password"
                  value={values.password}
                  onChange={handleChange}
                  required
                  className="w-full py-4 pl-12 pr-12 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 outline-none focus:border-purple-500/50 focus:bg-black/40 focus:ring-1 focus:ring-purple-500/50 transition-all"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/30 text-xs mb-3">Уже есть аккаунт?</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-white font-bold text-sm border-b border-transparent hover:border-white transition-all pb-0.5"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationForm;
