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
        alert("Email не найден в базе!");
      }
    } catch (err) {
      alert("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10">
        <h2 className="text-center font-black text-3xl uppercase italic tracking-tighter mb-8 text-blue-600">
          Сброс пароля
        </h2>

        {success ? (
          <div className="text-center bg-green-50 p-8 rounded-3xl animate-pulse">
            <p className="text-green-600 font-black uppercase text-sm">
              Пароль успешно изменен!
            </p>
            <p className="text-gray-400 text-[10px] mt-2 font-bold uppercase">
              Сейчас вы будете перенаправлены...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-6">
            <div className={step === 2 ? "opacity-30 pointer-events-none" : ""}>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">
                Введите вашу почту
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold"
                placeholder="example@mail.com"
              />
            </div>

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-top-4">
                <label className="text-[10px] font-black uppercase text-blue-600 ml-2 mb-1 block">
                  Придумайте новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-200 rounded-2xl font-bold"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95"
            >
              {loading
                ? "Обработка..."
                : step === 1
                  ? "Продолжить"
                  : "Обновить пароль"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[10px] font-black text-gray-400 uppercase hover:text-gray-600"
            >
              Назад ко входу
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetRequest;
