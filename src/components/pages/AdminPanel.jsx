import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../app/api/authSlice";
import { API_URL } from "../../config";

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    newRole: "",
    station: "",
    banReason: ""
  });

  // Проверка доступа (только для ADMIN)
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    
    fetchUsers();
    fetchStations();
  }, []);

  // Получить список пользователей
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError("Ошибка загрузки пользователей");
      }
    } catch (err) {
      setError("Соединение с сервером потеряно");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Получить список станций
  const fetchStations = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/stations`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStations(data);
      }
    } catch (err) {
      console.error("Ошибка загрузки станций", err);
    }
  };

  // Изменить роль пользователя
  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/change-user-role`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          new_role: newRole,
          reason: "Изменено администратором"
        })
      });

      if (response.ok) {
        fetchUsers();
        setFormData({ ...formData, newRole: "" });
        alert("✅ Роль успешно изменена");
      } else {
        alert("❌ Ошибка при изменении роли");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Соединение с сервером потеряно");
    }
  };

  // Привязать пользователя к станции
  const handleAssignStation = async (userId, stationId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/assign-user-to-station`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          station_id: stationId,
          role_at_station: "operator"
        })
      });

      if (response.ok) {
        fetchUsers();
        setFormData({ ...formData, station: "" });
        alert("✅ Пользователь назначен на станцию");
      } else {
        const data = await response.json();
        alert(`❌ Ошибка: ${data.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Соединение с сервером потеряно");
    }
  };

  // Заблокировать пользователя
  const handleBanUser = async (userId, reason) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/api/admin/ban-user/${userId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ban_reason: reason })
      });

      if (response.ok) {
        fetchUsers();
        alert("✅ Пользователь заблокирован");
      } else {
        alert("❌ Ошибка при блокировке");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Соединение с сервером потеряно");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">⏳ Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* ЗАГОЛОВОК */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">👑 АДМИН-ПАНЕЛЬ</h1>
          <p className="text-gray-600 mt-2">Управление пользователями и ролями</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ */}
        <div className="bg-white rounded-3xl shadow-lg p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-black">EMAIL</th>
                <th className="px-4 py-3 text-left font-black">ТЕКУЩАЯ РОЛЬ</th>
                <th className="px-4 py-3 text-left font-black">СТАТУС</th>
                <th className="px-4 py-3 text-left font-black">СТАНЦИЙ</th>
                <th className="px-4 py-3 text-center font-black">ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' :
                      u.role === 'station_owner' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'moderator' ? 'bg-green-100 text-green-700' :
                      u.role === 'user' ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-xs ${
                      u.is_banned ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {u.is_banned ? '🔒 ЗАБЛОКИРОВАН' : '✅ АКТИВЕН'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">
                    {u.managed_stations_count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                    >
                      ⚙️ УПРАВЛЯТЬ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Пользователей не найдено
            </div>
          )}
        </div>

        {/* МОДАЛЬ ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЕМ */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-black mb-4">📋 {selectedUser.email}</h2>

              {/* ИЗМЕНИТЬ РОЛЬ */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">🔄 ИЗМЕНИТЬ РОЛЬ:</label>
                <select
                  value={formData.newRole}
                  onChange={(e) => setFormData({...formData, newRole: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-bold"
                >
                  <option value="">-- Выберите роль --</option>
                  <option value="admin">👑 ADMIN</option>
                  <option value="station_owner">🏢 STATION_OWNER</option>
                  <option value="moderator">✓ MODERATOR</option>
                  <option value="user">👤 USER</option>
                  <option value="guest">🔒 GUEST</option>
                </select>
                {formData.newRole && (
                  <button
                    onClick={() => handleChangeRole(selectedUser.id, formData.newRole)}
                    className="mt-2 w-full px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                  >
                    ✅ СОХРАНИТЬ РОЛЬ
                  </button>
                )}
              </div>

              {/* ПРИВЯЗАТЬ К СТАНЦИИ */}
              {selectedUser.role === "station_owner" && (
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">🏪 ПРИВЯЗАТЬ К СТАНЦИИ:</label>
                  <select
                    value={formData.station}
                    onChange={(e) => setFormData({...formData, station: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="">-- Выберите станцию --</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.brand})</option>
                    ))}
                  </select>
                  {formData.station && (
                    <button
                      onClick={() => handleAssignStation(selectedUser.id, parseInt(formData.station))}
                      className="mt-2 w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                    >
                      ✅ НАЗНАЧИТЬ СТАНЦИЮ
                    </button>
                  )}
                </div>
              )}

              {/* ЗАБЛОКИРОВАТЬ */}
              {!selectedUser.is_banned && (
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">🔒 БЛОКИРОВАТЬ:</label>
                  <input
                    type="text"
                    placeholder="Причина блокировки"
                    value={formData.banReason}
                    onChange={(e) => setFormData({...formData, banReason: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-bold mb-2"
                  />
                  <button
                    onClick={() => handleBanUser(selectedUser.id, formData.banReason)}
                    className="w-full px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                  >
                    ⚠️ ЗАБЛОКИРОВАТЬ ПОЛЬЗОВАТЕЛЯ
                  </button>
                </div>
              )}

              {/* ЗАКРЫТЬ */}
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300"
              >
                ❌ ЗАКРЫТЬ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
