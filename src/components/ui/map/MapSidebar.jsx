import React, { useMemo, useState, useEffect } from "react";
import RouteButtons from "./RouteButtons";

// Flexible sidebar: accepts `points` and handles search/sort/favorites locally
const Sidebar = ({
  isMobile = false,
  setShowSidebar = () => {},
  points = [],
  onPointClick = () => {},
  selectedPoint = null,
  userLocation = null,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites]);

  const toggleFavorite = (point, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const id = point.id ?? `${point.lat}_${point.lng}`;
    setFavorites((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const getMinPrice = (prices) => {
    if (!prices) return null;
    const vals = Object.values(prices).filter((v) => v != null && !isNaN(v));
    if (vals.length === 0) return null;
    return Math.min(...vals);
  };

  const filtered = useMemo(() => {
    const toRad = (v) => (v * Math.PI) / 180;
    const computeDistance = (p) => {
      if (p.distance != null) return p.distance;
      if (!userLocation) return null;
      const R = 6371;
      const dLat = toRad(p.lat - userLocation.lat);
      const dLon = toRad(p.lng - userLocation.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userLocation.lat)) *
          Math.cos(toRad(p.lat)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let list = Array.isArray(points) ? points.slice() : [];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }
    if (favoritesOnly) {
      list = list.filter((p) =>
        favorites.includes(p.id ?? `${p.lat}_${p.lng}`)
      );
    }
    list = list.map((p) => ({
      ...p,
      distance: p.distance ?? computeDistance(p),
    }));
    if (sortBy === "distance")
      list.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    if (sortBy === "name")
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortBy === "price")
      list.sort(
        (a, b) =>
          (getMinPrice(a.prices) || 9999) - (getMinPrice(b.prices) || 9999)
      );
    return list;
  }, [points, searchTerm, favoritesOnly, favorites, sortBy, userLocation]);

  return (
    <div className={`flex flex-col h-full bg-white z-50`}>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-bold">Ближайшие заправки</h3>
        {isMobile && (
          <button
            onClick={() => setShowSidebar(false)}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-4 border-b space-y-2">
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        />
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm"
          >
            <option value="distance">По расстоянию</option>
            <option value="name">По имени</option>
            <option value="price">По цене</option>
          </select>
          <button
            onClick={() => setFavoritesOnly((f) => !f)}
            className={`px-2 py-2 rounded ${
              favoritesOnly ? "bg-yellow-100" : "bg-gray-100"
            }`}
          >
            ★
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length > 0 ? (
          filtered.map((point) => {
            const id = point.id ?? `${point.lat}_${point.lng}`;
            const isFav = favorites.includes(id);
            return (
              <div
                key={id}
                onClick={() => onPointClick(point)}
                className={`p-2 rounded cursor-pointer border transition ${
                  selectedPoint === point
                    ? "bg-blue-100 border-blue-500"
                    : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{point.name}</p>
                    {isMobile && point.description && (
                      <p className="text-xs text-gray-600">
                        {point.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(point, e)}
                    className={`text-lg ${
                      isFav
                        ? "text-yellow-500"
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  >
                    ★
                  </button>
                </div>
                <div className="flex justify-between mt-1">
                  {point.prices && (
                    <p className="text-xs text-gray-500">
                      From: ${getMinPrice(point.prices)?.toFixed(2) || "-"}
                    </p>
                  )}
                  {point.distance != null && (
                    <p className="text-xs text-blue-600 font-medium">
                      {point.distance.toFixed(1)} km
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">Заправки не найдены</p>
        )}
      </div>

      <div className="border-t bg-white p-4 mt-auto">
        <RouteButtons
          userLocation={userLocation}
          selectedPoint={selectedPoint}
        />
      </div>
    </div>
  );
};

export default Sidebar;
