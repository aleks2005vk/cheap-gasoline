import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useSupercluster from "use-supercluster";
import MapSidebar from "./MapSidebar";
import Footer from "../Footer/Footer";
// ИМПОРТ КОНФИГА
import { API_URL } from "../../../config";
import { useGetPointsQuery } from "../../../app/api/apiSlice";

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
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(13);

  // Destructure loading state from query hook
  const { data: stations = [], isLoading, isError } = useGetPointsQuery();

  const points = useMemo(
    () =>
      stations.map((station) => ({
        type: "Feature",
        properties: {
          cluster: false,
          stationId: station.id,
          category: "station",
          ...station,
        },
        geometry: {
          type: "Point",
          coordinates: [station.lng, station.lat],
        },
      })),
    [stations]
  );

  const { clusters } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  // Render clusters on map
  useEffect(() => {
    if (!mapRef.current || !clusters) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Add cluster markers
    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const { cluster: isCluster, point_count } = cluster.properties;

      let marker;
      if (isCluster) {
        // Cluster marker
        marker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div class="cluster-icon">${point_count}</div>`,
            className: "custom-cluster",
            iconSize: [44, 44],
          }),
        });
      } else {
        // Individual point marker
        const isSelected = selectedPoint?.id === cluster.properties.stationId;
        marker = L.marker([lat, lng], {
          icon: createCustomIcon(isSelected),
        }).on("click", () => {
          setSelectedPoint(cluster.properties);
          mapRef.current.flyTo([lat, lng], 16);
        });
      }

      marker.addTo(mapRef.current);
    });
  }, [clusters, selectedPoint]);

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

    mapRef.current = map;

    // Initialize LayerGroup for markers (used by supercluster)
    markersRef.current = L.layerGroup().addTo(map);

    // Update bounds and zoom on map events
    const updateMapView = () => {
      const mapBounds = map.getBounds();
      setBounds([
        mapBounds.getWest(),
        mapBounds.getSouth(),
        mapBounds.getEast(),
        mapBounds.getNorth(),
      ]);
      setZoom(map.getZoom());
    };

    map.on("moveend", updateMapView);
    map.on("zoomend", updateMapView);
    updateMapView(); // Initial call

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
      console.log(
        "Маркеры не создаются: markersRef =",
        !!markersRef.current,
        "stations.length =",
        stations.length,
      );
      return;
    }
    console.log("Создание маркеров для", stations.length, "станций");
    markersRef.current.clearLayers();

    stations.forEach((s, index) => {
      if (index < 5)
        console.log("Создание маркера для станции:", s.name, s.lat, s.lng);
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
    <>
      {/* Loading Spinner - Only show while fetching */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="animate-spin text-4xl mb-4">⚙️</div>
            <p className="text-gray-700 font-medium">Loading prices...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-6">
              Failed to load stations. Please check your connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Map Container - Always rendered */}
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
        
        {/* Map div - Always rendered */}
        <div id="map" className="absolute inset-0 z-0 w-full h-full" />

        {/* Locate Button */}
        <button
          onClick={() => mapRef.current.locate({ setView: true, maxZoom: 16 })}
          className="absolute bottom-24 md:bottom-24 right-4 md:right-auto md:left-6 w-14 h-14 bg-white z-[1000] rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all border border-gray-100"
        >
          <span className="text-2xl">📍</span>
        </button>

        {/* Map Sidebar */}
        <MapSidebar
          stations={stations}
          selectedPoint={selectedPoint}
          onPointClick={(s) => {
            setSelectedPoint(s);
            mapRef.current.flyTo([s.lat, s.lng], 16);
          }}
        />

        {/* Empty State Notification - Show only when loaded AND no data */}
        {!isLoading && !isError && stations.length === 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-lg max-w-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⛽</span>
              <div>
                <p className="font-semibold text-gray-800">No stations found</p>
                <p className="text-sm text-gray-600">Add the first one to get started!</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-[2000]">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default MapComponent;

