import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Fix default icon paths for bundlers (Vite) so markers are visible
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
if (L && L.Icon && L.Icon.Default) {
  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  });
}
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MapSidebar from "./MapSidebar";
import BannerLeft from "./BannerLeft";
import BannerBottom from "./BannerBottom";
import PopupAd from "./PopupAd";
import { pointsOfInterest } from "./points";
import { useNavigate } from "react-router-dom";

// Config
const MAX_VISIBLE = 15;
const BASE_RADIUS_KM = 10;

const toRad = (v) => (v * Math.PI) / 180;
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const makePopupHtml = (point) => {
  const imgHtml = point.image
    ? `<img src="${point.image}" style="width:120px;border-radius:6px;margin:6px 0;"/>`
    : "";
  const desc = point.description
    ? `<div style="font-size:12px;margin-top:4px;">${point.description}</div>`
    : "";
  return `
    <div style="text-align:center;max-width:240px;">
      <h4 style="margin:0 0 6px 0;">${point.name}</h4>
      ${imgHtml}
      ${desc}
    </div>
  `;
};

// simple debounce hook-like utility using ref
const useDebouncedCallback = (fn, wait = 200) => {
  const timer = useRef(null);
  const cb = useCallback(
    (...args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fn(...args);
        timer.current = null;
      }, wait);
    },
    [fn, wait]
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  return cb;
};

