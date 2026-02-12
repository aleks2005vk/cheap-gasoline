import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";

const MapSidebar = ({ stations, selectedPoint, onPointClick, setStations }) => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef({});
  const [filterMode, setFilterMode] = useState("nearest");

  // Умный скролл: сохранил полностью твою логику центрирования
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

  // Твоя функция обновления цены (добавил только ID юзера для БД)
  const handlePriceClick = async (station, fuelId, currentLabel) => {
    const newVal = prompt(`Введите цену для ${currentLabel}:`);
    if (!newVal || isNaN(parseFloat(newVal))) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8001/api/update-price-manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station_id: station.id,
            user_id: user?.id, // Чтобы в логах было видно, кто обновил
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

  // Твоя фильтрация и сортировка
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
    <div className="fixed bottom-0 md:top-0 md:right-0 w-full md:w-96 h-[60vh] md:h-screen flex flex-col bg-white overflow-hidden shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] md:shadow-2xl z-[1001] border-t md:border-t-0 md:border-l border-gray-100 rounded-t-[2.5rem] md:rounded-t-none transition-all duration-300">
      {/* Ручка для свайпа на телефоне */}
      <div className="flex justify-center py-3 md:hidden bg-white">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
      </div>

      {/* Фильтры */}
      <div className="px-6 py-2 md:pt-20 sticky top-0 bg-white z-10 border-b border-gray-50">
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

      {/* Список заправок */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-10"
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
                  ? "border-blue-500 bg-white shadow-xl"
                  : "border-transparent bg-gray-50/50 hover:border-gray-200"
              }`}
            >
              <div className="mb-4 px-1">
                <h3 className="text-lg font-black text-gray-900 uppercase leading-tight">
                  {station.name}
                </h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  {station.brand} • {station.distance?.toFixed(1) || 0} км
                </p>
              </div>

              {/* Сетка цен (все кнопки работают!) */}
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
                    className="p-3 bg-white border border-gray-100 rounded-2xl flex flex-col items-center hover:bg-gray-50 transition-colors"
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

              {/* Кнопки действий (твоя навигация) */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/add-photo?id=${station.id}`);
                    }}
                    className="w-full py-4 bg-blue-600 text-white text-[10px] font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
                  >
                    📸 ОБНОВИТЬ ЦЕНЫ ЧЕРЕЗ ФОТО
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`yandexnavi://build_route_on_map?lat_to=${station.lat}&lon_to=${station.lng}`}
                      className="py-3 bg-yellow-400 text-black text-[10px] font-black rounded-xl text-center uppercase"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ЯНДЕКС
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
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
