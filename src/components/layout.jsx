import React from "react";
import Navbar from "./ui/Navbar/Navbar";
import Footer from "./ui/Footer/Footer";
import MapComponent from "./MapComponent";

export default function Layout() {
  return (
    /* h-screen и flex-col позволяют растянуть контент на всю высоту */
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Навбар всегда сверху */}
      <Navbar />

      {/* Основная область: flex-1 забирает всё место, overflow-hidden убирает лишние скроллы */}
      <main className="flex-1 relative w-full overflow-hidden">
        <MapComponent />
      </main>

      {/* Футер на страницах с картой обычно не нужен, но если хочешь — оставь. 
          Я его закомментирую, чтобы он не отъедал место у карты */}
      {/* <Footer /> */}
    </div>
  );
}
