import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";
import StatusBadge from "@shared/components/StatusBadge.jsx";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    apiFetch("/api/admin/invoices").then(setInvoices).catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  function openEditor(inv) {
    setEditing({
      id: inv.id,
      linehaulRate: inv.linehaul_rate || 0,
      fscRate: inv.fsc_rate || 0,
      detentionHours: inv.detention_hours || 0,
      detentionRate: inv.detention_rate || 60,
      lumperFee: inv.lumper_fee || 0,
      tarpingFee: inv.tarping_fee || 0,
      driverPay: inv.driver_pay || 0,
      factoringFee: inv.factoring_fee || 0
    });
  }

  const detentionTotal = editing ? Number(editing.detentionHours) * Number(editing.detentionRate) : 0;
  const gross = editing
    ? Number(editing.linehaulRate) + Number(editing.fscRate) + detentionTotal + Number(editing.lumperFee) + Number(editing.tarpingFee)
    : 0;
  const net = editing ? gross - Number(editing.driverPay) - Number(editing.factoringFee) : 0;

  async function save() {
    try {
      await apiFetch(`/api/admin/invoices/${editing.id}`, { method: "PATCH", body: JSON.stringify(editing) });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function update(field, value) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  const totalGross = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalNet = invoices.reduce((sum, i) => sum + Number(i.net_rate), 0);

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden bg-gradient-to-r from-rose-600 via-rose-700 to-red-500 p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">Billing</p>
        <h1 className="mt-2 text-2xl font-semibold">Invoices &amp; rate engine.</h1>
        <p className="mt-2 max-w-2xl text-sm text-rose-100">Linehaul, fuel surcharge, accessorials, driver pay, and factoring — all editable per shipment.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="admin-card p-4">
          <p className="text-sm text-slate-500">Total gross invoiced</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">${totalGross.toFixed(2)}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-sm text-slate-500">Total net (profit)</p>
          <p className={`mt-2 text-3xl font-semibold ${totalNet < 0 ? "text-red-600" : "text-emerald-700"}`}>${totalNet.toFixed(2)}</p>
        </div>
      </section>

      <section className="admin-card p-6">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Pro #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Net</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-200 bg-white">
                  <td className="px-4 py-3 font-medium text-slate-900">{inv.pro_number}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.company_name}</td>
                  <td className="px-4 py-3 text-slate-600">${Number(inv.amount).toFixed(2)}</td>
                  <td className={`px-4 py-3 ${Number(inv.net_rate) < 0 ? "text-red-600" : "text-slate-600"}`}>${Number(inv.net_rate).toFixed(2)}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditor(inv)} className="admin-button-secondary px-3 py-1.5 text-xs">Edit rate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && !error && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No invoices yet.</div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="admin-card w-full max-w-md p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit rate breakdown</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Linehaul rate</span>
                <input type="number" className="admin-input w-28" value={editing.linehaulRate} onChange={(e) => update("linehaulRate", e.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Fuel surcharge (FSC)</span>
                <input type="number" className="admin-input w-28" value={editing.fscRate} onChange={(e) => update("fscRate", e.target.value)} />
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Accessorials</div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-slate-600">Detention (hrs × rate)</span>
                  <div className="flex gap-1">
                    <input type="number" className="admin-input w-16" value={editing.detentionHours} onChange={(e) => update("detentionHours", e.target.value)} />
                    <input type="number" className="admin-input w-16" value={editing.detentionRate} onChange={(e) => update("detentionRate", e.target.value)} />
                  </div>
                </div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-slate-600">Lumper fee</span>
                  <input type="number" className="admin-input w-28" value={editing.lumperFee} onChange={(e) => update("lumperFee", e.target.value)} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Tarping fee</span>
                  <input type="number" className="admin-input w-28" value={editing.tarpingFee} onChange={(e) => update("tarpingFee", e.target.value)} />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Driver / carrier pay</span>
                  <input type="number" className="admin-input w-28" value={editing.driverPay} onChange={(e) => update("driverPay", e.target.value)} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-slate-600">Factoring / brokerage fee</span>
                  <input type="number" className="admin-input w-28" value={editing.factoringFee} onChange={(e) => update("factoringFee", e.target.value)} />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex justify-between"><span>Gross invoiced</span><span className="font-semibold">${gross.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Net rate (profit)</span>
                  <span className={`font-semibold ${net < 0 ? "text-red-600" : "text-emerald-700"}`}>${net.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditing(null)} className="admin-button-secondary flex-1">Cancel</button>
              <button onClick={save} className="admin-button flex-1">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
