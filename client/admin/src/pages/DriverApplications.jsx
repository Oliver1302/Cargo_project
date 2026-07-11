import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

export default function DriverApplications() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);

  function load() {
    apiFetch("/api/admin/driver-applications").then(setApplications).catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    try {
      await apiFetch(`/api/admin/driver-applications/${id}/approve`, { method: "PATCH" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reject(id) {
    try {
      await apiFetch(`/api/admin/driver-applications/${id}/reject`, { method: "PATCH" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <h1 className="text-xl font-semibold text-slate-900">Driver applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approving here creates a real driver record. Verify license and vehicle details before approving.
        </p>
      </section>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="admin-card space-y-2 p-6">
        {applications.map((app) => (
          <div key={app.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <div>
              <div className="font-medium">{app.name} <span className="text-gray-400">· {app.phone}</span></div>
              <div className="text-xs text-gray-500">
                License {app.license_number} · {app.equipment_type} · {app.vehicle_details || "no vehicle details"}
              </div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[app.status]}`}>{app.status}</span>
            {app.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => approve(app.id)} className="rounded border border-green-600 px-2 py-1 text-xs text-green-700 hover:bg-green-50">
                  Approve
                </button>
                <button onClick={() => reject(app.id)} className="rounded border border-red-600 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {applications.length === 0 && !error && <p className="text-sm text-slate-500">No applications yet.</p>}
      </div>
    </div>
  );
}
