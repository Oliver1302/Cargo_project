import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
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
  if (location.pathname === "/login") return null;
  const linkClass = (path) =>
    `text-sm ${location.pathname === path ? "font-medium text-gray-900" : "text-gray-500"}`;
  return (
    <div className="flex gap-6 border-b bg-white px-8 py-3">
      <Link to="/dashboard" className={linkClass("/dashboard")}>Shipments</Link>
      <Link to="/dispatch" className={linkClass("/dispatch")}>Dispatch</Link>
      <Link to="/new-shipment" className={linkClass("/new-shipment")}>New Shipment</Link>
      <Link to="/map" className={linkClass("/map")}>Map</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
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
    </>
  );
}
