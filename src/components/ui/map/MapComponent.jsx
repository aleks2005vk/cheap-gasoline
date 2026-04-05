import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import MapSidebar from "./MapSidebar";
import Footer from "../Footer/Footer";
// ИМПОРТ КОНФИГА
import { API_URL } from "../../../config";

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
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const locationMarkerRef = useRef(null);
  const [stations, setStations] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
    }).setView([41.7151, 44.8271], 13);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap",
      },
    ).addTo(map);

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

    // ИСПОЛЬЗУЕМ API_URL ИЗ КОНФИГА
    console.log("Загрузка станций с:", `${API_URL}/api/stations`);
    fetch(`${API_URL}/api/stations?t=${Date.now()}`)
      .then((res) => {
        console.log("Ответ API:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`Ошибка API: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Получены станции:", data.length);
        setStations(data);
      })
      .catch((err) => {
        console.error("Ошибка загрузки АЗС:", err);
        setLoadError(
          "Не удалось загрузить станции. Проверьте, запущен ли бэкенд и правильно ли указан API_URL.",
        );
      });

    map.on("locationfound", (e) => {
      const { lat, lng } = e.latlng;
      if (locationMarkerRef.current) {
        map.removeLayer(locationMarkerRef.current);
      }
      locationMarkerRef.current = L.marker([lat, lng], {
        icon: createLocationIcon(),
      }).addTo(map);
      map.setView([lat, lng], 16, { animate: true });
    });
  }, []);

  useEffect(() => {
    if (!markersRef.current || !stations.length) {
      console.log("Маркеры не создаются: markersRef =", !!markersRef.current, "stations.length =", stations.length);
      return;
    }
    console.log("Создание маркеров для", stations.length, "станций");
    markersRef.current.clearLayers();

    stations.forEach((s, index) => {
      if (index < 5) console.log("Создание маркера для станции:", s.name, s.lat, s.lng);
      const marker = L.marker([s.lat, s.lng], {
        icon: createCustomIcon(selectedPoint?.id === s.id),
      });

      marker.on("click", () => {
        setSelectedPoint(s);
        mapRef.current.flyTo([s.lat, s.lng], 16, { duration: 1 });
      });

      markersRef.current.addLayer(marker);
    });
    console.log("Маркеры созданы");
  }, [stations, selectedPoint]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-100 overflow-hidden">
      <style>{`
        .marker-main { 
          background: linear-gradient(135deg, #ff9500 0%, #ff7300 100%);
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          border: 3px solid white; 
          display: flex; align-items: center; justify-content: center; 
          box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
        }
        .marker-main.active { 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important; 
          scale: 1.3; 
          box-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
          z-index: 1000;
        }
        .marker-inner { width: 40%; height: 40%; background: white; border-radius: 50%; }
        .custom-cluster {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          color: white;
          display: flex; align-items: center; justify-content: center;
        }
        .cluster-icon { font-weight: bold; font-size: 14px; }
        .location-marker { position: relative; width: 20px; height: 20px; }
        .location-pulse {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(59, 130, 246, 0.5);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .location-dot {
          position: absolute; top: 5px; left: 5px; width: 10px; height: 10px;
          background: #2563eb; border: 2px solid white; border-radius: 50%;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {loadError && (
        <div className="absolute top-4 left-4 right-4 z-30 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 backdrop-blur-xl shadow-lg shadow-red-900/10">
          <strong className="block font-bold">Ошибка сервера</strong>
          <p className="mt-1 text-xs leading-5">{loadError}</p>
        </div>
      )}
      <div id="map" className="absolute inset-0 z-0 w-full h-full" />

      <button
        onClick={() => mapRef.current.locate({ setView: true, maxZoom: 16 })}
        className="absolute bottom-24 md:bottom-24 right-4 md:right-auto md:left-6 w-14 h-14 bg-white z-[1000] rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all border border-gray-100"
      >
        <span className="text-2xl">📍</span>
      </button>

      <MapSidebar
        stations={stations}
        selectedPoint={selectedPoint}
        onPointClick={(s) => {
          setSelectedPoint(s);
          mapRef.current.flyTo([s.lat, s.lng], 16);
        }}
        setStations={setStations}
      />

      <div className="absolute bottom-0 left-0 right-0 z-[2000]">
        <Footer />
      </div>
    </div>
  );
};

export default MapComponent;
