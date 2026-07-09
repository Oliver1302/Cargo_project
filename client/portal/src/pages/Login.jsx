import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "@shared/api/client.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const { token } = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_42%),linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_100%)] px-4 py-10">
      <div className="portal-card w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-8 text-white">
          <img src="/logo.svg" alt="General Logistics" className="mx-auto mb-4 h-16 w-auto" />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Client portal</p>
          <h1 className="mt-2 text-2xl font-semibold">Sign in to manage your freight</h1>
          <p className="mt-2 text-sm text-blue-100">View shipments, invoices, and booking updates in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              className="portal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="portal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="portal-button w-full">
            Sign in
          </button>
        </form>

        <p className="px-6 pb-6 text-center text-sm text-slate-500">
          New client? <Link to="/register" className="font-medium text-blue-600">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
