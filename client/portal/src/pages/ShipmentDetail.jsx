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
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!shipment) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  const activeStage = stageIndex(shipment.status);
  const hasLivePosition = Boolean(shipment.current_lat);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
        ← Back to shipments
      </Link>

      <section className="portal-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Shipment detail</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{shipment.pro_number}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {shipment.origin_address} → {shipment.destination_address}
            </p>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {shipment.status ? shipment.status.replace(/_/g, " ") : "Pending"}
          </div>
        </div>
      </section>

      <section className="portal-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl">🚚</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">
              {shipment.driver_name || "Not yet assigned"}
            </div>
            <div className="text-sm text-slate-500">
              {shipment.vehicle_plate
                ? `Plate ${shipment.vehicle_plate} · ${shipment.vehicle_type || "Truck"}`
                : "Truck details pending assignment"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current speed</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {hasLivePosition ? `${Math.round(shipment.current_speed_mph || 0)} mph` : "—"}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Distance remaining</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {shipment.remaining_miles != null ? `${shipment.remaining_miles} mi` : "—"}
            </div>
          </div>
        </div>

        {!hasLivePosition && (
          <p className="mt-3 text-sm text-slate-500">Live position isn't available for this shipment yet.</p>
        )}
      </section>

      <section className="portal-card p-6">
        <div className="relative flex items-center">
          <div className="absolute left-4 right-4 top-[9px] h-0.5 bg-slate-200" />
          <div
            className="absolute left-4 top-[9px] h-0.5 bg-blue-600 transition-all"
            style={{ width: `${(activeStage / (STAGES.length - 1)) * 100}%`, maxWidth: "calc(100% - 32px)" }}
          />
          {STAGES.map((stage, i) => (
            <div key={stage.key} className="relative z-10 flex flex-1 flex-col items-center gap-2">
              <div
                className={`h-[18px] w-[18px] rounded-full border-2 ${
                  i <= activeStage ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                }`}
              />
              <div className={`text-xs ${i <= activeStage ? "font-medium text-slate-900" : "text-slate-400"}`}>
                {stage.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {shipment.border_crossing_point && (
        <section className="portal-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Cross-border</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-slate-600">{shipment.border_crossing_point}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              shipment.customs_status === "cleared" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}>
              Customs: {shipment.customs_status}
            </span>
          </div>
        </section>
      )}

      {shipment.pod_photo_base64 && (
        <section className="portal-card p-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Proof of delivery</p>
          <img src={shipment.pod_photo_base64} alt="Signed proof of delivery" className="w-full rounded-xl border border-slate-200" />
        </section>
      )}
    </div>
  );
}
