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

  const activeCount = shipments.filter((s) => !["delivered", "canceled"].includes(s.status)).length;
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;
  const pendingCount = shipments.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      <section className="portal-card overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Client portal</p>
            <h1 className="mt-2 text-2xl font-semibold">Welcome back, your freight is on track.</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Review live shipment progress, book new loads, and keep invoices in one place.
            </p>
          </div>
          <Link to="/book" className="portal-button-secondary bg-white/10 text-white hover:bg-white/20">
            Book a shipment
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Active loads", value: activeCount, hint: "Currently moving" },
          { label: "Delivered", value: deliveredCount, hint: "Completed successfully" },
          { label: "Pending", value: pendingCount, hint: "Awaiting dispatch" }
        ].map((item) => (
          <div key={item.label} className="portal-card p-4">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-1 text-sm text-blue-600">{item.hint}</p>
          </div>
        ))}
      </section>

      <section className="portal-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent shipments</h2>
            <p className="text-sm text-slate-500">Track your latest bookings and delivery updates.</p>
          </div>
          <Link to="/book" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            New booking
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          {shipments.map((s) => (
            <Link
              key={s.id}
              to={`/shipments/${s.id}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{s.pro_number || "Pending shipment"}</p>
                <p className="text-sm text-slate-500">{s.destination_address || "Destination pending"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{s.origin_address || "Origin pending"}</span>
                <StatusBadge status={s.status} />
              </div>
            </Link>
          ))}
        </div>

        {shipments.length === 0 && !error && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No shipments yet. Start by booking your first load.
          </div>
        )}
      </section>
    </div>
  );
}
