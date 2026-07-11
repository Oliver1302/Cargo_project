import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { apiFetch } from "@shared/api/client.js";

const containerStyle = { width: "100%", height: "500px", borderRadius: "8px" };
const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // center of the US as a fallback

export default function LiveMap() {
  const [shipments, setShipments] = useState([]);
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapsKey || "",
    id: "google-map-script"
  });

  useEffect(() => {
    apiFetch("/api/admin/shipments").then(setShipments).catch(() => {});
  }, []);

  if (!mapsKey) {
    return (
      <div className="space-y-6">
        <section className="admin-card p-6">
          <h1 className="text-xl font-semibold text-slate-900">Live tracking map</h1>
        </section>
        <div className="admin-card rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          No Google Maps API key configured yet. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to
          this app's environment variables (locally in <code>.env</code>, and in Vercel's
          project settings for the live site) to enable the map.
        </div>
      </div>
    );
  }

  if (!isLoaded) return <div className="admin-card p-8 text-sm text-slate-500">Loading map…</div>;

  const geocoded = shipments.filter((s) => s.origin_lat && s.destination_lat);

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <h1 className="text-xl font-semibold text-slate-900">Live tracking map</h1>
      </section>
      <div className="admin-card overflow-hidden p-2">
      <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={4}>
        {geocoded.map((s) => (
          <div key={s.id}>
            <Marker
              position={{ lat: Number(s.origin_lat), lng: Number(s.origin_lng) }}
              label={{ text: "O", color: "white" }}
            />
            <Marker
              position={{ lat: Number(s.destination_lat), lng: Number(s.destination_lng) }}
              label={{ text: "D", color: "white" }}
            />
          </div>
        ))}
      </GoogleMap>
      </div>
      {shipments.length > 0 && geocoded.length === 0 && (
        <p className="text-sm text-slate-500">
          Shipments exist, but none have coordinates yet — only shipments created after the
          Maps key was added get geocoded automatically.
        </p>
      )}
    </div>
  );
}
