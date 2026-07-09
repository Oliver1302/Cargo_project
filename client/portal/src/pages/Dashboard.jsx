import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@shared/api/client.js";
import StatusBadge from "@shared/components/StatusBadge.jsx";

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/portal/shipments")
      .then(setShipments)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-xl font-medium">Your shipments</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        {shipments.map((s) => (
          <Link
            key={s.id}
            to={`/shipments/${s.id}`}
            className="flex items-center justify-between rounded border p-3 text-sm hover:bg-gray-50"
          >
            <span>{s.pro_number}</span>
            <span className="text-gray-500">{s.destination_address}</span>
            <StatusBadge status={s.status} />
          </Link>
        ))}
      </div>
      {shipments.length === 0 && !error && (
        <p className="mt-4 text-sm text-gray-500">No shipments yet.</p>
      )}
    </div>
  );
}