const MapComponent = () => {
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const markersById = useRef(new Map());
  const userCircleRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [attachMode, setAttachMode] = useState(false);
  const [dataToAttach, setDataToAttach] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPopupAd, setShowPopupAd] = useState(false);
  const [nearbyPoints, setNearbyPoints] = useState([]);

  const navigate = useNavigate();

  // screen size listener
  useEffect(() => {
    const check = () => {
      const mobile = typeof window !== "undefined" && window.innerWidth <= 420;
      setIsMobile(mobile);
      // only show sidebar by default on desktop
      setShowSidebar(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // request location with fallback
  const requestUserLocation = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve({ latitude: 41.769, longitude: 44.784 });
        return;
      }
      let done = false;
      const onSuccess = (p) => {
        if (done) return;
        done = true;
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
        });
      };
      const onFail = () => {
        if (done) return;
        done = true;
        resolve({ latitude: 41.769, longitude: 44.784 });
      };
      navigator.geolocation.getCurrentPosition(onSuccess, onFail, {
        enableHighAccuracy: true,
        timeout: opts.timeout || 8000,
        maximumAge: opts.maximumAge || 0,
      });
      setTimeout(() => {
        if (!done) {
          done = true;
          resolve({ latitude: 41.769, longitude: 44.784 });
        }
      }, (opts.timeout || 8000) + 500);
    });
  }, []);

  const getNearbyPoints = useCallback(
    (centerLat, centerLng) => {
      const baseLat = userLocation ? userLocation.lat : centerLat;
      const baseLng = userLocation ? userLocation.lng : centerLng;
      let radius = BASE_RADIUS_KM;
      let collected = [];
      while (radius <= 200 && collected.length < MAX_VISIBLE) {
        collected = pointsOfInterest
          .map((p) => ({
            point: p,
            dist: haversineDistanceKm(baseLat, baseLng, p.lat, p.lng),
          }))
          .filter((x) => x.dist <= radius)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, MAX_VISIBLE)
          .map((x) => x.point);
        if (collected.length >= Math.min(MAX_VISIBLE, 5)) break;
        radius *= 2;
      }
      if (collected.length === 0) {
        collected = pointsOfInterest
          .map((p) => ({
            point: p,
            dist: haversineDistanceKm(baseLat, baseLng, p.lat, p.lng),
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, MAX_VISIBLE)
          .map((x) => x.point);
      }
      return collected;
    },
    [userLocation]
  );

  const addMarkerForPoint = useCallback((point) => {
    if (!mapRef.current || !clusterRef.current) return;
    const id = point.id ?? `${point.lat}_${point.lng}`;
    if (markersById.current.has(id)) return;
    const marker = L.marker([point.lat, point.lng]);
    marker.bindPopup(makePopupHtml(point), { maxWidth: 300 });
    marker.on("click", () => setSelectedPoint(point));
    clusterRef.current.addLayer(marker);
    markersById.current.set(id, marker);
  }, []);

  const updateVisibleMarkers = useCallback(() => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const nearby = getNearbyPoints(center.lat, center.lng);
    setNearbyPoints(nearby);
    const keep = new Set(nearby.map((p) => p.id ?? `${p.lat}_${p.lng}`));
    nearby.forEach((p) => addMarkerForPoint(p));
    for (const [id, marker] of Array.from(markersById.current.entries())) {
      if (!keep.has(id)) {
        try {
          clusterRef.current.removeLayer(marker);
        } catch (e) {}
        markersById.current.delete(id);
      }
    }
  }, [getNearbyPoints, addMarkerForPoint]);

  // debounce updates
  const updateVisibleMarkersDebounced = useDebouncedCallback(
    updateVisibleMarkers,
    250
  );

  // Init map once
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = L.map("map", {
      center: [41.769, 44.784],
      zoom: 13,
      preferCanvas: true,
      worldCopyJump: true,
    });

    // tile layer
    try {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    } catch (e) {
      // graceful fallback if tiles fail
      console.warn("Tile layer failed:", e);
    }

    clusterRef.current = L.markerClusterGroup({ chunkedLoading: true });
    mapRef.current.addLayer(clusterRef.current);

    const onMoveEnd = () => updateVisibleMarkersDebounced();
    mapRef.current.on("moveend", onMoveEnd);
    mapRef.current.on("zoomend", onMoveEnd);

    // request location and center
    let mounted = true;
    requestUserLocation().then((loc) => {
      if (!mounted) return;
      const lat = loc.latitude;
      const lng = loc.longitude;
      setUserLocation({ lat, lng });
      try {
        mapRef.current.setView([lat, lng], 14);
        if (userCircleRef.current) {
          try {
            mapRef.current.removeLayer(userCircleRef.current);
          } catch (e) {}
          userCircleRef.current = null;
        }
        userCircleRef.current = L.circle([lat, lng], {
          radius: Math.max(loc.accuracy || 50, 20),
        }).addTo(mapRef.current);
      } catch (e) {
        // ignore
      }
      updateVisibleMarkersDebounced();
    });

    return () => {
      mounted = false;
      if (!mapRef.current) return;
      mapRef.current.off();
      try {
        mapRef.current.remove();
      } catch (e) {}
      mapRef.current = null;
      markersById.current.clear();
      clusterRef.current = null;
      if (userCircleRef.current) {
        try {
          userCircleRef.current.remove();
        } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure leaflet recalculates sizes when layout changes
  useEffect(() => {
    if (!mapRef.current) return;
    const id = setTimeout(() => {
      try {
        mapRef.current.invalidateSize();
      } catch (e) {}
    }, 120);
    return () => clearTimeout(id);
  }, [isMobile, showSidebar, nearbyPoints]);

  useEffect(() => {
    const id = setTimeout(() => setShowPopupAd(true), 2500);
    return () => clearTimeout(id);
  }, []);

  const centerToUser = useCallback(async () => {
    if (!userLocation) {
      const loc = await requestUserLocation();
      setUserLocation({ lat: loc.latitude, lng: loc.longitude });
    }
    if (mapRef.current && userLocation) {
      try {
        mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
      } catch (e) {}
    }
  }, [userLocation, requestUserLocation]);

  const openPointOnMap = useCallback(
    (point) => {
      if (!mapRef.current) return;
      const id = point.id ?? `${point.lat}_${point.lng}`;
      const marker = markersById.current.get(id);
      if (marker) {
        try {
          mapRef.current.setView([point.lat, point.lng], 15);
          marker.openPopup();
        } catch (e) {}
      } else {
        addMarkerForPoint(point);
        const m = markersById.current.get(id);
        if (m) {
          try {
            mapRef.current.setView([point.lat, point.lng], 15);
            m.openPopup();
          } catch (e) {}
        }
      }
    },
    [addMarkerForPoint]
  );

  const onAddPhoto = () => navigate("/add-station-photo");

  return (
    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
      {attachMode && dataToAttach && (
        <div style={{ position: "absolute", left: 14, top: 14, zIndex: 9999 }}>
          <div className="bg-yellow-400 text-black px-4 py-2 rounded shadow">
            <div className="text-sm font-semibold">Режим привязки</div>
            <div className="text-xs mt-1">
              Нажми на маркер, чтобы привязать распознанные цены к заправке.
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setAttachMode(false);
                  setDataToAttach(null);
                }}
                className="px-2 py-1 bg-white rounded text-sm"
              >
                Отменить
              </button>
              <button
                onClick={centerToUser}
                className="px-2 py-1 bg-white rounded text-sm"
              >
                Центр на меня
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <BannerLeft />

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          <div
            id="map"
            className="flex-1 min-h-0 relative z-0 rounded-l-lg overflow-hidden"
          />

          {isMobile && (
            <div className="w-full h-44 md:hidden bg-white border-t border-gray-200 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b flex items-center justify-between">
                <div className="font-semibold text-sm">Ближайшие заправки</div>
                <button
                  className="text-xs px-2 py-1 bg-white rounded"
                  onClick={() => setShowSidebar((s) => !s)}
                >
                  {showSidebar ? "▼" : "▲"}
                </button>
              </div>
              {showSidebar && (
                <div className="flex-1 overflow-y-auto">
                  <MapSidebar
                    isMobile
                    setShowSidebar={setShowSidebar}
                    points={nearbyPoints}
                    onPointClick={(p) => {
                      setSelectedPoint(p);
                      openPointOnMap(p);
                      setShowSidebar(false);
                    }}
                    selectedPoint={selectedPoint}
                    userLocation={userLocation}
                  />
                </div>
              )}
            </div>
          )}

          {!isMobile && showSidebar && (
            <div className="hidden md:flex w-full md:w-80 bg-white border-l border-gray-200">
              <MapSidebar
                isMobile={false}
                setShowSidebar={setShowSidebar}
                points={nearbyPoints}
                onPointClick={(p) => {
                  setSelectedPoint(p);
                  openPointOnMap(p);
                }}
                selectedPoint={selectedPoint}
                userLocation={userLocation}
              />
            </div>
          )}
        </div>
      </div>

      <div
        style={{ height: 76 }}
        className="hidden md:flex w-full items-center justify-center"
      >
        <BannerBottom />
      </div>

      <PopupAd open={showPopupAd} onClose={() => setShowPopupAd(false)} />
    </div>
  );
};

export default MapComponent;
