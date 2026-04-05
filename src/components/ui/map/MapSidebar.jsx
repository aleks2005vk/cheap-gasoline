import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// ИСПРАВИЛ ПУТЬ К AUTH SLICE (3 ТОЧКИ)
import { selectCurrentUser } from "../../../features/auth/authSlice";
// ИМПОРТ КОНФИГА
import { API_URL } from "../../../config";

// СОПОСТАВЛЕНИЕ РОЛЕЙ С ПРАВАМИ
const ROLE_CONFIG = {
  admin: {
    label: "👑 АДМИНИСТРАТОР",
    color: "bg-red-100 text-red-700",
    canUpdate: true,
  },
  station_owner: {
    label: "🏢 ВЛАДЕЛЕЦ",
    color: "bg-blue-100 text-blue-700",
    canUpdate: true,
  },
  moderator: {
    label: "✓ МОДЕРАТОР",
    color: "bg-green-100 text-green-700",
    canUpdate: true,
  },
  user: {
    label: "👤 ПОЛЬЗОВАТЕЛЬ",
    color: "bg-gray-100 text-gray-700",
    canUpdate: true,
  },
  guest: {
    label: "🔒 ГОСТЬ",
    color: "bg-gray-50 text-gray-500",
    canUpdate: false,
  },
};

