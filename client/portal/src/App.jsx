import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BookingTool from "./pages/BookingTool.jsx";
import ShipmentDetail from "./pages/ShipmentDetail.jsx";
import Invoices from "./pages/Invoices.jsx";
import DriverTracking from "./pages/DriverTracking.jsx";
import Profile from "./pages/Profile.jsx";

function isAuthenticated() {
  return Boolean(localStorage.getItem("token"));
}

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideOn = ["/login", "/register"];
  if (hideOn.includes(location.pathname) || location.pathname.startsWith("/driver/")) return null;

  const linkClass = (path) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
    }`;

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="General Logistics" className="h-12 w-auto flex-shrink-0" />
          <span className="hidden text-sm font-semibold text-slate-900 sm:inline">Client Portal</span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard" className={linkClass("/dashboard")}>Shipments</Link>
          <Link to="/book" className={linkClass("/book")}>Book a shipment</Link>
          <Link to="/invoices" className={linkClass("/invoices")}>Invoices</Link>
          <Link to="/profile" className={linkClass("/profile")}>Profile</Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/driver/:token" element={<DriverTracking />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/book" element={<RequireAuth><BookingTool /></RequireAuth>} />
          <Route path="/shipments/:id" element={<RequireAuth><ShipmentDetail /></RequireAuth>} />
          <Route path="/invoices" element={<RequireAuth><Invoices /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
