import { useEffect, useState } from "react";
import { apiFetch } from "@shared/api/client.js";

const TYPE_LABELS = {
  "204": { label: "204 · Load Tender", color: "bg-blue-100 text-blue-800" },
  "990": { label: "990 · Accept/Decline", color: "bg-green-100 text-green-800" },
  "214": { label: "214 · Status Update", color: "bg-gray-100 text-gray-700" }
};

export default function EdiConsole() {
  const [log, setLog] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/edi-log").then(setLog).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <h1 className="text-xl font-semibold text-slate-900">EDI console</h1>
        <p className="mt-1 text-sm text-slate-500">
        Simulated EDI 204 / 990 / 214 message feed — mirrors the format a real trading
        partner (via an EDI VAN like SPS Commerce) would send. Not yet connected to a live
        network; every event below is generated internally from real shipment activity.
        </p>
      </section>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="admin-card space-y-2 p-6">
        {log.map((entry) => {
          const meta = TYPE_LABELS[entry.message_type] || { label: entry.message_type, color: "bg-gray-100 text-gray-700" };
          return (
            <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs ${meta.color}`}>{meta.label}</span>
              <span className="text-gray-500">{entry.pro_number || "—"}</span>
              <span className="flex-1">{entry.summary}</span>
              <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
          );
        })}
        {log.length === 0 && !error && <p className="text-sm text-slate-500">No EDI activity yet.</p>}
      </div>
    </div>
  );
}
