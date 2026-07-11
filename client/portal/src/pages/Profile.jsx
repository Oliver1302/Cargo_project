import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [error, setError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newAddress, setNewAddress] = useState({ label: "", address: "" });
  const [newPayment, setNewPayment] = useState({ methodType: "card", displayLabel: "" });

  function loadAll() {
    apiFetch("/api/portal/profile").then(setProfile).catch((err) => setError(err.message));
    apiFetch("/api/portal/profile/addresses").then(setAddresses).catch(() => {});
    apiFetch("/api/portal/profile/payment-methods").then(setPaymentMethods).catch(() => {});
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch("/api/portal/profile", {
        method: "PATCH",
        body: JSON.stringify({
          companyName: profile.company_name,
          taxId: profile.tax_id,
          billingAddress: profile.billing_address
        })
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function addAddress(e) {
    e.preventDefault();
    if (!newAddress.label || !newAddress.address) return;
    try {
      await apiFetch("/api/portal/profile/addresses", { method: "POST", body: JSON.stringify(newAddress) });
      setNewAddress({ label: "", address: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeAddress(id) {
    await apiFetch(`/api/portal/profile/addresses/${id}`, { method: "DELETE" }).catch(() => {});
    loadAll();
  }

  async function addPaymentMethod(e) {
    e.preventDefault();
    if (!newPayment.displayLabel) return;
    try {
      await apiFetch("/api/portal/profile/payment-methods", { method: "POST", body: JSON.stringify(newPayment) });
      setNewPayment({ methodType: "card", displayLabel: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removePaymentMethod(id) {
    await apiFetch(`/api/portal/profile/payment-methods/${id}`, { method: "DELETE" }).catch(() => {});
    loadAll();
  }

  if (!profile) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="portal-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Profile</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{profile.company_name}</h1>
        <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="portal-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Company details</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company name</label>
            <input className="portal-input" value={profile.company_name || ""} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tax ID / EIN</label>
            <input className="portal-input" value={profile.tax_id || ""} onChange={(e) => setProfile({ ...profile, tax_id: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Billing address</label>
            <input className="portal-input" value={profile.billing_address || ""} onChange={(e) => setProfile({ ...profile, billing_address: e.target.value })} />
          </div>
          <button type="submit" disabled={savingProfile} className="portal-button disabled:opacity-50">
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="portal-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Saved addresses</h2>
        <div className="space-y-2">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{a.label}</span>
                {a.is_default && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Default</span>}
                <div className="text-slate-500">{a.address}</div>
              </div>
              <button onClick={() => removeAddress(a.id)} className="text-xs font-medium text-slate-400 hover:text-red-500">Remove</button>
            </div>
          ))}
          {addresses.length === 0 && <p className="text-sm text-slate-500">No saved addresses yet.</p>}
        </div>

        <form onSubmit={addAddress} className="mt-4 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
          <input className="portal-input" placeholder="Label (e.g. Warehouse)" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
          <input className="portal-input" placeholder="Full address" value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} />
          <button type="submit" className="portal-button-secondary">Add</button>
        </form>
      </section>

      <section className="portal-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Payment methods</h2>
        <div className="space-y-2">
          {paymentMethods.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{p.display_label}</span>
                {p.is_default && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Default</span>}
                <div className="text-slate-500 capitalize">{p.method_type}</div>
              </div>
              <button onClick={() => removePaymentMethod(p.id)} className="text-xs font-medium text-slate-400 hover:text-red-500">Remove</button>
            </div>
          ))}
          {paymentMethods.length === 0 && <p className="text-sm text-slate-500">No saved payment methods yet.</p>}
        </div>

        <form onSubmit={addPaymentMethod} className="mt-4 grid gap-2 md:grid-cols-[auto_1fr_auto]">
          <select className="portal-input" value={newPayment.methodType} onChange={(e) => setNewPayment({ ...newPayment, methodType: e.target.value })}>
            <option value="card">Card</option>
            <option value="mpesa">M-Pesa</option>
          </select>
          <input className="portal-input" placeholder="e.g. Visa ending 4242 or +2547XXXXXXXX" value={newPayment.displayLabel} onChange={(e) => setNewPayment({ ...newPayment, displayLabel: e.target.value })} />
          <button type="submit" className="portal-button-secondary">Add</button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          This is a label only — no real card numbers are stored here until a real payment gateway is connected.
        </p>
      </section>
    </div>
  );
}
