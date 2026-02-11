import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import MapSidebar from "./MapSidebar";
import { useNavigate, useLocation } from "react-router-dom";

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
  const queryParams = new URLSearchParams(location.search);
  const isSelectMode = queryParams.get("mode") === "select";

  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const activeMarkerLayerRef = useRef(L.layerGroup());

  const [stations, setStations] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map("map", { zoomControl: false }).setView(
      [41.7151, 44.8271],
      13,
    );

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© CartoDB",
      },
    ).addTo(map);

    mapRef.current = map;
    markersRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      disableClusteringAtZoom: 17,
    });
    map.addLayer(markersRef.current);
    activeMarkerLayerRef.current.addTo(map);

    fetch("http://127.0.0.1:8001/api/stations")
      .then((res) => res.json())
      .then(setStations)
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!markersRef.current || !stations.length) return;
    markersRef.current.clearLayers();
    activeMarkerLayerRef.current.clearLayers();

    stations.forEach((s) => {
      const isActive = selectedPoint?.id === s.id;
      const marker = L.marker([s.lat, s.lng], {
        icon: createCustomIcon(isActive),
        zIndexOffset: isActive ? 10000 : 0,
      });

      marker.on("click", () => {
        if (isSelectMode) {
          navigate(
            `/add-photo?id=${s.id}&brand=${s.brand}&name=${s.name}&lat=${s.lat}&lng=${s.lng}`,
          );
        } else {
          setSelectedPoint(s);
          setMobileSidebarOpen(false);
          mapRef.current.flyTo([s.lat, s.lng], 16, { duration: 1.2 });
        }
      });

      if (isActive) activeMarkerLayerRef.current.addLayer(marker);
      else markersRef.current.addLayer(marker);
    });
  }, [stations, selectedPoint, isSelectMode, navigate]);

  return (
    <div className="w-full h-full relative overflow-hidden font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto]">
      <style>{`
        .marker-main { 
          background: #2563eb; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); 
          border: 2px solid white; display: flex; align-items: center; justify-content: center;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .marker-main.active { 
          background: #ef4444 !important; transform: rotate(-45deg) scale(1.2);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); z-index: 9999;
        }
        .marker-inner { width: 30%; height: 30%; background: white; border-radius: 50%; }
        .leaflet-marker-pane { z-index: 600 !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div id="map" className="w-full h-full z-0" />

      {/* Desktop Sidebar */}
      {!isSelectMode && (
        <div className="absolute top-0 right-0 h-full w-[400px] bg-white z-[1001] shadow-2xl hidden md:block">
          <MapSidebar
            stations={stations}
            selectedPoint={selectedPoint}
            onPointClick={(s) => {
              setSelectedPoint(s);
              mapRef.current.flyTo([s.lat, s.lng], 16, { duration: 1.2 });
            }}
          />
        </div>
      )}

      {/* iOS style Bottom Sheet */}
      {!isSelectMode && (
        <>
          <div
            className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[2000] transition-opacity duration-500 md:hidden ${mobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-[2001] md:hidden transition-transform duration-[600ms] style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }} ${mobileSidebarOpen ? "translate-y-0" : "translate-y-full"}`}
          >
            <div className="bg-white/90 backdrop-blur-2xl h-[75vh] rounded-t-[2.5rem] shadow-2xl flex flex-col">
              <div
                className="w-full py-4 flex justify-center cursor-pointer"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <div className="w-12 h-1.5 bg-gray-300/60 rounded-full" />
              </div>
              <div className="flex-1 overflow-y-auto pb-10">
                <MapSidebar
                  stations={stations}
                  selectedPoint={selectedPoint}
                  onPointClick={(s) => {
                    setSelectedPoint(s);
                    setMobileSidebarOpen(false);
                    mapRef.current.flyTo([s.lat, s.lng], 16);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* iOS Floating Button */}
      {!isSelectMode && !mobileSidebarOpen && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1005] md:hidden bg-blue-600 text-white px-8 py-4 rounded-full shadow-xl flex items-center gap-3 active:scale-95 transition-all"
        >
          <span className="text-lg">📍</span>
          <span className="font-bold tracking-tight">
            Станции ({stations.length})
          </span>
        </button>
      )}
    </div>
  );
};
export default MapComponent;
