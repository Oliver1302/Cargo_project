import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "@shared/api/client.js";

const STAGES = [
  { key: "pending", label: "Ordered" },
  { key: "assigned", label: "Picked up" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" }
];

function stageIndex(status) {
  const i = STAGES.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const data = await apiFetch(`/api/portal/shipments/${id}`);
      setShipment(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // poll for live position every 10s
    return () => clearInterval(interval);
  }, [id]);

  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!shipment) return <div className="p-8 text-sm text-gray-500">Loading…</div>;

  const activeStage = stageIndex(shipment.status);
  const hasLivePosition = Boolean(shipment.current_lat);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link to="/dashboard" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900">
        ← Back to shipments
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">{shipment.pro_number}</h1>
          <p className="text-sm text-gray-500">
            {shipment.origin_address} → {shipment.destination_address}
          </p>
        </div>
      </div>

      {/* Truck / driver card */}
      <div className="mb-6 rounded-xl border bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
            🚚
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">
              {shipment.driver_name || "Not yet assigned"}
            </div>
            <div className="text-xs text-gray-500">
              {shipment.vehicle_plate
                ? `Plate ${shipment.vehicle_plate} · ${shipment.vehicle_type || "Truck"}`
                : "Truck details pending assignment"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Current speed</div>
            <div className="text-lg font-medium">
              {hasLivePosition ? `${Math.round(shipment.current_speed_mph || 0)} mph` : "—"}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Distance remaining</div>
            <div className="text-lg font-medium">
              {shipment.remaining_miles != null ? `${shipment.remaining_miles} mi` : "—"}
            </div>
          </div>
        </div>
        {!hasLivePosition && (
          <p className="mt-3 text-xs text-gray-400">
            Live position isn't available for this shipment yet.
          </p>
        )}
      </div>

      {/* Milestone tracker */}
      <div className="rounded-xl border bg-white p-5">
        <div className="relative flex items-center">
          <div className="absolute left-4 right-4 top-[9px] h-0.5 bg-gray-200" />
          <div
            className="absolute left-4 top-[9px] h-0.5 bg-gray-900 transition-all"
            style={{ width: `${(activeStage / (STAGES.length - 1)) * 100}%`, maxWidth: "calc(100% - 32px)" }}
          />
          {STAGES.map((stage, i) => (
            <div key={stage.key} className="relative z-10 flex flex-1 flex-col items-center gap-2">
              <div
                className={`h-[18px] w-[18px] rounded-full border-2 ${
                  i <= activeStage ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"
                }`}
              />
              <div className={`text-xs ${i <= activeStage ? "text-gray-900" : "text-gray-400"}`}>
                {stage.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
