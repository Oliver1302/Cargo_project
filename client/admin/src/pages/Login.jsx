import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.16),_transparent_42%),linear-gradient(135deg,_#fff7f8_0%,_#fff1f2_100%)] px-4 py-10">
      <div className="admin-card w-full max-w-md overflow-hidden">
        <div className="bg-rose-600 px-6 py-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <img src="/logo.svg" alt="General Logistics" className="h-16 w-auto flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">General Logistics</p>
              <p className="text-sm font-semibold text-rose-100">Administrative Control</p>
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Sign in to run operations</h1>
          <p className="mt-2 text-sm text-rose-100">Dispatch loads, track shipments, and keep every move visible.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="ops@company.com"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="admin-button w-full">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
