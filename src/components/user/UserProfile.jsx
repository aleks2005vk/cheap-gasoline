import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCurrentUser,
  selectCurrentToken,
  setCredentials,
  logout,
} from "../../features/auth/authSlice";

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  // Используем аватар из Redux или пустую строку
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  // Синхронизируем локальный стейт с данными из Redux при загрузке
  useEffect(() => {
    if (user) {
      setPreviewAvatar(user.avatar || "");
      setFormData({ name: user.name || "" });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <button
          onClick={() => navigate("/")}
          className="text-white bg-blue-600 px-8 py-3 rounded-2xl font-bold"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  // Функция для обработки загрузки фото
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Сохраняем строку Base64 (она длинная, но будет работать везде)
        setPreviewAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setLoading(true);

    // Имитируем запрос к серверу
    setTimeout(() => {
      dispatch(
        setCredentials({
          user: {
            ...user,
            name: formData.name,
            avatar: previewAvatar, // Передаем Base64 строку в Redux
          },
          accessToken: token,
        }),
      );
      setIsEditing(false);
      setLoading(false);
      alert("Профиль обновлен!");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-8 text-white/50 hover:text-blue-400 transition-colors uppercase text-xs font-black tracking-widest"
        >
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая панель */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center backdrop-blur-md">
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <img
                src={
                  previewAvatar ||
                  "https://ui-avatars.com/api/?name=" + user.name
                }
                className="w-full h-full object-cover rounded-full border-4 border-blue-500/30 shadow-2xl shadow-blue-500/20"
                alt="profile"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold uppercase"
              >
                Change Photo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <h2 className="text-2xl font-black">{user.name}</h2>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-6">
              {user.email}
            </p>

            <div className="bg-green-500/10 border border-green-500/20 text-green-400 py-2 px-4 rounded-full text-[10px] font-black uppercase inline-block">
              Status: Verified User
            </div>
          </div>

          {/* Правая панель */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 flex justify-between items-center shadow-2xl shadow-blue-900/20">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">
                  Get PRO Version
                </h3>
                <p className="text-white/70 text-xs">
                  No ads and exclusive map features.
                </p>
              </div>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black uppercase text-[10px]">
                Upgrade
              </button>
            </div>

            {/* Settings Form */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black uppercase text-sm tracking-widest">
                  General Settings
                </h4>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-blue-400 font-bold uppercase"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase text-white/40 font-black ml-2">
                      Display Name
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-blue-500 mt-1"
                      placeholder="Enter name"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-colors"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4 opacity-60">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-xs uppercase font-bold">Name</span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-xs uppercase font-bold">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  dispatch(logout());
                  navigate("/");
                }}
                className="w-full mt-8 py-4 border border-red-500/20 text-red-500 rounded-xl font-black uppercase text-[10px] hover:bg-red-500/10 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
