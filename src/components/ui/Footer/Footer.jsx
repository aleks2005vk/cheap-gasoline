import React from "react";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 w-full z-[1000] px-0 sm:px-6 sm:pb-4 pointer-events-none">
      <div className="mx-auto max-w-7xl bg-black/[0.85] backdrop-blur-2xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl pointer-events-auto">
        <div className="flex h-14 items-center justify-between px-8 flex-col md:flex-row gap-4 py-8 md:py-0">
          {/* ЛЕВАЯ ЧАСТЬ: СТАТУС СИСТЕМЫ */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-black">
              Gas<span className="text-white/10">App</span> Premium System
            </p>
          </div>

          {/* ПРАВАЯ ЧАСТЬ: ССЫЛКИ И КОПИРАЙТ */}
          <div className="flex items-center gap-8 text-[9px] uppercase tracking-[0.2em] font-bold">
            <div className="flex gap-6 text-white/40">
              <a
                href="#"
                className="hover:text-white transition-all duration-300 cursor-pointer"
              >
                Карта
              </a>
              <a
                href="#"
                className="hover:text-white transition-all duration-300 cursor-pointer"
              >
                Конфиденциальность
              </a>
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-white/10"></div>

            <span className="text-white/10 tabular-nums">© 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
