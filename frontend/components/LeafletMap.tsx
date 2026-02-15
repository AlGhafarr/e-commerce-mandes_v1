'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';

// --- 1. ICON FIXER ---
const fixIcon = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

// --- 2. MAP CONTROLLER (SMART AUTO PAN) ---
// Hanya pindah kamera jika jaraknya JAUH (misal ganti kota dari dropdown), 
// jangan pindah kalau cuma geser marker sedikit.
function MapController({ coords }: { coords: [number, number] }) {
  const map = useMap();
  const prevCoords = useRef<[number, number]>(coords);

  useEffect(() => {
    if (!coords || (coords[0] === 0 && coords[1] === 0)) return;

    // Hitung jarak sederhana untuk menentukan apakah perlu 'terbang'
    const distLat = Math.abs(coords[0] - prevCoords.current[0]);
    const distLng = Math.abs(coords[1] - prevCoords.current[1]);

    // Threshold: Jika pindah lebih dari 0.005 derajat (sekitar 500m), baru flyTo.
    // Ini mencegah map "kaku" saat user hanya drag marker sedikit-sedikit.
    if (distLat > 0.002 || distLng > 0.002) {
      map.flyTo(coords, 16, { duration: 1.5 }); // Zoom level 16 agar lebih jelas
    }

    prevCoords.current = coords;
    
    // Fix: Invalidate size agar tidak abu-abu saat load pertama
    setTimeout(() => {
        map.invalidateSize();
    }, 200);

  }, [coords, map]);

  return null;
}

// --- 3. LOCATION PICKER (Click & Drag) ---
function LocationMarker({ position, onPositionChange }: { position: [number, number], onPositionChange: (lat: number, lng: number) => void }) {
  // Klik peta untuk pindah marker
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  const markerRef = useRef<any>(null);

  // Update posisi marker internal jika props berubah drastis (dari dropdown)
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  return position === null ? null : (
    <Marker 
      ref={markerRef}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange(pos.lat, pos.lng);
        },
      }}
    >
      <Popup>Lokasi Pengiriman</Popup>
    </Marker>
  );
}

// --- 4. MAIN COMPONENT ---
export default function LeafletMap({ position, onPositionChange }: { position: [number, number], onPositionChange: (lat: number, lng: number) => void }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fixIcon();
    setIsMounted(true);
  }, []);

  // Validasi: Pastikan Lat/Lng valid (Bukan NaN/Undefined)
  // Default ke Monas (Jakarta) jika data invalid/kosong agar map tidak crash
  const safePosition: [number, number] = 
    (position && !isNaN(position[0]) && !isNaN(position[1])) 
    ? position 
    : [-6.175392, 106.827153]; 

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-100 animate-pulse flex flex-col items-center justify-center text-gray-400 gap-2">
        <span className="animate-spin text-2xl">🌍</span>
        <span className="text-xs">Memuat Peta...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={safePosition}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", zIndex: 0, minHeight: "300px" }} // Pastikan minHeight ada
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController coords={safePosition} />
      <LocationMarker position={safePosition} onPositionChange={onPositionChange} />
    </MapContainer>
  );
}