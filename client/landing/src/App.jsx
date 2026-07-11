import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import DriverApply from "./pages/DriverApply.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/drive" element={<DriverApply />} />
    </Routes>
  );
}
