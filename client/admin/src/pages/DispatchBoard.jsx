import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiFetch } from "@shared/api/client.js";

export default function DispatchBoard() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);

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
      prev.map((s) =>
        String(s.id) === shipmentId ? { ...s, status: "assigned", driver_id: Number(driverId) } : s
      )
    );
    setDrivers((prev) =>
      prev.map((d) => (String(d.id) === driverId ? { ...d, status: "on_route" } : d))
    );

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

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Dispatch board</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Assign loads with a modern control board.</h1>
        <p className="mt-2 text-sm text-slate-500">Drag upcoming shipments into driver lanes and keep the network moving in real time.</p>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="w-full shrink-0 xl:w-72">
            <div className="admin-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Unassigned shipments</h2>
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
                              snapshot.isDragging ? "ring-2 ring-rose-400" : ""
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{s.pro_number}</div>
                            <div className="mt-1 text-xs text-slate-500">{s.destination_address}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {unassigned.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                        Nothing to assign right now.
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4">
              {drivers.map((driver) => (
                <div key={driver.id} className="w-64 shrink-0">
                  <div className="admin-card p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-900">{driver.name}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          driver.status === "available"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {driver.status.replace("_", " ")}
                      </span>
                    </div>
                    <Droppable droppableId={`driver-${driver.id}`} isDropDisabled={driver.status !== "available"}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[140px] rounded-xl border-2 border-dashed p-2 ${
                            snapshot.isDraggingOver ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          {shipments
                            .filter((s) => s.driver_id === driver.id)
                            .map((s) => (
                              <div key={s.id} className="mb-2 rounded-lg bg-white p-2 text-xs shadow-sm">
                                {s.pro_number}
                              </div>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
