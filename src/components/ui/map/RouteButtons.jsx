import React, { useCallback } from "react";

const buildCoords = (obj) => {
  if (!obj) return null;
  const lat = obj.lat ?? obj.latitude ?? (Array.isArray(obj) ? obj[0] : null);
  const lng = obj.lng ?? obj.longitude ?? (Array.isArray(obj) ? obj[1] : null);
  if (lat == null || lng == null) return null;
  return { lat, lng };
};

const RouteButtons = ({ userLocation, selectedPoint }) => {
  const user = buildCoords(userLocation);
  const point = buildCoords(selectedPoint);

  const name = selectedPoint?.name ?? "АЗС";

  const openUrl = useCallback((url) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) window.location.href = url;
  }, []);

  // Если нет координат пользователя, показываем упрощенные кнопки (только до точки)
  const uLat = user?.lat;
  const uLng = user?.lng;
  const pLat = point?.lat;
  const pLng = point?.lng;

  if (!pLat || !pLng) return null;

  const openYandex = () => {
    const url = uLat
      ? `https://yandex.ru/maps/?rtext=${uLat},${uLng}~${pLat},${pLng}&rtt=auto`
      : `yandexnavi://build_route_on_map?lat_to=${pLat}&lon_to=${pLng}`;
    openUrl(url);
  };

  const openGoogle = () => {
    // Исправленный URL для Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLng}&travelmode=driving`;
    openUrl(url);
  };

  const openApple = () => {
    const url = `http://maps.apple.com/?daddr=${pLat},${pLng}&dirflg=d`;
    openUrl(url);
  };

  const openWaze = () =>
    openUrl(`https://waze.com/ul?ll=${pLat},${pLng}&navigate=yes`);

  const onShare = async () => {
    const shareUrl = `https://www.google.com/maps/search/?api=1&query=${pLat},${pLng}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: `АЗС ${name}. Цены на топливо в реальном времени:`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Ссылка скопирована!");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {!user && (
        <p className="text-[10px] text-center text-amber-600 font-medium bg-amber-50 py-1 rounded-lg">
          Маршрут будет точнее, если включить GPS
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={openYandex}
          className="flex items-center justify-center p-3 bg-[#ffdb4d] hover:bg-[#ffcc00] rounded-2xl transition-all active:scale-95 shadow-sm"
        >
          <span className="text-[11px] font-black uppercase text-black">
            Яндекс
          </span>
        </button>

        <button
          onClick={openGoogle}
          className="flex items-center justify-center p-3 bg-[#4285F4] hover:bg-[#357ae8] rounded-2xl transition-all active:scale-95 shadow-sm"
        >
          <span className="text-[11px] font-black uppercase text-white">
            Google
          </span>
        </button>

        <button
          onClick={openApple}
          className="flex items-center justify-center p-3 bg-black hover:bg-gray-800 rounded-2xl transition-all active:scale-95 shadow-sm"
        >
          <span className="text-[11px] font-black uppercase text-white">
            Apple
          </span>
        </button>

        <button
          onClick={onShare}
          className="flex items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all active:scale-95 border border-gray-200 shadow-sm"
        >
          <span className="text-[11px] font-black uppercase text-gray-700">
            Поделиться
          </span>
        </button>
      </div>

      <div className="flex justify-center gap-6 pt-1">
        <button
          onClick={openWaze}
          className="text-[10px] text-blue-500 font-black uppercase tracking-widest hover:opacity-70"
        >
          Waze
        </button>
        <button
          onClick={() =>
            openUrl(
              `https://www.openstreetmap.org/directions?route=${uLat || ""},${uLng || ""};${pLat},${pLng}`,
            )
          }
          className="text-[10px] text-gray-400 font-black uppercase tracking-widest hover:opacity-70"
        >
          OSM
        </button>
      </div>
    </div>
  );
};

export default React.memo(RouteButtons);
