import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DispatchBoard from "./pages/DispatchBoard.jsx";
import NewShipment from "./pages/NewShipment.jsx";
import LiveMap from "./pages/LiveMap.jsx";

function isAuthenticated() {
  return Boolean(localStorage.getItem("token"));
}

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === "/login") return null;

  const linkClass = (path) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${
      location.pathname === path
        ? "bg-rose-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"
    }`;

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <header className="border-b border-rose-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="General Logistics" className="h-12 w-auto flex-shrink-0" />
          <span className="hidden text-sm font-semibold text-slate-900 sm:inline">Administrative Control</span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard" className={linkClass("/dashboard")}>Shipments</Link>
          <Link to="/dispatch" className={linkClass("/dispatch")}>Dispatch</Link>
          <Link to="/new-shipment" className={linkClass("/new-shipment")}>New Shipment</Link>
          <Link to="/map" className={linkClass("/map")}>Map</Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 text-slate-900">
      <NavBar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dispatch"
            element={
              <RequireAuth>
                <DispatchBoard />
              </RequireAuth>
            }
          />
          <Route
            path="/new-shipment"
            element={
              <RequireAuth>
                <NewShipment />
              </RequireAuth>
            }
          />
          <Route
            path="/map"
            element={
              <RequireAuth>
                <LiveMap />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