const MapSidebar = ({ stations, selectedPoint, onPointClick, setStations }) => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef({});
  const [filterMode, setFilterMode] = useState("nearest");
  
  // Новые состояния для слайдера
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sidebarRef = useRef(null);

  // ОПРЕДЕЛЕНИЕ ТЕКУЩЕЙ РОЛИ
  const currentRole = user?.role || "guest";
  const roleConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.guest;

  // ФУНКЦИЯ ДЛЯ ПРОВЕРКИ, МОЖЕТ ЛИ ПОЛЬЗОВАТЕЛЬ ОБНОВИТЬ ЦЕНУ ДЛЯ СТАНЦИИ
  const canUpdatePrice = (stationId) => {
    if (!user || currentRole === "guest") return false;
    if (currentRole === "admin" || currentRole === "moderator") return true;
    if (currentRole === "station_owner") {
      // Проверяем, принадлежит ли станция пользователю
      return user.managed_stations?.includes(stationId) ?? false;
    }
    if (currentRole === "user") return true; // USER может предлагать цены
    return false;
  };

  // Функции для управления слайдером
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Предотвращаем скролл страницы
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 100; // Минимальное расстояние для срабатывания
    
    if (deltaY > threshold) {
      // Свайп вниз - закрываем
      setIsExpanded(false);
    } else if (deltaY < -threshold) {
      // Свайп вверх - раскрываем
      setIsExpanded(true);
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const handleDoubleClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Вычисляем трансформацию во время перетаскивания
  const getTransform = () => {
    if (!isDragging) return '';
    const deltaY = Math.max(0, currentY - startY);
    return `translateY(${deltaY}px)`;
  };

  useEffect(() => {
    if (selectedPoint && scrollContainerRef.current) {
      const targetCard = cardRefs.current[selectedPoint.id];
      if (targetCard) {
        const container = scrollContainerRef.current;
        container.scrollTo({
          top:
            targetCard.offsetTop -
            container.offsetHeight / 2 +
            targetCard.offsetHeight / 2,
          behavior: "smooth",
        });
      }
    }
  }, [selectedPoint]);

  const handlePriceClick = async (station, fuelId, currentLabel) => {
    const newVal = prompt(`Введите цену для ${currentLabel}:`);
    if (!newVal || isNaN(parseFloat(newVal))) return;

    try {
      // ИСПОЛЬЗУЕМ API_URL ИЗ КОНФИГА
      const response = await fetch(`${API_URL}/api/update-price-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_id: station.id,
          user_id: user?.id,
          prices: { [fuelId]: newVal },
        }),
      });

      if (response.ok) {
        setStations((prev) =>
          prev.map((s) =>
            s.id === station.id
              ? {
                  ...s,
                  prices: s.prices.map((p) =>
                    p.id === fuelId ? { ...p, price: newVal } : p,
                  ),
                }
              : s,
          ),
        );
      }
    } catch (err) {
      console.error("Ошибка при обновлении цены:", err);
      alert("Ошибка соединения с сервером");
    }
  };

  const filteredStations = stations
    .filter((s) =>
      filterMode === "nearest"
        ? true
        : s.prices?.some((p) => p.price && p.price !== "—"),
    )
    .sort((a, b) =>
      filterMode === "nearest" ? (a.distance || 0) - (b.distance || 0) : 0,
    );

  return (
    <div 
      ref={sidebarRef}
      className={`fixed bottom-0 left-0 right-0 md:top-20 md:right-4 md:left-auto md:bottom-24 md:w-96 ${
        isExpanded 
          ? 'h-full md:h-full' 
          : 'h-[50vh] md:h-auto md:max-h-[80vh]'
      } flex flex-col bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-2xl z-[1001] rounded-t-[2.5rem] md:rounded-3xl border border-gray-100 transition-all duration-300`}
      style={{ transform: getTransform() }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex justify-center py-3 md:hidden bg-white rounded-t-[2.5rem] cursor-grab active:cursor-grabbing">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <div className="px-6 py-2 bg-white z-10 border-b border-gray-50 md:rounded-t-3xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {["nearest", "withPrices"].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-6 py-2 rounded-2xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                filterMode === mode
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {mode === "nearest" ? "📍 Рядом" : "💰 С ценами"}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar ${
          isExpanded ? 'pb-4' : 'pb-20 md:pb-4'
        }`}
      >
        {filteredStations.map((station) => {
          const isSelected = selectedPoint?.id === station.id;
          return (
            <div
              key={station.id}
              ref={(el) => (cardRefs.current[station.id] = el)}
              onClick={() => onPointClick(station)}
              className={`p-5 rounded-[2rem] transition-all border-2 cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-white shadow-xl scale-[1.02]"
                  : "border-transparent bg-gray-50/80 hover:border-gray-200"
              }`}
            >
              <div className="mb-4 px-1">
                <h3 className="text-lg font-black text-gray-900 uppercase leading-tight">
                  {station.name}
                </h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  {station.brand}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {station.prices?.map((p, i) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      if (isSelected) {
                        e.stopPropagation();
                        handlePriceClick(station, p.id, p.type);
                      }
                    }}
                    className="p-3 bg-white border border-gray-100 rounded-2xl flex flex-col items-center hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-[7px] font-black text-gray-400 uppercase mb-1">
                      {p.type}
                    </span>
                    <span className="text-base font-black text-gray-800">
                      {p.price || "—"}
                    </span>
                  </div>
                ))}
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in fade-in zoom-in duration-300">
                  {/* БЕЙДЖ С РОЛЬЮ ПОЛЬЗОВАТЕЛЯ */}
                  <div
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-center ${roleConfig.color}`}
                  >
                    {roleConfig.label}
                  </div>

                  {/* КНОПКА ОБНОВЛЕНИЯ ЦЕНЫ С ПРОВЕРКОЙ ДОСТУПА */}
                  {user && canUpdatePrice(station.id) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/add-photo?id=${station.id}`);
                      }}
                      className="w-full py-4 bg-blue-600 text-white text-[10px] font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                    >
                      📸 ОБНОВИТЬ ЦЕНЫ
                      {currentRole === "user" && " (на модерации)"}
                    </button>
                  ) : currentRole === "guest" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/login");
                      }}
                      className="w-full py-4 bg-gray-300 text-gray-600 text-[10px] font-black rounded-2xl shadow-lg cursor-not-allowed"
                    >
                      🔒 ВОЙДИТЕ ДЛЯ ОБНОВЛЕНИЯ
                    </button>
                  ) : currentRole === "station_owner" &&
                    !canUpdatePrice(station.id) ? (
                    <div className="w-full py-4 bg-orange-100 text-orange-700 text-[10px] font-black rounded-2xl text-center">
                      ⚠️ ЭТА СТАНЦИЯ НЕ ВАША
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`yandexnavi://build_route_on_map?lat_to=${station.lat}&lon_to=${station.lng}`}
                      className="py-3 bg-yellow-400 text-black text-[10px] font-black rounded-xl text-center uppercase shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ЯНДЕКС
                    </a>
                    <a
                      href={`http://maps.google.com/maps?daddr=${station.lat},${station.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 bg-gray-100 text-gray-600 text-[10px] font-black rounded-xl text-center uppercase"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GOOGLE
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapSidebar;
