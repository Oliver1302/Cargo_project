import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetch } from "@shared/api/client.js";

const PERIODS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" }
];

export default function Sales() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/api/admin/analytics?period=${period}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [period]);

  const chartData = (data?.revenueByDay || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    gross: Number(d.gross),
    net: Number(d.net)
  }));

  const statusData = (data?.statusCounts || []).map((s) => ({
    status: s.status.replace("_", " "),
    count: Number(s.count)
  }));

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden bg-gradient-to-r from-rose-600 via-rose-700 to-red-500 p-6 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">Sales</p>
            <h1 className="mt-2 text-2xl font-semibold">Revenue, margin, and volume at a glance.</h1>
          </div>
          <div className="flex gap-1 rounded-full bg-white/10 p-1 backdrop-blur">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  period === p.key ? "bg-white text-rose-700" : "text-rose-100 hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {kpis && (
        <section className="grid gap-4 md:grid-cols-4">
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Gross revenue</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">${Number(kpis.total_gross).toFixed(0)}</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Net profit</p>
            <p className={`mt-2 text-2xl font-semibold ${Number(kpis.total_net) < 0 ? "text-red-600" : "text-emerald-700"}`}>
              ${Number(kpis.total_net).toFixed(0)}
            </p>
          </div>
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Avg invoice</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">${Number(kpis.avg_invoice).toFixed(0)}</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Outstanding</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">${Number(kpis.outstanding).toFixed(0)}</p>
          </div>
        </section>
      )}

      <section className="admin-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Revenue over time</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="gross" stroke="#e11d48" strokeWidth={2} dot={false} name="Gross" />
              <Line type="monotone" dataKey="net" stroke="#0f172a" strokeWidth={2} dot={false} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {chartData.length === 0 && <p className="text-sm text-slate-500">No invoice activity in this period.</p>}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="admin-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Shipments by status</h2>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Top routes</h2>
          <div className="space-y-2">
            {(data?.topRoutes || []).map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                <span className="text-slate-600">{r.origin_address} → {r.destination_address}</span>
                <span className="font-semibold text-slate-900">{r.shipment_count}</span>
              </div>
            ))}
            {(!data?.topRoutes || data.topRoutes.length === 0) && (
              <p className="text-sm text-slate-500">No route data yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
