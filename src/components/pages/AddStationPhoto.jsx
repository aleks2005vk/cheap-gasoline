import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BRAND_PRESETS = {
  Lukoil: [
    { id: "ecto_100", label: "100 ECTO" },
    { id: "ecto_95", label: "95 ECTO" },
    { id: "ecto_92", label: "92 ECTO" },
    { id: "diesel", label: "D ECTO" },
  ],
  Socar: [
    { id: "n95", label: "NANO 95" },
    { id: "n92", label: "NANO 92" },
    { id: "diesel", label: "NANO DT" },
    { id: "lpg", label: "LPG" },
  ],
  Gulf: [
    { id: "g98", label: "G-Force 98" },
    { id: "g95", label: "G-Force 95" },
    { id: "reg", label: "Euro Reg" },
    { id: "diesel", label: "G-Force D" },
  ],
  Wissol: [
    { id: "eko_super", label: "EKO SUPER" },
    { id: "eko_premium", label: "EKO PREMIUM" },
    { id: "eko_regular", label: "EKO REGULAR" },
    { id: "diesel", label: "EKO DIESEL" },
  ],
  Rompetrol: [
    { id: "efix_98", label: "98 EFIX" },
    { id: "efix_95", label: "95 EFIX" },
    { id: "efix_92", label: "92 EFIX" },
    { id: "diesel", label: "D EFIX" },
  ],
};

const AddStationPhoto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Состояния
  const [step, setStep] = useState(queryParams.get("id") ? 1 : 0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(
    queryParams.get("brand") || "",
  );
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);

  // Следим за возвратом с карты
  useEffect(() => {
    const id = queryParams.get("id");
    if (id) {
      setSelectedBrand(queryParams.get("brand") || "");
      setStep(1);
    }
  }, [location.search]);

  const handleAIParse = () => {
    setLoading(true);
    setTimeout(() => {
      const brand = selectedBrand || "Socar";
      const presets = {
        Socar: { n95: "2.99", n92: "2.79", diesel: "2.89", lpg: "1.75" },
        Lukoil: {
          ecto_100: "3.45",
          ecto_95: "3.15",
          ecto_92: "2.95",
          diesel: "3.20",
        },
      };
      setPrices(presets[brand] || presets.Socar);
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleSubmit = async () => {
    const stationId = queryParams.get("id");
    if (!stationId) {
      alert("❌ Ошибка: Станция не выбрана!");
      setStep(0);
      return;
    }

    setLoading(true);
    const payload = {
      station_id: parseInt(stationId, 10),
      brand: selectedBrand,
      station_name: queryParams.get("name") || "Unknown",
      lat: parseFloat(queryParams.get("lat")) || 0,
      lng: parseFloat(queryParams.get("lng")) || 0,
      prices: prices,
    };

    try {
      const res = await fetch("http://127.0.0.1:8001/api/update-price-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ Цены успешно обновлены!");
        window.dispatchEvent(new Event("stations-updated"));
        navigate("/");
      } else {
        const errorText = await res.text();
        alert(
          `❌ Ошибка сервера: ${res.status}. Проверьте эндпоинт на бэкенде.`,
        );
      }
    } catch (error) {
      alert("❌ Ошибка сети: проверьте, запущен ли бэкенд.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        {/* ШАГ 0: Выбор станции */}
        {step === 0 && (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-blue-500 text-center">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-2xl font-black mb-6 uppercase">
              Выберите станцию
            </h2>
            <button
              onClick={() => navigate("/?mode=select")}
              className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
            >
              ОТКРЫТЬ КАРТУ
            </button>
            <p className="mt-4 text-gray-400 text-sm uppercase font-bold">
              Укажите точку на карте
            </p>
          </div>
        )}

        {/* ШАГ 1: Фото */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border-dashed border-4 border-blue-100 text-center">
            <div className="mb-4">
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-xs font-bold">
                АЗС: {queryParams.get("brand")}
              </span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 uppercase mb-4">
              Шаг 1: Фото Табло
            </h2>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="upload"
              onChange={(e) => {
                if (e.target.files[0]) {
                  setSelectedImage(URL.createObjectURL(e.target.files[0]));
                  setStep(2);
                }
              }}
            />
            <label
              htmlFor="upload"
              className="cursor-pointer bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold block hover:bg-blue-700 transition-all shadow-lg"
            >
              📸 Сфотографировать
            </label>
            <button
              onClick={() => setStep(3)}
              className="mt-4 text-blue-500 font-bold block w-full text-center"
            >
              Пропустить и ввести вручную
            </button>
          </div>
        )}

        {/* ШАГ 2: Анализ */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-[2rem] shadow-xl text-center">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-48 object-cover rounded-2xl mb-4 shadow-md"
            />
            <h2 className="text-xl font-black mb-4">Распознать через ИИ?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAIParse}
                disabled={loading}
                className="bg-green-600 text-white p-4 rounded-xl font-bold shadow-md"
              >
                {loading ? "Анализ..." : "🤖 ДА"}
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-gray-200 text-gray-600 p-4 rounded-xl font-bold"
              >
                ВРУЧНУЮ
              </button>
            </div>
          </div>
        )}

        {/* ШАГ 3: Цены */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-blue-500">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                Выбранный Бренд
              </label>
              <select
                className="w-full p-2 bg-gray-50 rounded-xl font-bold outline-none"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">-- Выбор --</option>
                {Object.keys(BRAND_PRESETS).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(BRAND_PRESETS[selectedBrand] || []).map((field) => (
                <div
                  key={field.id}
                  className="bg-white p-4 rounded-2xl border-2 border-gray-100"
                >
                  <span className="text-[10px] font-black text-blue-500 uppercase">
                    {field.label}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full text-2xl font-black outline-none"
                    value={prices[field.id] || ""}
                    onChange={(e) =>
                      setPrices({ ...prices, [field.id]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="w-1/4 py-5 bg-gray-200 rounded-2xl font-black"
              >
                ←
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-3/4 py-5 bg-green-600 text-white rounded-2xl font-black text-xl shadow-lg"
              >
                {loading ? "Сохранение..." : "ПРИМЕНИТЬ"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStationPhoto;
