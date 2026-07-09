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
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-medium">Invoices</h1>

      <div className="mb-4 flex gap-1">
        {["all", "unpaid", "paid"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 text-sm capitalize ${
              tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {filtered.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between rounded border p-3 text-sm">
            <div>
              <div>{inv.pro_number}</div>
              <div className="text-xs text-gray-500">
                {new Date(inv.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="font-medium">${Number(inv.amount).toFixed(2)}</div>
            <StatusBadge status={inv.status} />
            {inv.status === "unpaid" && (
              <button
                onClick={() => pay(inv.id)}
                className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
              >
                Pay now
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && !error && (
          <p className="text-sm text-gray-500">No invoices here.</p>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Payments are simulated for now — a real Stripe checkout will replace the "Pay now" button
        once payment keys are added.
      </p>
    </div>
  );
}
