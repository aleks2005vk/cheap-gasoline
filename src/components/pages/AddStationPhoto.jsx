import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
    { id: "EUdiesel", label: "EURO DIESEL" },
  ],
  Rompetrol: [
    { id: "efix_98", label: "98 EFIX" },
    { id: "efix_95", label: "95 EFIX" },
    { id: "efix_92", label: "92 EFIX" },
    { id: "diesel", label: "D EFIX" },
    { id: "LPDdiesel", label: "LPD EFIX" },
  ],
};

const AddStationPhoto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(location.search);
  const stationId = queryParams.get("id");

  const [step, setStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(
    queryParams.get("brand") || "",
  );
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAIParse = () => {
    if (!selectedBrand) {
      alert(t("selectBrandFirst"));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const detectedRaw = ["3.12", "2.95", "3.02", "2.85", "1.70"];
      const brandFields = BRAND_PRESETS[selectedBrand] || [];
      const updatedPrices = {};
      brandFields.forEach((field, index) => {
        if (detectedRaw[index]) updatedPrices[field.id] = detectedRaw[index];
      });
      setPrices(updatedPrices);
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handlePriceChange = (id, value) => {
    let val = value.replace(/[^\d.]/g, "");
    if (val.length === 3 && !val.includes("."))
      val = (parseInt(val) / 100).toFixed(2);
    setPrices({ ...prices, [id]: val });
  };

  const handleSubmit = async () => {
    if (!stationId) {
      alert(t("stationNotSelected"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8001/api/update-price-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station_id: parseInt(stationId), prices }),
      });
      if (res.ok) {
        alert(t("pricesUpdated"));
        navigate("/");
      }
    } catch (e) {
      alert(t("savingError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-3 rounded-2xl mb-4 border border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${stationId ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
          ></div>
          <span className="text-white font-bold text-sm">
            {stationId ? t("stationNum", { id: stationId }) : t("noStation")}
          </span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-[10px] bg-white/20 text-white px-3 py-1 rounded-lg font-black uppercase tracking-tighter hover:bg-white/30 transition-colors"
        >
          {t("map")} 🗺️
        </button>
      </div>

      <div className="w-full max-w-md">
        {step === 1 && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl text-center border border-white/20">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⛽</span>
            </div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">
              {t("updatePrice")}
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              {stationId ? t("uploadPhotoDesc") : t("selectFirst")}
            </p>
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
              className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl block font-bold shadow-lg cursor-pointer transition-all active:scale-95"
            >
              {t("takePhoto")}
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-5 rounded-3xl shadow-md border-2 border-blue-500">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                {t("checkBrand")}
              </p>
              <select
                className="w-full text-lg font-black outline-none bg-transparent cursor-pointer"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">{t("selectNetwork")}</option>
                {Object.keys(BRAND_PRESETS).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white p-4 rounded-[2rem] shadow-xl">
              <img
                src={selectedImage}
                className="w-full h-56 object-cover rounded-2xl mb-4 shadow-inner"
                alt="preview"
              />
              <button
                onClick={handleAIParse}
                disabled={loading}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 disabled:bg-gray-300"
              >
                {loading ? t("processing") : t("runAI")}
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full mt-4 text-gray-400 font-bold text-sm uppercase tracking-widest"
              >
                {t("enterManually")}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border-l-4 border-blue-500">
              <span className="font-black uppercase text-gray-400 text-[10px]">
                {t("currentNetwork")}
              </span>
              <span className="font-black uppercase text-blue-600">
                {selectedBrand || t("notSelected")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(BRAND_PRESETS[selectedBrand] || []).map((f) => (
                <div
                  key={f.id}
                  className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm focus-within:border-blue-500 transition-colors"
                >
                  <span className="text-[10px] font-black text-blue-400 uppercase block mb-1">
                    {f.label}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full text-2xl font-black outline-none bg-transparent"
                    value={prices[f.id] || ""}
                    placeholder="0.00"
                    onChange={(e) => handlePriceChange(f.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all disabled:bg-gray-400"
              >
                {loading ? t("saving") : t("submitData")}
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full mt-4 text-gray-400 font-bold uppercase text-xs tracking-widest"
              >
                {t("startOver")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStationPhoto;
