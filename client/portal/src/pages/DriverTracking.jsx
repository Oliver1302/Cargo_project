import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function DriverTracking() {
  const { token } = useParams();
  const [shipment, setShipment] = useState(null);
  const [routeActive, setRouteActive] = useState(false);
  const [error, setError] = useState(null);
  const [delivered, setDelivered] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/driver/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid or expired tracking link");
        return res.json();
      })
      .then(setShipment)
      .catch((err) => setError(err.message));
  }, [token]);

  function pushLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch(`${API_BASE}/api/driver/${token}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speedMph: pos.coords.speed ? Math.round(pos.coords.speed * 2.237) : null
          })
        }).catch(() => {});
      },
      () => setError("Location permission is needed to share your position."),
      { enableHighAccuracy: true }
    );
  }

  function startRoute() {
    setRouteActive(true);
    pushLocation();
    intervalRef.current = setInterval(pushLocation, 15000);
  }

  function stopRoute() {
    setRouteActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function markDelivered() {
    stopRoute();
    try {
      const res = await fetch(`${API_BASE}/api/driver/${token}/deliver`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark as delivered");
      setDelivered(true);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => () => intervalRef.current && clearInterval(intervalRef.current), []);

  if (error) return <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-red-600">{error}</div>;
  if (!shipment) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>;

  if (delivered) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✅</div>
        <div className="text-xl font-semibold text-slate-900">Marked as delivered</div>
        <div className="text-sm text-slate-500">Thanks — you can close this page.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(135deg,_#f6fff9_0%,_#ecfdf5_100%)] px-4 py-6">
      <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 shadow-lg shadow-emerald-100/70">
        <div className="mb-5 rounded-2xl bg-emerald-600 p-4 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">Driver portal</p>
          <h1 className="mt-2 text-xl font-semibold">Route and delivery control</h1>
        </div>

        <div className="mb-5 text-sm text-slate-500">{shipment.pro_number}</div>
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          {shipment.origin_address} → {shipment.destination_address}
        </h2>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
              {shipment.status ? shipment.status.replace("_", " ") : "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Sharing location</span>
            <span className="font-medium text-slate-900">{routeActive ? "Active" : "Off"}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {!routeActive ? (
            <button onClick={startRoute} className="w-full rounded-2xl bg-emerald-600 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-700">
              Start route
            </button>
          ) : (
            <button onClick={stopRoute} className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-base font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">
              Pause sharing location
            </button>
          )}
          <button onClick={markDelivered} className="w-full rounded-2xl border border-emerald-600 py-3.5 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50">
            Mark as delivered
          </button>
        </div>
      </div>
    </div>
  );
}
