import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";
import StatusBadge from "@shared/components/StatusBadge.jsx";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState(null);

  async function load() {
    try {
      const data = await apiFetch("/api/portal/invoices");
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function pay(id) {
    try {
      await apiFetch(`/api/portal/invoices/${id}/pay`, { method: "POST" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = invoices.filter((i) => tab === "all" || i.status === tab);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="portal-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Billing</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Invoices</h1>
            <p className="mt-2 text-sm text-slate-500">Review balances and settle payments from one tidy workspace.</p>
          </div>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="mb-4 flex gap-2">
          {["all", "unpaid", "paid"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                tab === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-slate-900">{inv.pro_number}</div>
                <div className="text-sm text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</div>
              </div>
              <div className="font-semibold text-slate-900">${Number(inv.amount).toFixed(2)}</div>
              <StatusBadge status={inv.status} />
              {inv.status === "unpaid" && (
                <button onClick={() => pay(inv.id)} className="portal-button-secondary text-xs">
                  Pay now
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && !error && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No invoices here.
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Payments are simulated for now — a real Stripe checkout will replace the “Pay now” button once payment keys are added.
        </p>
      </section>
    </div>
  );
}
