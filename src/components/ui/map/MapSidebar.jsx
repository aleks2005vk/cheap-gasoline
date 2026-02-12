import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const MapSidebar = ({ stations, selectedPoint, onPointClick, setStations }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef({});
  const [filterMode, setFilterMode] = useState("nearest");

  // Умный скролл
  useEffect(() => {
    if (selectedPoint && scrollContainerRef.current) {
      const targetCard = cardRefs.current[selectedPoint.id];
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedPoint]);

  // Функция ручного обновления цены (ИСПРАВЛЕН URL)
  const handlePriceClick = async (station, fuelId, currentLabel) => {
    const newVal = prompt(`Введите цену для ${currentLabel}:`);
    if (!newVal || isNaN(parseFloat(newVal))) return;

    try {
      const response = await fetch(
        `https://cheap-gasoline.onrender.com/api/update-price-manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  const filteredStations = stations
    .filter((s) =>
      filterMode === "nearest" ? true : s.prices?.some((p) => p.price !== "—"),
    )
    .sort((a, b) => (filterMode === "nearest" ? a.distance - b.distance : 0));

  return (
    /* Контейнер: на десктопе сбоку, на мобилках — шторка снизу */
    <div className="fixed bottom-0 right-0 md:top-0 h-[60vh] md:h-screen w-full md:w-96 flex flex-col bg-white rounded-t-[3rem] md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl z-[1001] border-t md:border-t-0 md:border-l border-gray-100 transition-all duration-500 ease-in-out">
      {/* Индикатор для свайпа (стиль iPhone) */}
      <div className="flex justify-center p-3 md:hidden">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Шапка */}
      <div className="px-6 py-2 sticky top-0 bg-white/95 backdrop-blur-md z-10">
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
              {mode === "nearest" ? "📍 Поблизости" : "💰 С ценами"}
            </button>
          ))}
        </div>
      </div>

      {/* Список */}
      <div
        ref={scrollContainerRef}
        className="flex-1 px-6 space-y-4 overflow-y-auto no-scrollbar pb-20"
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
                  ? "border-blue-500 bg-blue-50/30 shadow-sm"
                  : "border-transparent bg-gray-50/50 hover:bg-gray-100"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-md font-black text-gray-900 leading-tight uppercase">
                    {station.name}
                  </h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                    {station.brand} • {station.distance?.toFixed(1) || 0} км
                  </p>
                </div>
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
                    className="p-3 bg-white rounded-2xl border border-gray-100 flex flex-col items-center shadow-sm"
                  >
                    <span className="text-[8px] font-bold text-gray-400 uppercase mb-1">
                      {p.type}
                    </span>
                    <span className="text-sm font-black text-gray-800">
                      {p.price || "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Кнопки действий для iPhone */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 animate-in fade-in zoom-in-95 duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/add-photo?id=${station.id}`);
                    }}
                    className="w-full py-3.5 bg-blue-600 text-white text-[11px] font-black rounded-2xl shadow-md active:scale-95 transition-all"
                  >
                    📸 ОБНОВИТЬ ПО ФОТО
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`yandexnavi://build_route_on_map?lat_to=${station.lat}&lon_to=${station.lng}`}
                      className="py-3 bg-[#FFCC00] text-black text-[10px] font-black rounded-xl text-center"
                    >
                      ЯНДЕКС
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 bg-white border border-gray-200 text-gray-600 text-[10px] font-black rounded-xl text-center"
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
