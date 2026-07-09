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
    const { source, destination, draggableId } = result;
    if (!destination) return; // dropped outside any column

    const driverId = destination.droppableId.replace("driver-", "");
    const shipmentId = draggableId.replace("shipment-", "");

    // Optimistic update: move the card immediately, reconcile with the server after.
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
      load(); // roll back to real server state if the assignment failed
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-xl font-medium">Dispatch board</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6">
          <div className="w-72 shrink-0">
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
                          className={`rounded border bg-white p-3 text-sm shadow-sm ${
                            snapshot.isDragging ? "ring-2 ring-blue-400" : ""
                          }`}
                        >
                          <div className="font-medium">{s.pro_number}</div>
                          <div className="text-xs text-gray-500">{s.destination_address}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {unassigned.length === 0 && (
                    <p className="text-xs text-gray-400">Nothing to assign right now.</p>
                  )}
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
                      driver.status === "available"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
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
                      className={`min-h-[120px] rounded border-2 border-dashed p-2 ${
                        snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      {shipments
                        .filter((s) => s.driver_id === driver.id)
                        .map((s) => (
                          <div key={s.id} className="mb-2 rounded bg-white p-2 text-xs shadow-sm">
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
  );
}
