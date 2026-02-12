import React, { useState, useEffect } from "react";
import GoogleAd from "../Ads/GoogleAd";

const AdPopup = ({ isOpen, onClose }) => {
  const [showTimer, setShowTimer] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);

  // Таймер для повторного появления popup через 2 минуты
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        // Popup появится снова через 2 минуты
        setShowTimer(true);
        setTimeLeft(5);
      }, 120000); // 2 минуты

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Таймер обратного отсчета для кнопки закрытия
  useEffect(() => {
    if (isOpen && showTimer && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, showTimer, timeLeft]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto border-4 border-blue-500">
        {/* Заголовок */}
        <div className="sticky top-0 p-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-center border-b-4 border-blue-400">
          <h2 className="text-3xl font-black uppercase tracking-wider mb-2">
            📢 Реклама
          </h2>
          <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">
            Тут может быть ваша реклама
          </p>
        </div>

        {/* Контент с рекламой */}
        <div className="p-8 space-y-6">
          {/* Баннер */}
          <div>
            <GoogleAd slot="9999999999" format="auto" responsive={true} />
          </div>

          {/* Разделитель */}
          <div className="w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>

          {/* Второй баннер */}
          <div>
            <GoogleAd slot="8888888888" format="auto" responsive={true} />
          </div>

          {/* Информационный блок */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 text-center">
            <p className="text-sm font-bold text-gray-800 mb-3">
              💼 Размещайте рекламу и достигайте водителей по всей Грузии
            </p>
            <a
              href="mailto:contact@cheap-gasoline.ge"
              className="inline-block px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors uppercase text-xs"
            >
              Запросить место
            </a>
          </div>
        </div>

        {/* Кнопка закрытия */}
        <div className="sticky bottom-0 p-4 bg-white border-t-4 border-gray-200">
          <button
            onClick={onClose}
            className={`w-full py-4 font-black uppercase text-sm rounded-2xl transition-all ${
              timeLeft > 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            }`}
            disabled={timeLeft > 0}
          >
            {timeLeft > 0 ? `⏱️ Закрыть через ${timeLeft}с` : "✕ Закрыть"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdPopup;
