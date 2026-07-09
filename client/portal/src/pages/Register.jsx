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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_42%),linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_100%)] px-4 py-10">
      <div className="portal-card w-full max-w-md p-6">
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-blue-600" : "bg-slate-200"}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <h1 className="text-xl font-semibold text-slate-900">Company info</h1>
              <p className="text-sm text-slate-500">Tell us who you are so we can tailor your account.</p>
              <input
                required
                placeholder="Company name"
                className="portal-input"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
              <button
                type="button"
                onClick={() => form.companyName && setStep(2)}
                className="portal-button w-full"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-xl font-semibold text-slate-900">Billing details</h1>
              <p className="text-sm text-slate-500">Add your tax ID and billing address for faster invoicing.</p>
              <input
                placeholder="Tax ID / EIN"
                className="portal-input"
                value={form.taxId}
                onChange={(e) => update("taxId", e.target.value)}
              />
              <input
                placeholder="Billing address"
                className="portal-input"
                value={form.billingAddress}
                onChange={(e) => update("billingAddress", e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="portal-button-secondary flex-1">
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="portal-button flex-1">
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-xl font-semibold text-slate-900">Create your login</h1>
              <p className="text-sm text-slate-500">Set your sign-in details to access the portal.</p>
              <input
                required
                type="email"
                placeholder="Email"
                className="portal-input"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <input
                required
                type="password"
                placeholder="Password"
                className="portal-input"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="portal-button-secondary flex-1">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="portal-button flex-1 disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create account"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-medium text-blue-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
