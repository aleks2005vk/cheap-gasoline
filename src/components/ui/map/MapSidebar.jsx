import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// ПРАВИЛЬНЫЙ ПУТЬ: поднимаемся на 3 уровня (map -> ui -> components -> src) и идем в features
import { selectCurrentToken } from "../../../features/auth/authSlice";
import GoogleAd from "../Ads/GoogleAd";

const MapSidebar = ({ stations, selectedPoint, onPointClick, setStations }) => {
  const navigate = useNavigate();
  const token = useSelector(selectCurrentToken); // Токен для авторизованных запросов
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef({});
  const [filterMode, setFilterMode] = useState("nearest");

  // Умный скролл: центрирует выбранную карточку в списке
  useEffect(() => {
    if (selectedPoint && scrollContainerRef.current) {
      const targetCard = cardRefs.current[selectedPoint.id];
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedPoint]);

  // Функция ручного обновления цены (ИСПРАВЛЕН URL И ДОБАВЛЕН ТОКЕН)
  const handlePriceClick = async (station, fuelId, currentLabel) => {
    const newVal = prompt(`Введите цену для ${currentLabel}:`);
    if (!newVal || isNaN(parseFloat(newVal))) return;

    try {
      const response = await fetch(
        `https://cheap-gasoline.onrender.com/api/update-price-manual`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            station_id: station.id,
            brand: station.brand,
            prices: { [fuelId]: newVal },
          }),
        },
      );

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
    }
  };

  // Фильтрация и сортировка заправок
  const filteredStations = (stations || [])
    .filter((s) =>
      filterMode === "nearest" ? true : s.prices?.some((p) => p.price !== "—"),
    )
    .sort((a, b) =>
      filterMode === "nearest" ? (a.distance || 0) - (b.distance || 0) : 0,
    );

  return (
    <div className="fixed bottom-0 right-0 md:top-0 h-[65vh] md:h-screen w-full md:w-96 flex flex-col bg-white rounded-t-[3rem] md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl z-[1001] border-t md:border-t-0 md:border-l border-gray-100 transition-all duration-500 ease-in-out">
      {/* iOS Drag Handle (только для мобилок) */}
      <div className="flex justify-center p-3 md:hidden">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Шапка с фильтрами */}
      <div className="px-6 py-2 sticky top-0 bg-white/95 backdrop-blur-md z-10 md:pt-20">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {["nearest", "withPrices"].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase transition-all whitespace-nowrap ${
                filterMode === mode
                  ? "bg-black text-white shadow-lg"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {mode === "nearest" ? "📍 Рядом" : "💰 С ценами"}
            </button>
          ))}
        </div>
      </div>

      {/* Список карточек заправок */}
      <div
        ref={scrollContainerRef}
        className="flex-1 px-6 space-y-4 overflow-y-auto no-scrollbar pb-24"
      >
        {filteredStations.map((station) => {
          const isSelected = selectedPoint?.id === station.id;
          return (
            <div
              key={station.id}
              ref={(el) => (cardRefs.current[station.id] = el)}
              onClick={() => onPointClick(station)}
              className={`p-5 rounded-[2.5rem] transition-all border-2 cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-blue-50/30 shadow-sm scale-[1.01]"
                  : "border-transparent bg-gray-50/50 shadow-sm hover:border-gray-200"
              }`}
            >
              {/* Информация о заправке */}
              <div className="mb-4 px-1">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">
                  {station.name}
                </h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {station.brand} • {station.distance?.toFixed(1) || 0} км
                </p>
              </div>

              {/* Сетка цен */}
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
                    className="p-3 bg-white rounded-2xl border border-gray-100 flex flex-col items-center hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <span className="text-[7px] font-black text-gray-400 uppercase mb-1">
                      {p.type}
                    </span>
                    <span className="text-base font-black text-gray-800">
                      {p.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Дополнительные действия при выборе (стиль iOS) */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/add-photo?id=${station.id}`);
                    }}
                    className="w-full py-4 bg-blue-600 text-white text-[10px] font-black rounded-2xl shadow-lg active:scale-95 hover:bg-blue-700 transition-all"
                  >
                    📸 ОБНОВИТЬ ЦЕНЫ ЧЕРЕЗ ФОТО
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`yandexnavi://build_route_on_map?lat_to=${station.lat}&lon_to=${station.lng}`}
                      className="py-3 bg-[#FFCC00] text-black text-[10px] font-black rounded-xl text-center uppercase shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ЯНДЕКС
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 bg-white border border-gray-200 text-gray-600 text-[10px] font-black rounded-xl text-center uppercase shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      GOOGLE MAPS
                    </a>
                  </div>

                  <div className="text-center text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                    Построить маршрут
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {/* Можно добавить рекламу в конец списка */}
        <div className="mt-4">
          <GoogleAd />
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;
