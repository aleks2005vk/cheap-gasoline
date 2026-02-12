import React from "react";
import GoogleAd from "../Ads/GoogleAd";

const LeftAdSidebar = () => {
  return (
    <div className="fixed left-0 top-0 h-screen w-80 md:w-96 flex flex-col bg-gradient-to-b from-blue-900 to-blue-800 overflow-hidden shadow-2xl z-[1000] border-r border-blue-700">
      {/* Заголовок */}
      <div className="p-6 pt-20 sticky top-0 bg-blue-900/95 backdrop-blur-md z-10 border-b-2 border-blue-700">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
            📢 Реклама
          </h2>
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">
            Тут может быть ваша реклама
          </p>
        </div>
      </div>

      {/* Основная область с рекламой */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar flex flex-col items-center justify-start">
        {/* Баннер 1 */}
        <div className="w-full">
          <GoogleAd slot="9999999999" format="auto" responsive={true} />
        </div>

        {/* Декоративный разделитель */}
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"></div>

        {/* Баннер 2 */}
        <div className="w-full">
          <GoogleAd slot="8888888888" format="auto" responsive={true} />
        </div>

        {/* Инфо блок */}
        <div className="w-full mt-auto mb-4 p-4 bg-blue-700/50 rounded-2xl border border-blue-600 text-center">
          <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest leading-relaxed">
            💼 Размещайте свою рекламу и достигайте аудитории водителей Грузии
          </p>
          <a
            href="mailto:contact@cheap-gasoline.ge"
            className="inline-block mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-black rounded-lg transition-colors uppercase"
          >
            Связаться с нами
          </a>
        </div>
      </div>

      {/* Нижний текст */}
      <div className="p-4 bg-blue-900/80 border-t border-blue-700 text-center">
        <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">
          Ваша компания здесь
        </p>
      </div>
    </div>
  );
};

export default LeftAdSidebar;
