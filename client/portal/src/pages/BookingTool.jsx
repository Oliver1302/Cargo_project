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
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="portal-card overflow-hidden bg-gradient-to-r from-blue-600 to-sky-600 p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">New booking</p>
        <h1 className="mt-2 text-2xl font-semibold">Plan the next shipment in minutes.</h1>
        <p className="mt-2 text-sm text-blue-100">Add pickup and delivery details, then get an instant quote before confirming the load.</p>
      </section>

      <div className="portal-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pickup address</label>
            <input
              className="portal-input"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="Street, City, State"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Delivery address</label>
            <input
              className="portal-input"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="Street, City, State"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Pickup date</label>
          <input
            type="date"
            className="portal-input"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Handling units</label>
            <span className="text-sm text-slate-500">{totalWeight || 0} lbs</span>
          </div>
          <div className="space-y-2">
            {units.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <span className="flex-1 capitalize text-slate-700">{u.type}</span>
                <input
                  type="number"
                  placeholder="lbs"
                  className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  value={u.weight}
                  onChange={(e) => updateUnitWeight(u.id, e.target.value)}
                />
                <button type="button" onClick={() => removeUnit(u.id)} className="text-xs font-medium text-slate-400 hover:text-red-500">
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => addUnit("pallet")} className="portal-button-secondary flex-1">
              + Add Pallet
            </button>
            <button type="button" onClick={() => addUnit("box")} className="portal-button-secondary flex-1">
              + Add Box
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button type="button" onClick={getQuote} className="portal-button-secondary flex-1">
            Get instant quote
          </button>
          <button
            type="button"
            onClick={handleBook}
            disabled={submitting || !originAddress || !destinationAddress}
            className="portal-button flex-1 disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Book now"}
          </button>
        </div>

        {quote && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {quote.estimated ? (
              <>
                Estimated price · {quote.miles} mi at $2.50/mi — <strong>${quote.price}</strong>
              </>
            ) : (
              <>
                Placeholder estimate — <strong>${quote.price}</strong>
                <div className="mt-1 text-xs text-emerald-700">{quote.note}</div>
              </>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
