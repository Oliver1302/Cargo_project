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
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-4 text-xl font-medium">New shipment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Customer</label>
          <select
            required
            className="w-full rounded border px-3 py-2 text-sm"
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
          <label className="mb-1 block text-sm text-gray-600">Origin address</label>
          <input
            required
            className="w-full rounded border px-3 py-2 text-sm"
            value={form.originAddress}
            onChange={(e) => update("originAddress", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Destination address</label>
          <input
            required
            className="w-full rounded border px-3 py-2 text-sm"
            value={form.destinationAddress}
            onChange={(e) => update("destinationAddress", e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-gray-600">Weight (lbs)</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2 text-sm"
              value={form.weightLbs}
              onChange={(e) => update("weightLbs", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-gray-600">Pickup date</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-2 text-sm"
              value={form.pickupDate}
              onChange={(e) => update("pickupDate", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-gray-900 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create shipment"}
        </button>
      </form>
    </div>
  );
}
