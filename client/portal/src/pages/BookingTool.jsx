import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@shared/api/client.js";

export default function BookingTool() {
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [units, setUnits] = useState([]);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function addUnit(type) {
    setUnits((prev) => [...prev, { id: crypto.randomUUID(), type, weight: "" }]);
  }

  function updateUnitWeight(id, weight) {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, weight } : u)));
  }

  function removeUnit(id) {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }

  const totalWeight = units.reduce((sum, u) => sum + (Number(u.weight) || 0), 0);

  async function getQuote() {
    if (!originAddress || !destinationAddress) return;
    setError(null);
    try {
      const result = await apiFetch("/api/portal/shipments/quote", {
        method: "POST",
        body: JSON.stringify({ originAddress, destinationAddress })
      });
      setQuote(result);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBook() {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/portal/shipments", {
        method: "POST",
        body: JSON.stringify({
          originAddress,
          destinationAddress,
          weightLbs: totalWeight || null,
          pickupDate: pickupDate || null
        })
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="mb-4 text-xl font-medium">Book a shipment</h1>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Pickup address</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={originAddress}
            onChange={(e) => setOriginAddress(e.target.value)}
            placeholder="Street, City, State"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Delivery address</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder="Street, City, State"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Pickup date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2 text-sm"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-600">Handling units</label>
          <div className="space-y-2">
            {units.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                <span className="flex-1 capitalize">{u.type}</span>
                <input
                  type="number"
                  placeholder="lbs"
                  className="w-24 rounded border px-2 py-1 text-sm"
                  value={u.weight}
                  onChange={(e) => updateUnitWeight(u.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeUnit(u.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => addUnit("pallet")}
              className="flex-1 rounded border px-3 py-2 text-sm"
            >
              + Add Pallet
            </button>
            <button
              type="button"
              onClick={() => addUnit("box")}
              className="flex-1 rounded border px-3 py-2 text-sm"
            >
              + Add Box
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={getQuote}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          Get instant quote
        </button>

        {quote && (
          <div className="rounded bg-green-50 p-3 text-sm text-green-800">
            {quote.estimated ? (
              <>Estimated price · {quote.miles} mi at $2.50/mi — <strong>${quote.price}</strong></>
            ) : (
              <>
                Placeholder estimate — <strong>${quote.price}</strong>
                <div className="mt-1 text-xs text-green-700">{quote.note}</div>
              </>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleBook}
          disabled={submitting || !originAddress || !destinationAddress}
          className="w-full rounded bg-gray-900 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Booking…" : "Book now"}
        </button>
      </div>
    </div>
  );
}
