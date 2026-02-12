import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetRequest = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (step === 1) return setStep(2);

    setLoading(true);
    try {
      const res = await fetch(
        "http://127.0.0.1:8001/api/force-reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, new_password: newPassword }),
        },
      );

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2500);
      } else {
        alert("Email не найден!");
      }
    } catch (err) {
      alert("Ошибка сети");
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
              Success!
            </p>
            <p className="text-white/40 text-[10px] mt-2 font-bold uppercase">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-6">
            <div
              className={`transition-all duration-300 ${step === 2 ? "opacity-30 pointer-events-none blur-sm" : ""}`}
            >
              <div className="relative group">
                <input
                  type="email"
                  name="email" // Важно
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full px-6 py-4 bg-black/30 border border-white/10 focus:border-blue-500 rounded-2xl text-white outline-none font-bold placeholder-white/20 transition-all"
                />
              </div>
            </div>

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-top-4 relative group">
                <input
                  type="password"
                  name="new-password" // Важно
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="New Password"
                  className="w-full px-6 py-4 bg-black/30 border-2 border-blue-500/50 rounded-2xl text-white outline-none font-bold placeholder-white/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {loading
                ? "Processing..."
                : step === 1
                  ? "Continue"
                  : "Update Password"}
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
