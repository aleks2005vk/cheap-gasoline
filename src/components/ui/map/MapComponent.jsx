import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import MapSidebar from "./MapSidebar";
import { useNavigate, useLocation } from "react-router-dom";

// Кастомный маркер
const createCustomIcon = (isSelected = false) => {
  const size = isSelected ? 35 : 28;
  return L.divIcon({
    className: "custom-marker-wrapper",
    html: `
      <div class="marker-main ${isSelected ? "active" : ""}" 
           style="width: ${size}px; height: ${size}px;">
        <div class="marker-inner"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

const MapComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const [stations, setStations] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Инициализация карты
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
    }).setView([41.7151, 44.8271], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map,
    );

    markersRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
    });
    map.addLayer(markersRef.current);
    mapRef.current = map;

    // Решаем проблему "серой карты"
    setTimeout(() => {
      map.invalidateSize();
    }, 500);

    // Загрузка данных
    fetch("http://127.0.0.1:8001/api/stations")
      .then((res) => res.json())
      .then(setStations)
      .catch((err) => console.error("Ошибка загрузки АЗС:", err));
  }, []);

  // Отрисовка маркеров
  useEffect(() => {
    if (!markersRef.current || !stations.length) return;
    markersRef.current.clearLayers();

    stations.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], {
        icon: createCustomIcon(selectedPoint?.id === s.id),
      });

      marker.on("click", () => {
        setSelectedPoint(s);
        mapRef.current.flyTo([s.lat, s.lng], 16, { duration: 1 });
      });

      markersRef.current.addLayer(marker);
    });
  }, [stations, selectedPoint]);

  return (
    <div className="relative w-full h-full bg-neutral-900">
      <style>{`
        .marker-main { background: #2563eb; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .marker-main.active { background: #ef4444 !important; scale: 1.2; box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
        .marker-inner { width: 35%; height: 35%; background: white; border-radius: 50%; }
        .leaflet-container { background: #171717 !important; }
      `}</style>

      {/* Карта на весь экран */}
      <div id="map" className="w-full h-full z-0" />

      {/* Контентный слой (выровнен по max-w-7xl как навбар) */}
      <div className="absolute inset-0 z-[1001] pointer-events-none">
        <div className="mx-auto max-w-7xl h-full relative px-6">
          {/* Сайдбар всегда справа, если есть данные */}
          <div className="absolute top-6 right-6 bottom-10 w-96 pointer-events-auto hidden md:block animate-in slide-in-from-right-10 duration-700">
            <div className="h-full bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden">
              <MapSidebar
                stations={stations}
                selectedPoint={selectedPoint}
                onPointClick={(s) => {
                  setSelectedPoint(s);
                  mapRef.current.flyTo([s.lat, s.lng], 16);
                }}
              />
            </div>
          </div>

          {/* Кнопка поиска себя */}
          <button
            onClick={() =>
              mapRef.current.locate({ setView: true, maxZoom: 16 })
            }
            className="absolute bottom-10 left-6 w-14 h-14 bg-white pointer-events-auto rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-all border border-black/5"
          >
            <span className="text-2xl">🎯</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
