import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../../features/auth/authSlice";
import { login } from "../../app/api/fakeAuth";

const UserLoginForm = ({ switchForm, onClose }) => {
  const [values, setValues] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(values);
      dispatch(setCredentials(result));
      if (onClose) onClose();
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-6">
      <h2 className="text-2xl font-black text-center mb-6 text-gray-800 uppercase tracking-tighter">
        Войти
      </h2>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          onChange={handleChange}
          className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          required
          onChange={handleChange}
          className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all"
        >
          {loading ? "Загрузка..." : "Войти"}
        </button>
      </form>
      <div className="flex flex-col gap-3 mt-6 text-center text-sm">
        <p className="text-gray-500">
          Нет аккаунта?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-blue-600 font-bold hover:underline"
          >
            Создать
          </button>
        </p>
        <button
          onClick={() => navigate("/reset-password")}
          className="text-gray-400 hover:text-blue-500 transition-colors uppercase text-[10px] font-black"
        >
          Забыли пароль?
        </button>
      </div>
    </div>
  );
};

export default UserLoginForm;
