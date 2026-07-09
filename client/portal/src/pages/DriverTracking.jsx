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
  if (!shipment) return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading…</div>;

  if (delivered) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="text-3xl">✅</div>
        <div className="text-lg font-medium">Marked as delivered</div>
        <div className="text-sm text-gray-500">Thanks — you can close this page.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-between p-6">
      <div>
        <div className="mb-1 text-sm text-gray-500">{shipment.pro_number}</div>
        <h1 className="mb-6 text-lg font-medium">{shipment.origin_address} → {shipment.destination_address}</h1>

        <div className="rounded-xl border p-4 text-sm">
          <div className="mb-2 flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="capitalize">{shipment.status.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sharing location</span>
            <span>{routeActive ? "Active" : "Off"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pb-6">
        {!routeActive ? (
          <button
            onClick={startRoute}
            className="w-full rounded-xl bg-gray-900 py-4 text-base font-medium text-white"
          >
            Start route
          </button>
        ) : (
          <button
            onClick={stopRoute}
            className="w-full rounded-xl border py-4 text-base font-medium"
          >
            Pause sharing location
          </button>
        )}
        <button
          onClick={markDelivered}
          className="w-full rounded-xl border border-green-600 py-4 text-base font-medium text-green-700"
        >
          Mark as delivered
        </button>
      </div>
    </div>
  );
}
