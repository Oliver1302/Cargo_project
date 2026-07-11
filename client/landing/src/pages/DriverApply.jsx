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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink p-6 text-center font-body text-paper">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-signal">Application received</p>
        <h1 className="font-display text-3xl uppercase tracking-tight">You're on the list</h1>
        <p className="max-w-sm text-sm text-muted">
          We'll review your details and reach out on WhatsApp or a call once approved.
        </p>
        <Link to="/" className="mt-2 text-sm font-semibold text-signal hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink font-body text-paper">
      <div className="mx-auto max-w-md px-6 py-16">
        <Link to="/" className="mb-6 inline-block text-sm text-muted hover:text-signal">&larr; Back</Link>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.35em] text-signal">Drive for us</p>
        <h1 className="mb-1 font-display text-4xl uppercase tracking-tight">Apply to drive</h1>
        <p className="mb-6 text-sm text-muted">Takes two minutes. We'll review and get back to you.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Full name" className="w-full rounded-sm border border-white/10 bg-panel px-4 py-3 text-sm text-paper placeholder-muted focus:border-signal focus:outline-none"
            value={form.name} onChange={(e) => update("name", e.target.value)} />
          <input required type="tel" placeholder="Phone number (+254...)" className="w-full rounded-sm border border-white/10 bg-panel px-4 py-3 text-sm text-paper placeholder-muted focus:border-signal focus:outline-none"
            value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <input required placeholder="Driving license number" className="w-full rounded-sm border border-white/10 bg-panel px-4 py-3 text-sm text-paper placeholder-muted focus:border-signal focus:outline-none"
            value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} />
          <select className="w-full rounded-sm border border-white/10 bg-panel px-4 py-3 text-sm text-paper focus:border-signal focus:outline-none"
            value={form.equipmentType} onChange={(e) => update("equipmentType", e.target.value)}>
            <option value="V">53ft Dry Van</option>
            <option value="40V">40ft Container</option>
            <option value="20V">20ft Container</option>
            <option value="R">53ft Reefer</option>
            <option value="F">Flatbed</option>
            <option value="TNK">ISO Tank</option>
          </select>
          <input placeholder="Vehicle details (make, plate number)" className="w-full rounded-sm border border-white/10 bg-panel px-4 py-3 text-sm text-paper placeholder-muted focus:border-signal focus:outline-none"
            value={form.vehicleDetails} onChange={(e) => update("vehicleDetails", e.target.value)} />

          {error && <p className="text-sm text-canceled">{error}</p>}

          <button type="submit" disabled={submitting}
            className="clip-tag-sm w-full bg-signal py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-signalbright disabled:opacity-50">
            {submitting ? "Submitting\u2026" : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}
