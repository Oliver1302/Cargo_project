import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function DriverApply() {
  const [form, setForm] = useState({
    name: "", phone: "", licenseNumber: "", equipmentType: "V", vehicleDetails: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/driver-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to submit application");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-lg font-medium">Application received</div>
        <p className="max-w-sm text-sm text-gray-500">
          We'll review your details and reach out on WhatsApp or a call once approved.
        </p>
        <Link to="/" className="mt-2 text-sm underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-8 py-16">
      <Link to="/" className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-900">← Back</Link>
      <h1 className="mb-1 text-xl font-medium">Apply to drive</h1>
      <p className="mb-6 text-sm text-gray-500">Takes two minutes. We'll review and get back to you.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Full name" className="w-full rounded border px-3 py-2 text-sm"
          value={form.name} onChange={(e) => update("name", e.target.value)} />
        <input required type="tel" placeholder="Phone number (+254...)" className="w-full rounded border px-3 py-2 text-sm"
          value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        <input required placeholder="Driving license number" className="w-full rounded border px-3 py-2 text-sm"
          value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} />
        <select className="w-full rounded border px-3 py-2 text-sm"
          value={form.equipmentType} onChange={(e) => update("equipmentType", e.target.value)}>
          <option value="V">53ft Dry Van</option>
          <option value="40V">40ft Container</option>
          <option value="20V">20ft Container</option>
          <option value="R">53ft Reefer</option>
          <option value="F">Flatbed</option>
          <option value="TNK">ISO Tank</option>
        </select>
        <input placeholder="Vehicle details (make, plate number)" className="w-full rounded border px-3 py-2 text-sm"
          value={form.vehicleDetails} onChange={(e) => update("vehicleDetails", e.target.value)} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-gray-900 py-2 text-sm text-white disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}
