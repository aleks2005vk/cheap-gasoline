import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// Исправленный путь: поднимаемся на 2 уровня до src и заходим в features
import { selectCurrentToken } from "../../features/auth/authSlice";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("stats"); // stats | users
  const [stats, setStats] = useState({
    total_stations: 0,
    total_users: 0,
    recent_updates: [],
  });
  const [stations, setStations] = useState([]);
  const [users, setUsers] = useState([]);
  const [pass, setPass] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  // Получаем токен из Redux
  const token = useSelector(selectCurrentToken);
  const navigate = useNavigate();

  // Состояние для создания новой станции
  const [newStation, setNewStation] = useState({
    name: "",
    brand: "Lukoil",
    lat: "",
    lng: "",
  });

  // Вход в админку по локальному паролю
  const handleLogin = () => {
    if (pass === "admin123") setIsAuth(true);
    else alert("Доступ запрещен!");
  };

  // Загрузка всех данных из API
  const loadData = async () => {
    if (!token) {
      console.error("Токен отсутствует в Redux!");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const [stRes, sRes, uRes] = await Promise.all([
        fetch("http://127.0.0.1:8001/api/admin/stats", { headers }),
        fetch("http://127.0.0.1:8001/api/stations", { headers }),
        fetch("http://127.0.0.1:8001/api/admin/users", { headers }),
      ]);

      if (stRes.ok) setStats(await stRes.json());
      if (sRes.ok) setStations(await sRes.json());
      if (uRes.ok) setUsers(await uRes.json());
    } catch (e) {
      console.error("Ошибка сети при загрузке данных:", e);
    }
  };

  useEffect(() => {
    if (isAuth) loadData();
  }, [isAuth]);

  // Удаление станции
  const deleteStation = async (id) => {
    if (!window.confirm("Удалить заправку?")) return;
    try {
      await fetch(`http://127.0.0.1:8001/api/admin/stations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (e) {
      alert("Ошибка при удалении");
    }
  };

  // Создание новой станции
  const handleCreateStation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8001/api/admin/stations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStation),
      });
      if (res.ok) {
        setNewStation({ name: "", brand: "Lukoil", lat: "", lng: "" });
        loadData();
      }
    } catch (e) {
      alert("Ошибка создания");
    }
  };

  // Блокировка/Разблокировка
  const toggleBlock = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8001/api/admin/users/${id}/toggle-block`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (e) {
      alert("Ошибка статуса");
    }
  };

  // Экран логина в админку
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-slate-700">
          <h2 className="text-white text-2xl font-black mb-6 text-center uppercase tracking-tight">
            Admin Area
          </h2>
          <input
            type="password"
            placeholder="Введите пароль..."
            className="w-full p-4 rounded-2xl bg-slate-700 text-white mb-4 outline-none border border-slate-600 focus:border-blue-500 transition-all"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase transition-transform active:scale-95"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            Control Center
          </h1>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === "stats" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:bg-gray-50"}`}
            >
              Дашборд
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === "users" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:bg-gray-50"}`}
            >
              Юзеры
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all"
            >
              На карту
            </button>
          </div>
        </div>

        {activeTab === "stats" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Левая колонка */}
            <div className="lg:col-span-2 space-y-8">
              {/* Форма новой станции */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-widest">
                  Добавить заправку
                </h3>
                <form
                  onSubmit={handleCreateStation}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    placeholder="Название (напр. Socar Vake)"
                    className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-slate-700 border border-transparent focus:border-blue-400"
                    value={newStation.name}
                    onChange={(e) =>
                      setNewStation({ ...newStation, name: e.target.value })
                    }
                    required
                  />
                  <select
                    className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-slate-700 border border-transparent focus:border-blue-400"
                    value={newStation.brand}
                    onChange={(e) =>
                      setNewStation({ ...newStation, brand: e.target.value })
                    }
                  >
                    <option value="Lukoil">Lukoil</option>
                    <option value="Socar">Socar</option>
                    <option value="Rompetrol">Rompetrol</option>
                    <option value="Wissol">Wissol</option>
                    <option value="Gulf">Gulf</option>
                  </select>
                  <input
                    type="number"
                    step="any"
                    placeholder="Широта (Lat)"
                    className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-slate-700 border border-transparent focus:border-blue-400"
                    value={newStation.lat}
                    onChange={(e) =>
                      setNewStation({ ...newStation, lat: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Долгота (Lng)"
                    className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-slate-700 border border-transparent focus:border-blue-400"
                    value={newStation.lng}
                    onChange={(e) =>
                      setNewStation({ ...newStation, lng: e.target.value })
                    }
                    required
                  />
                  <button className="md:col-span-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]">
                    Добавить на карту
                  </button>
                </form>
              </div>

              {/* Список заправок */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-widest">
                  Управление заправками
                </h3>
                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {stations.length === 0 && (
                    <p className="text-slate-400 italic text-center py-10">
                      Список пуст
                    </p>
                  )}
                  {stations.map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl group hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100 transition-all"
                    >
                      <div>
                        <div className="font-black text-slate-800">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-black uppercase">
                          {s.brand} • {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStation(s.id)}
                        className="bg-red-50 text-red-500 px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all uppercase"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Правая колонка: Активность */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-fit sticky top-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <h3 className="font-black uppercase text-slate-400 text-sm tracking-widest italic">
                  Live Activity
                </h3>
              </div>
              <div className="space-y-6">
                {stats.recent_updates?.length === 0 && (
                  <p className="text-slate-300 text-xs font-black uppercase text-center py-4">
                    Нет данных
                  </p>
                )}
                {stats.recent_updates?.map((u) => (
                  <div
                    key={u.id}
                    className="relative pl-5 border-l-4 border-blue-500 py-1"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-black text-blue-600 uppercase">
                        {u.username}
                      </span>
                      <span className="text-[9px] text-slate-300 font-bold">
                        {u.time}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 leading-tight mb-1">
                      {u.station}
                    </div>
                    <div className="text-xs text-slate-500 font-bold">
                      {u.fuel}:{" "}
                      <span className="text-emerald-500 font-black">
                        {u.price} GEL
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Вкладка: Пользователи */
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-6 text-[11px] font-black uppercase text-slate-400 border-b border-gray-100">
                      Никнейм
                    </th>
                    <th className="p-6 text-[11px] font-black uppercase text-slate-400 border-b border-gray-100">
                      Email
                    </th>
                    <th className="p-6 text-[11px] font-black uppercase text-slate-400 border-b border-gray-100 text-center">
                      Статус
                    </th>
                    <th className="p-6 text-[11px] font-black uppercase text-slate-400 border-b border-gray-100 text-right">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className={`${u.is_blocked ? "bg-red-50/30" : "hover:bg-gray-50/30"} transition-colors`}
                    >
                      <td className="p-6 font-black text-slate-800">
                        {u.username}
                      </td>
                      <td className="p-6 text-sm text-slate-500 font-medium">
                        {u.email}
                      </td>
                      <td className="p-6 text-center">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${u.is_blocked ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
                        >
                          {u.is_blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button
                          onClick={() => toggleBlock(u.id)}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${u.is_blocked ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"}`}
                        >
                          {u.is_blocked ? "Разбанить" : "Забанить"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
