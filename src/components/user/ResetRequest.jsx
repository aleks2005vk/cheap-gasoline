import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { firebaseSendPasswordReset } from "../../app/api/firebaseAuth";

const ResetRequest = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await firebaseSendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Ошибка отправки письма");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-pulse"></div>

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            Reset Password
          </h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">
            Security Check
          </p>
        </div>

        {success ? (
          <div className="text-center bg-green-500/10 border border-green-500/20 p-8 rounded-3xl animate-pulse">
            <p className="text-green-400 font-black uppercase text-sm tracking-widest">
              Письмо отправлено!
            </p>
            <p className="text-white/40 text-[10px] mt-2 font-bold uppercase">
              Проверьте почту и продолжите по ссылке.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-white/20 transition-all"
            >
              Вернуться к входу
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-200 text-xs font-bold text-center backdrop-blur-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="relative group">
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Your email address"
                className="w-full px-6 py-4 bg-black/30 border border-white/10 focus:border-blue-500 rounded-2xl text-white outline-none font-bold placeholder-white/20 transition-all"
              />
            </div>

            <p className="text-white/40 text-[11px] leading-5">
              Мы отправим ссылку для сброса пароля на указанный email.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {loading ? "Отправляем..." : "Отправить письмо"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[10px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-colors"
            >
              Cancel & Return
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetRequest;
