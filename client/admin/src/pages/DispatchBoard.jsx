import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiFetch } from "@shared/api/client.js";

const AVG_SPEED_MPH = 55;
const LINEHAUL_PER_MILE = 2.0;
const COST_PER_MILE = 0.55; // driver pay + fuel, applied to total miles including deadhead

function haversineMiles(a, b) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function DispatchBoard() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState({}); // shipmentId -> suggestion text
  const [suggesting, setSuggesting] = useState(null);

  async function load() {
    try {
      const [shipmentData, driverData] = await Promise.all([
        apiFetch("/api/admin/shipments"),
        apiFetch("/api/admin/drivers")
      ]);
      setShipments(shipmentData);
      setDrivers(driverData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unassigned = shipments.filter((s) => s.status === "pending");

  async function handleDragEnd(result) {
    const { destination, draggableId } = result;
    if (!destination) return;

    const driverId = destination.droppableId.replace("driver-", "");
    const shipmentId = draggableId.replace("shipment-", "");

    setShipments((prev) =>
      prev.map((s) => (String(s.id) === shipmentId ? { ...s, status: "assigned", driver_id: Number(driverId) } : s))
    );
    setDrivers((prev) => prev.map((d) => (String(d.id) === driverId ? { ...d, status: "on_route" } : d)));

    try {
      await apiFetch(`/api/admin/shipments/${shipmentId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ driverId: Number(driverId) })
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  async function updateHours(driverId, hoursRemaining) {
    setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, hours_remaining: hoursRemaining } : d)));
    try {
      await apiFetch(`/api/admin/drivers/${driverId}`, {
        method: "PATCH",
        body: JSON.stringify({ hoursRemaining })
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function profitability(shipment, driver) {
    const hasOrigin = shipment.origin_lat && shipment.destination_lat;
    const loadedMiles = hasOrigin
      ? haversineMiles(
          { lat: Number(shipment.origin_lat), lng: Number(shipment.origin_lng) },
          { lat: Number(shipment.destination_lat), lng: Number(shipment.destination_lng) }
        )
      : null;
    const deadheadMiles =
      hasOrigin && driver.current_lat
        ? haversineMiles(
            { lat: Number(driver.current_lat), lng: Number(driver.current_lng) },
            { lat: Number(shipment.origin_lat), lng: Number(shipment.origin_lng) }
          )
        : null;

    if (loadedMiles == null) return null;
    const totalMiles = loadedMiles + (deadheadMiles || 0);
    const revenue = loadedMiles * LINEHAUL_PER_MILE;
    const cost = totalMiles * COST_PER_MILE;
    const margin = revenue - cost;
    const estimatedHours = totalMiles / AVG_SPEED_MPH;
    const atRisk = driver.hours_remaining != null && estimatedHours > Number(driver.hours_remaining);

    return { loadedMiles, deadheadMiles, margin, atRisk, estimatedHours };
  }

  async function suggestDriver(shipmentId) {
    setSuggesting(shipmentId);
    try {
      const result = await apiFetch(`/api/admin/shipments/${shipmentId}/suggest-driver`);
      const driverName = drivers.find((d) => d.id === result.suggestion.driverId)?.name || "No driver";
      setSuggestions((prev) => ({
        ...prev,
        [shipmentId]: `${driverName} — ${result.suggestion.reason} (${result.suggestion.source === "ai" ? "AI" : "rule-based"})`
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSuggesting(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden bg-gradient-to-r from-rose-600 via-rose-700 to-red-500 p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">Dispatch</p>
        <h1 className="mt-2 text-2xl font-semibold">Match freight to trucks, profitably.</h1>
        <p className="mt-2 max-w-2xl text-sm text-rose-100">
          Deadhead/loaded miles use straight-line distance (swap for PC*MILER for production accuracy).
          Driver hours are entered manually until a real ELD integration is connected.
        </p>
      </section>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="admin-card p-6">

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6">
          <div className="w-80 shrink-0">
            <h2 className="mb-2 text-sm font-medium text-gray-500">Unassigned shipments</h2>
            <Droppable droppableId="unassigned" isDropDisabled>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {unassigned.map((s, index) => (
                    <Draggable key={s.id} draggableId={`shipment-${s.id}`} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm ${
                            snapshot.isDragging ? "ring-2 ring-blue-400" : ""
                          }`}
                        >
                          <div className="font-medium">
                            {s.pro_number}
                            {s.requested_equipment_type && s.requested_equipment_type !== "V" && (
                              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                                {s.requested_equipment_type}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{s.destination_address}</div>

                          <button
                            onClick={() => suggestDriver(s.id)}
                            disabled={suggesting === s.id}
                            className="mt-2 rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
                          >
                            {suggesting === s.id ? "Thinking…" : "✨ Suggest best driver"}
                          </button>
                          {suggestions[s.id] && (
                            <div className="mt-1 rounded bg-blue-50 p-1.5 text-[11px] text-blue-800">
                              {suggestions[s.id]}
                            </div>
                          )}

                          {drivers.filter((d) => d.status === "available").map((driver) => {
                            const p = profitability(s, driver);
                            if (!p) return null;
                            return (
                              <div key={driver.id} className="mt-2 border-t pt-1 text-[11px] text-gray-500">
                                {driver.name}: {p.deadheadMiles != null ? `${Math.round(p.deadheadMiles)}mi deadhead + ` : ""}
                                {Math.round(p.loadedMiles)}mi loaded · est. margin{" "}
                                <span className={p.margin < 0 ? "text-red-600" : "text-green-700"}>
                                  ${p.margin.toFixed(0)}
                                </span>
                                {p.atRisk && <span className="ml-1 text-amber-600">⚠ At risk on hours</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {unassigned.length === 0 && <p className="text-xs text-gray-400">Nothing to assign right now.</p>}
                </div>
              )}
            </Droppable>
          </div>

          <div className="flex flex-1 gap-4 overflow-x-auto">
            {drivers.map((driver) => (
              <div key={driver.id} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{driver.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      driver.status === "available" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {driver.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                  Hours left:
                  <input
                    type="number"
                    className="w-14 rounded-lg border border-slate-200 px-1 py-0.5 text-xs"
                    value={driver.hours_remaining ?? ""}
                    onChange={(e) => updateHours(driver.id, e.target.value)}
                  />
                </div>
                <Droppable droppableId={`driver-${driver.id}`} isDropDisabled={driver.status !== "available"}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[120px] rounded-xl border-2 border-dashed p-2 ${
                        snapshot.isDraggingOver ? "border-rose-400 bg-rose-50" : "border-slate-200"
                      }`}
                    >
                      {shipments
                        .filter((s) => s.driver_id === driver.id)
                        .map((s) => (
                          <div key={s.id} className="mb-2 rounded-lg border border-slate-100 bg-white p-2 text-xs shadow-sm">
                            {s.pro_number}
                          </div>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
      </div>
    </div>
  );
}
