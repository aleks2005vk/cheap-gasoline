import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import MapSidebar from "./MapSidebar";
import Footer from "../Footer/Footer";
import LeftAdSidebar from "../LeftAdSidebar/LeftAdSidebar";
import AdPopup from "../AdPopup/AdPopup";
import { useNavigate, useLocation } from "react-router-dom";

// Кастомный маркер АЗС
const createCustomIcon = (isSelected = false) => {
  const size = isSelected ? 40 : 32;
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

// Маркер геолокации
const createLocationIcon = () => {
  return L.divIcon({
    className: "location-marker-wrapper",
    html: `
      <div class="location-marker">
        <div class="location-pulse"></div>
        <div class="location-dot"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const locationMarkerRef = useRef(null);
  const [stations, setStations] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [sheetY, setSheetY] = useState(0);
  const sheetRef = useRef(null);

  // Инициализация карты
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
    }).setView([41.7151, 44.8271], 13);

    // ЯРКАЯ ЦВЕТНАЯ КАРТА (Bright colors)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    markersRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-icon">${count}</div>`,
          className: "custom-cluster",
          iconSize: [44, 44],
        });
      },
    });
    map.addLayer(markersRef.current);
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Загрузка станций
    fetch("http://127.0.0.1:8001/api/stations")
      .then((res) => res.json())
      .then(setStations)
      .catch((err) => console.error("Ошибка загрузки АЗС:", err));

    // Добавляем геолокацию кнопке
    map.on("locationfound", (e) => {
      const { lat, lng } = e.latlng;

      // Удаляем старый маркер если был
      if (locationMarkerRef.current) {
        map.removeLayer(locationMarkerRef.current);
      }

      // Добавляем новый маркер геолокации
      locationMarkerRef.current = L.marker([lat, lng], {
        icon: createLocationIcon(),
      }).addTo(map);

      // Летим на геолокацию
      map.setView([lat, lng], 16, { animate: true });
    });
  }, []);

  // Отрисовка маркеров АЗС
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
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
      <style>{`
        /* === МАРКЕРЫ АЗС === */
        .marker-main { 
          background: linear-gradient(135deg, #ff9500 0%, #ff7300 100%);
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          border: 3px solid white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }
        .marker-main.active { 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important; 
          scale: 1.3; 
          box-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
          border-width: 4px;
        }
        .marker-inner { 
          width: 40%; 
          height: 40%; 
          background: white; 
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* === КЛАСТЕРЫ === */
        .custom-cluster {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .cluster-icon {
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        
        /* === ГЕОЛОКАЦИЯ === */
        .location-marker {
          position: relative;
          width: 20px;
          height: 20px;
        }
        .location-pulse {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .location-dot {
          position: absolute;
          top: 6px;
          left: 6px;
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.6);
          z-index: 10;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0; }
        }
        
        /* === КАРТА === */
        .leaflet-container { 
          background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%) !important;
          width: 100%; 
          height: 100%;
        }
        
        .leaflet-tile {
          filter: brightness(1.05) contrast(1.1);
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        /* === МОБИЛЬНЫЙ BOTTOM SHEET === */
        .bottom-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1f2937;
          border-radius: 24px 24px 0 0;
          border: 1px solid #374151;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
          z-index: 50;
          transition: transform 0.3s ease-out;
          max-height: 85vh;
          overflow-y: auto;
        }
        
        .bottom-sheet-handle {
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 8px;
          border-bottom: 1px solid #374151;
        }
        
        .bottom-sheet-handle::after {
          content: '';
          width: 40px;
          height: 4px;
          background: #6b7280;
          border-radius: 2px;
        }
      `}</style>

      {/* КАРТА */}
      <div id="map" className="absolute inset-0 z-0 w-full h-full" />

      {/* ИНТЕРФЕЙСНЫЙ СЛОЙ */}
      <div className="absolute inset-0 z-[1001] pointer-events-none">
        {/* DESKTOP: САЙДБАР (тëмный режим) */}
        <div className="absolute top-20 right-4 bottom-24 w-96 pointer-events-auto hidden md:block animate-in slide-in-from-right-10 duration-700">
          <div className="h-full bg-gray-900/95 backdrop-blur-md shadow-2xl border border-gray-700/50 rounded-3xl overflow-hidden flex flex-col">
            {/* Dark Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                🚗 Газовые Станции
              </h2>
            </div>
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              <MapSidebar
                stations={stations}
                selectedPoint={selectedPoint}
                onPointClick={(s) => {
                  setSelectedPoint(s);
                  mapRef.current.flyTo([s.lat, s.lng], 16);
                }}
                setStations={setStations}
              />
            </div>
          </div>
        </div>

        {/* MOBILE: КНОПКА ОТКРЫТИЯ СЛАЙДЕРА */}
        <button
          onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
          className="absolute bottom-24 right-4 md:hidden z-50 w-12 h-12 bg-white pointer-events-auto rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all border border-gray-200 hover:bg-gray-50"
        >
          <span className="text-xl">☰</span>
        </button>

        {/* MOBILE: BOTTOM SHEET СЛАЙДЕР */}
        {mobileSheetOpen && (
          <div
            className="absolute bottom-0 left-0 right-0 md:hidden bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            ref={sheetRef}
          >
            <div className="bottom-sheet-handle">👆</div>
            <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
              <h3 className="font-bold text-white text-center">
                🚗 Газовые Станции
              </h3>
            </div>
            <div className="p-4">
              <MapSidebar
                stations={stations}
                selectedPoint={selectedPoint}
                onPointClick={(s) => {
                  setSelectedPoint(s);
                  mapRef.current.flyTo([s.lat, s.lng], 16);
                  setMobileSheetOpen(false);
                }}
                setStations={setStations}
              />
            </div>
          </div>
        )}

        {/* КНОПКА ГЕОЛОКАЦИИ */}
        <button
          onClick={() => mapRef.current.locate({ setView: true, maxZoom: 16 })}
          className="absolute bottom-32 md:bottom-20 left-6 w-14 h-14 bg-white pointer-events-auto rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-all border border-sky-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-blue-300/50"
        >
          <span className="text-2xl">📍</span>
        </button>
      </div>

      {/* FOOTER ПОВЕРХ КАРТЫ */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
