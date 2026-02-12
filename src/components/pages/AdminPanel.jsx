import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectCurrentToken,
} from "../../features/auth/authSlice";

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Двойная проверка безопасности
    const isAdmin =
      user?.is_admin || user?.role === "admin" || user?.role === "superadmin";

    if (!token || !isAdmin) {
      navigate("/");
      return;
    }

    fetchUsers();
    fetchLogs();
  }, [token, user, navigate]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError("Ошибка доступа к API");
      }
    } catch (err) {
      setError("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/api/admin/logs?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8001/api/admin/user/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        },
      );
      if (res.ok) {
        setSuccessMsg("✓ Роль изменена");
        setTimeout(() => setSuccessMsg(""), 2000);
        fetchUsers();
      }
    } catch (err) {
      setError("Ошибка изменения");
    }
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Удалить пользователя ${email}?`)) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:8001/api/admin/user/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setSuccessMsg("✓ Пользователь удален");
        fetchUsers();
      }
    } catch (err) {
      setError("Ошибка удаления");
    }
  };

  const banUser = async (userId, email) => {
    const reason = prompt(`Причина бана для ${email}:`);
    if (reason === null) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:8001/api/admin/user/${userId}/ban`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );
      if (res.ok) {
        setSuccessMsg("✓ Статус изменен");
        fetchUsers();
      }
    } catch (err) {
      setError("Ошибка при бане");
    }
  };

  // Пока проверяем права или грузим данные
  if (loading && users.length === 0)
    return <div className="p-10 text-white">Загрузка панели...</div>;

  return (
    <div className="bg-neutral-900 text-white min-h-screen p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 tracking-tighter uppercase">
            🔐 Admin Control
          </h1>
          <p className="text-neutral-400 text-sm">
            Управление системой мониторинга GasApp
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 mb-4">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-200 mb-4">
            {successMsg}
          </div>
        )}

        <div className="flex gap-4 mb-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-2 transition-all ${activeTab === "users" ? "border-b-2 border-blue-500 text-blue-400" : "text-neutral-500 hover:text-white"}`}
          >
            Пользователи ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-4 px-2 transition-all ${activeTab === "logs" ? "border-b-2 border-blue-500 text-blue-400" : "text-neutral-500 hover:text-white"}`}
          >
            Логи активности
          </button>
        </div>

        {activeTab === "users" && (
          <div className="bg-neutral-800/50 rounded-3xl border border-white/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-neutral-400 text-xs uppercase tracking-widest">
                  <th className="p-4 font-bold">Пользователь</th>
                  <th className="p-4 font-bold">Роль</th>
                  <th className="p-4 font-bold">Статус</th>
                  <th className="p-4 font-bold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{u.email}</div>
                      <div className="text-[10px] text-neutral-500">
                        ID: {u.id}
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.role || (u.is_admin ? "admin" : "user")}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        disabled={u.role === "superadmin"}
                        className="bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="banned">Banned</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${u.is_admin ? "bg-blue-500/20 text-blue-400" : "bg-neutral-700 text-neutral-400"}`}
                      >
                        {u.is_admin ? "Administrator" : "Client"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => banUser(u.id, u.email)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-xs uppercase font-bold"
                        >
                          Ban
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.email)}
                          className="p-2 hover:bg-red-700/20 text-red-600 rounded-lg transition-colors text-xs uppercase font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-2 bg-black/30 p-4 rounded-3xl border border-white/5 max-h-[600px] overflow-y-auto font-mono text-[11px]">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 border-b border-white/5 flex gap-4"
                >
                  <span className="text-blue-500">
                    [{new Date(log.created_at).toLocaleString()}]
                  </span>
                  <span className="text-purple-400 font-bold uppercase">
                    {log.action}:
                  </span>
                  <span className="text-neutral-300">{log.details}</span>
                </div>
              ))
            ) : (
              <div className="text-neutral-600 italic">Логов пока нет...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
