import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";
import StatusBadge from "@shared/components/StatusBadge.jsx";

const CUSTOMS_COLORS = { pending: "text-amber-600", cleared: "text-emerald-700" };

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

  async function updateCustoms(id, customsStatus) {
    setShipments((prev) => prev.map((s) => (s.id === id ? { ...s, customs_status: customsStatus } : s)));
    try {
      await apiFetch(`/api/admin/shipments/${id}/customs-status`, {
        method: "PATCH",
        body: JSON.stringify({ customsStatus })
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function copyDriverLink(token) {
    const portalBase = import.meta.env.VITE_PORTAL_BASE_URL || "http://localhost:5174";
    navigator.clipboard.writeText(`${portalBase}/driver/${token}`);
  }

  const activeCount = shipments.filter((s) => !["delivered", "canceled"].includes(s.status)).length;
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden bg-gradient-to-r from-rose-600 via-rose-700 to-red-500 p-6 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">Ops overview</p>
            <h1 className="mt-2 text-2xl font-semibold">Keep every shipment moving with confidence.</h1>
            <p className="mt-2 max-w-2xl text-sm text-rose-100">Monitor active freight, distribute loads, and close deliveries from one control center.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-sm text-rose-100">Live fleet pulse</p>
            <p className="text-2xl font-semibold">{activeCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="admin-card p-4">
          <p className="text-sm text-slate-500">Active loads</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{activeCount}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-sm text-slate-500">Delivered</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{deliveredCount}</p>
        </div>
      </section>

      <section className="admin-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Shipment queue</h2>
            <p className="text-sm text-slate-500">Review shipments, share driver links, and close deliveries quickly.</p>
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Pro #</th>
                <th className="px-4 py-3">Origin</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Customs</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-t border-slate-200 bg-white">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {s.pro_number}
                    {s.is_full_container && (
                      <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">Full container</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.origin_address}</td>
                  <td className="px-4 py-3 text-slate-600">{s.destination_address}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    {s.border_crossing_point ? (
                      <div className="text-xs">
                        <div className="text-slate-500">{s.border_crossing_point}</div>
                        <select
                          value={s.customs_status}
                          onChange={(e) => updateCustoms(s.id, e.target.value)}
                          className={`rounded border-none bg-transparent text-xs ${CUSTOMS_COLORS[s.customs_status] || "text-slate-400"}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="cleared">Cleared</option>
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {s.driver_tracking_token && (
                        <button onClick={() => copyDriverLink(s.driver_tracking_token)} className="admin-button-secondary px-3 py-1.5 text-xs">
                          Copy driver link
                        </button>
                      )}
                      {s.status === "in_transit" && (
                        <button onClick={() => deliver(s.id)} className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                          Mark delivered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {shipments.length === 0 && !error && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No shipments yet.
          </div>
        )}
      </section>
    </div>
  );
}
