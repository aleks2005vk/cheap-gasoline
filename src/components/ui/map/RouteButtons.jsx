import React, { useCallback } from "react";

const buildCoords = (obj) => {
  if (!obj) return null;
  const lat = obj.lat ?? obj.latitude ?? obj[0];
  const lng = obj.lng ?? obj.longitude ?? obj[1];
  if (lat == null || lng == null) return null;
  return { lat, lng };
};

const RouteButtons = ({ userLocation, selectedPoint }) => {
  const user = buildCoords(userLocation);
  const point = buildCoords(selectedPoint);
  if (!user || !point) return null;

  const { lat: userLat, lng: userLng } = user;
  const { lat: pointLat, lng: pointLng } = point;
  const name = selectedPoint?.name ?? "Точка";

  const openUrl = useCallback((url) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      // fallback if popups blocked
      window.location.href = url;
    }
  }, []);

  const openGoogle = useCallback(() => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      `${userLat},${userLng}`
    )}&destination=${encodeURIComponent(
      `${pointLat},${pointLng}`
    )}&travelmode=driving`;
    openUrl(url);
  }, [userLat, userLng, pointLat, pointLng, openUrl]);

  const openYandex = useCallback(() => {
    const url = `https://yandex.ru/maps/?rtext=${encodeURIComponent(
      `${userLat},${userLng}~${pointLat},${pointLng}`
    )}&rtt=auto`;
    openUrl(url);
  }, [userLat, userLng, pointLat, pointLng, openUrl]);

  const openWaze = useCallback(() => {
    // Waze supports direct navigate link
    const url = `https://waze.com/ul?ll=${encodeURIComponent(
      `${pointLat},${pointLng}`
    )}&navigate=yes`;
    openUrl(url);
  }, [pointLat, pointLng, openUrl]);

  const openOSM = useCallback(() => {
    const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(
      `${userLat},${userLng};${pointLat},${pointLng}`
    )}`;
    openUrl(url);
  }, [userLat, userLng, pointLat, pointLng, openUrl]);

  const onShare = useCallback(async () => {
    const shareUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${pointLat},${pointLng}`;
    const title = `Маршрут до ${name}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Маршрут до ${name}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Ссылка на маршрут скопирована в буфер обмена");
      } else {
        window.prompt("Скопируй ссылку на маршрут:", shareUrl);
      }
    } catch (e) {
      // ignore or optionally show a non-blocking toast
      console.warn("share failed", e);
    }
  }, [userLat, userLng, pointLat, pointLng, name]);

  return (
    <div
      className="bg-gradient-to-b from-blue-50 to-white border-t-2 border-blue-300 p-4 mt-4 rounded-t-lg"
      role="region"
      aria-label={`Маршрут до ${name}`}
    >
      <p className="text-sm font-bold mb-3 text-gray-800">📍 {name}</p>

      <div className="flex flex-col gap-2">
        <button
          onClick={openGoogle}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition transform hover:scale-105 active:scale-95 shadow-md"
          aria-label={`Открыть маршрут в Google Maps до ${name}`}
        >
          Показать в Google Maps
        </button>

        <button
          onClick={openYandex}
          className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition transform hover:scale-105 active:scale-95 shadow-md"
          aria-label={`Открыть маршрут в Яндекс.Картах до ${name}`}
        >
          Показать маршрут в Яндекс Картах
        </button>

        <button
          onClick={openWaze}
          className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition transform hover:scale-105 active:scale-95 shadow-md"
          aria-label={`Открыть маршрут в Waze до ${name}`}
        >
          Открыть в Waze
        </button>

        <button
          onClick={openOSM}
          className="w-full px-4 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition transform hover:scale-105 active:scale-95 shadow-md"
          aria-label={`Открыть маршрут в OpenStreetMap до ${name}`}
        >
          Открыть в OpenStreetMap
        </button>

        <button
          onClick={onShare}
          className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95 shadow-md"
          aria-label={`Поделиться маршрутом до ${name}`}
        >
          Поделиться
        </button>
      </div>
    </div>
  );
};

export default React.memo(RouteButtons);
