"use client"

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix para los iconos de Leaflet en Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

export default function Map() {
  const position: [number, number] = [-11.926940306644893, -77.04262434668038]

  return (
    <MapContainer
      center={position}
      zoom={16}
      scrollWheelZoom={false}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Marker position={position} icon={icon}>
        <Popup>
          <div className="text-center leading-tight mt-1">
            <strong className="text-[#D6007A] block mb-1">Myku</strong>
            <span className="text-xs">Av Tupac Amaru km 13.5<br />Prdo Depósito Año Nuevo, Comas</span>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
