import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon paths in production/build environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapPicker = ({ lat, lng, onChange }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Set default coordinates if none exist (Default: New Delhi, India)
  const initialLat = lat || 28.6139;
  const initialLng = lng || 77.2090;

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Create a draggable marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Make sure initial default is set in the form state
      if (!lat || !lng) {
        onChange(initialLat, initialLng);
      }

      // Handle dragend event
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onChange(position.lat.toFixed(6), position.lng.toFixed(6));
      });

      // Handle map click to reposition marker
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat.toFixed(6), lng.toFixed(6));
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position and map center when coordinates change from outside
  useEffect(() => {
    if (mapInstanceRef.current && lat && lng) {
      const currentMarkerLatLng = markerRef.current ? markerRef.current.getLatLng() : null;
      
      // Only update if coordinates are actually different to prevent infinite loops
      if (!currentMarkerLatLng || 
          currentMarkerLatLng.lat.toFixed(6) !== parseFloat(lat).toFixed(6) || 
          currentMarkerLatLng.lng.toFixed(6) !== parseFloat(lng).toFixed(6)) {
        
        const newLatLng = [parseFloat(lat), parseFloat(lng)];
        
        if (markerRef.current) {
          markerRef.current.setLatLng(newLatLng);
        }
        mapInstanceRef.current.setView(newLatLng, 13);
      }
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Pin Vehicle Location <span className="text-red-500">*</span>
        </label>
        {lat && lng && (
          <span className="text-[10px] text-zinc-500 font-mono">
            Lat: {lat}, Lng: {lng}
          </span>
        )}
      </div>
      <div 
        ref={mapContainerRef} 
        className="w-full h-64 rounded-2xl border border-zinc-800 overflow-hidden shadow-inner z-10"
        style={{ minHeight: "250px" }}
      />
      <p className="text-[10px] text-zinc-500">
        📍 Drag the marker or click on the map to pin the exact pickup location.
      </p>
    </div>
  );
};

export default MapPicker;
