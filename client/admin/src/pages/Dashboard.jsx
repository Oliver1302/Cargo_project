import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";
import StatusBadge from "@shared/components/StatusBadge.jsx";

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/shipments")
      .then(setShipments)
      .catch((err) => setError(err.message));
  }, []);

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
