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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-80 space-y-4 rounded-lg border bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-lg font-medium">Client sign in</h1>
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded border px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded bg-gray-900 py-2 text-sm text-white">
            Sign in
          </button>
        </form>
        <p className="text-center text-xs text-gray-500">
          New client? <Link to="/register" className="text-gray-900 underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
