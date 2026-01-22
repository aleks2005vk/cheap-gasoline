import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetRequest = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    // fake submit: in production call backend API
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
    }, 800);
  };

  return (
    <div className="w-[92%] max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 mt-6">
      <h2 className="text-center font-extrabold mb-4">Сброс пароля</h2>

      {status === "sent" ? (
        <div className="text-sm text-green-600 text-center">
          Письмо с инструкциями отправлено на ваш email. Проверьте почту.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ваш email"
            required
            className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-2xl font-medium"
            >
              Отправить
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-2xl border"
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetRequest;
