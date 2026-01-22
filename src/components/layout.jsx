import React, { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import Navbar from './ui/Navbar/Navbar'
import Footer from './ui/Footer/Footer'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto px-4">
      <Navbar />

      {/* Контейнер карты */}
      <div className="relative h-[500px] w-full mt-6">
        {/* Карта */}
        <MapContainer
          center={[41.7151, 44.8271]} // Тбилиси
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full rounded-lg shadow-lg"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>

        {/* Кнопка меню */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            ☰ Меню
          </button>

          {/* Меню, появляется при клике */}
          {menuOpen && (
            <div className="mt-2 bg-white shadow-lg rounded-lg p-4 w-48">
              <ul>
                <li className="py-1 hover:bg-gray-100 cursor-pointer">Пункт 1</li>
                <li className="py-1 hover:bg-gray-100 cursor-pointer">Пункт 2</li>
                <li className="py-1 hover:bg-gray-100 cursor-pointer">Пункт 3</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
