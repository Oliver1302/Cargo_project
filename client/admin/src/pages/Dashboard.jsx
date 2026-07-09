import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";
import StatusBadge from "@shared/components/StatusBadge.jsx";

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState(null);

  function load() {
    apiFetch("/api/admin/shipments")
      .then(setShipments)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function deliver(id) {
    try {
      await apiFetch(`/api/admin/shipments/${id}/deliver`, { method: "PATCH" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function copyDriverLink(token) {
    const portalBase = import.meta.env.VITE_PORTAL_BASE_URL || "http://localhost:5174";
    navigator.clipboard.writeText(`${portalBase}/driver/${token}`);
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-medium">Shipments</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Pro #</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="py-2">{s.pro_number}</td>
              <td>{s.origin_address}</td>
              <td>{s.destination_address}</td>
              <td>
                <StatusBadge status={s.status} />
              </td>
              <td className="space-x-2 text-right">
                {s.driver_tracking_token && (
                  <button
                    onClick={() => copyDriverLink(s.driver_tracking_token)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Copy driver link
                  </button>
                )}
                {s.status === "in_transit" && (
                  <button
                    onClick={() => deliver(s.id)}
                    className="rounded border border-green-600 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                  >
                    Mark delivered
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {shipments.length === 0 && !error && (
        <p className="mt-4 text-sm text-gray-500">No shipments yet.</p>
      )}
    </div>
  );
}
