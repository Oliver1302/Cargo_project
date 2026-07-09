import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "@shared/api/client.js";

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    companyName: "",
    taxId: "",
    billingAddress: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await apiFetch("/api/auth/register-client", {
        method: "POST",
        body: JSON.stringify(form)
      });
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-96 rounded-lg border bg-white p-6">
        <div className="mb-6 flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded ${s <= step ? "bg-gray-900" : "bg-gray-200"}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <h1 className="text-lg font-medium">Company info</h1>
              <input
                required
                placeholder="Company name"
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
              <button
                type="button"
                onClick={() => form.companyName && setStep(2)}
                className="w-full rounded bg-gray-900 py-2 text-sm text-white"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-lg font-medium">Billing details</h1>
              <input
                placeholder="Tax ID / EIN"
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.taxId}
                onChange={(e) => update("taxId", e.target.value)}
              />
              <input
                placeholder="Billing address"
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.billingAddress}
                onChange={(e) => update("billingAddress", e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded border py-2 text-sm">
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded bg-gray-900 py-2 text-sm text-white">
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-lg font-medium">Create your login</h1>
              <input
                required
                type="email"
                placeholder="Email"
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <input
                required
                type="password"
                placeholder="Password"
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded border py-2 text-sm">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded bg-gray-900 py-2 text-sm text-white disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create account"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Already have an account? <Link to="/login" className="text-gray-900 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
