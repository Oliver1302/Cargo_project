import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@shared/api/client.js";

export default function NewShipment() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: "",
    originAddress: "",
    destinationAddress: "",
    weightLbs: "",
    pickupDate: ""
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/admin/customers")
      .then(setCustomers)
      .catch((err) => setError(err.message));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/api/admin/shipments", {
        method: "POST",
        body: JSON.stringify(form)
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="admin-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">New shipment</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create a freight order in seconds.</h1>
        <p className="mt-2 text-sm text-slate-500">Capture the essentials and launch the next load from the operational hub.</p>
      </section>

      <form onSubmit={handleSubmit} className="admin-card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
          <select
            required
            className="admin-input"
            value={form.customerId}
            onChange={(e) => update("customerId", e.target.value)}
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Origin address</label>
          <input
            required
            className="admin-input"
            value={form.originAddress}
            onChange={(e) => update("originAddress", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Destination address</label>
          <input
            required
            className="admin-input"
            value={form.destinationAddress}
            onChange={(e) => update("destinationAddress", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Weight (lbs)</label>
            <input
              type="number"
              className="admin-input"
              value={form.weightLbs}
              onChange={(e) => update("weightLbs", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pickup date</label>
            <input
              type="date"
              className="admin-input"
              value={form.pickupDate}
              onChange={(e) => update("pickupDate", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="admin-button w-full disabled:opacity-50">
          {submitting ? "Creating…" : "Create shipment"}
        </button>
      </form>
    </div>
  );
}
