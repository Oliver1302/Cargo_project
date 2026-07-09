import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BookingTool from "./pages/BookingTool.jsx";
import ShipmentDetail from "./pages/ShipmentDetail.jsx";

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
      <Link to="/book" className={linkClass("/book")}>Book a shipment</Link>
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
          path="/book"
          element={
            <RequireAuth>
              <BookingTool />
            </RequireAuth>
          }
        />
        <Route
          path="/shipments/:id"
          element={
            <RequireAuth>
              <ShipmentDetail />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
