import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";
import StatusBadge from "@shared/components/StatusBadge.jsx";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState(null);
  const [mpesaFor, setMpesaFor] = useState(null);
  const [phone, setPhone] = useState("");
  const [mpesaMessage, setMpesaMessage] = useState(null);

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

  async function payMpesa(id) {
    try {
      const result = await apiFetch(`/api/portal/invoices/${id}/pay-mpesa`, {
        method: "POST",
        body: JSON.stringify({ phone })
      });
      setMpesaMessage(result.message);
      setMpesaFor(null);
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = invoices.filter((i) => tab === "all" || i.status === tab);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="portal-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Billing</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Invoices</h1>
        <p className="mt-2 text-sm text-slate-500">Review balances and settle payments from one tidy workspace.</p>
      </section>

      <section className="portal-card p-6">
        <div className="mb-4 flex gap-2">
          {["all", "unpaid", "paid"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                tab === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {mpesaMessage && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{mpesaMessage}</div>}

        <div className="space-y-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{inv.pro_number}</div>
                  <div className="text-sm text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</div>
                </div>
                <div className="font-semibold text-slate-900">${Number(inv.amount).toFixed(2)}</div>
                <StatusBadge status={inv.status} />
                {inv.status === "unpaid" && (
                  <div className="flex gap-2">
                    <button onClick={() => pay(inv.id)} className="portal-button-secondary text-xs">Pay with card</button>
                    <button onClick={() => setMpesaFor(mpesaFor === inv.id ? null : inv.id)}
                      className="rounded-xl border border-emerald-600 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                      Pay with M-Pesa
                    </button>
                  </div>
                )}
              </div>
              {mpesaFor === inv.id && (
                <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
                  <input type="tel" placeholder="+2547XXXXXXXX" className="portal-input flex-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <button onClick={() => payMpesa(inv.id)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white">Send STK push</button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && !error && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No invoices here.</div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Card payments are simulated. M-Pesa isn't connected to a real paybill/till yet — the button is wired and ready, just needs Safaricom Daraja credentials to go live.
        </p>
      </section>
    </div>
  );
}
