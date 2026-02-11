import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const MapSidebar = ({ stations, selectedPoint, onPointClick }) => {
  const navigate = useNavigate();
  const cardRefs = useRef({});
  const [filterMode, setFilterMode] = useState("nearest");

  useEffect(() => {
    if (selectedPoint) {
      setTimeout(() => {
        cardRefs.current[selectedPoint.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    }
  }, [selectedPoint]);

  const filteredStations = stations
    .filter((s) => {
      if (filterMode === "nearest") return true;
      return Array.isArray(s.prices) && s.prices.some((p) => p.price !== "—");
    })
    .sort((a, b) => {
      if (filterMode === "nearest")
        return (a.distance || 999) - (b.distance || 999);
      const getMin = (s) =>
        Math.min(
          ...s.prices.map((p) => parseFloat(p.price)).filter((p) => !isNaN(p)),
        );
      return getMin(a) - getMin(b);
    });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["nearest", "withPrices", "cheapest"].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase transition-all whitespace-nowrap ${
                filterMode === mode
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {mode === "nearest"
                ? "📍 Рядом"
                : mode === "withPrices"
                  ? "💰 Цены"
                  : "🔥 Дешевые"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {filteredStations.map((station) => {
          const isSelected = selectedPoint?.id === station.id;
          return (
            <div
              key={station.id}
              ref={(el) => (cardRefs.current[station.id] = el)}
              onClick={() => onPointClick(station)}
              className={`p-5 rounded-[2rem] transition-all duration-300 border-2 cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-white shadow-xl scale-[1.02]"
                  : "border-transparent bg-white shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase leading-tight">
                    {station.name}
                  </h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">
                    {station.brand} • {station.distance?.toFixed(1)} км
                  </p>
                </div>
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[9px] font-bold uppercase">
                  Open
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {station.prices?.map((p, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center"
                  >
                    <span className="text-[8px] font-bold text-gray-400 uppercase">
                      {p.type}
                    </span>
                    <span className="text-base font-black text-gray-800">
                      {p.price}
                    </span>
                  </div>
                ))}
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/add-photo?id=${station.id}`);
                    }}
                    className="w-full py-4 bg-blue-600 text-white text-[11px] font-black rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    📸 ОБНОВИТЬ ЧЕРЕЗ ФОТО
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`yandexnavi://build_route_on_map?lat_to=${station.lat}&lon_to=${station.lng}`}
                      className="py-3 bg-yellow-400 text-black text-[10px] font-black rounded-xl text-center"
                    >
                      NAVIGATOR
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${station.lat},${station.lng}`}
                      className="py-3 bg-gray-100 text-gray-700 text-[10px] font-black rounded-xl text-center"
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
