import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-neutral-950 border-t border-white/5 py-6">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">
            GasApp Premium System
          </p>
        </div>

        <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold text-white/40">
          <a
            href="#"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Карта
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Конфиденциальность
          </a>
          <span className="text-white/10">© 2026</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
