import { Link } from "react-router-dom";

const PORTAL_URL = import.meta.env.VITE_PORTAL_BASE_URL || "http://localhost:5174";

const FEATURES = [
  { title: "Live GPS tracking", desc: "Know exactly where your cargo is, in real time — not a vague ETA." },
  { title: "WhatsApp + SMS updates", desc: "Pickup, in transit, delivered — sent automatically, no app required." },
  { title: "Transparent rate breakdown", desc: "See linehaul, fuel surcharge, and fees itemized — never a mystery invoice." },
  { title: "Every equipment type", desc: "Dry van, reefer, flatbed, containers, ISO tanks — book the right truck." },
  { title: "Cross-border ready", desc: "Track customs status at the border, not just at the warehouse." },
  { title: "Proof of delivery", desc: "Signed BOL photo captured at drop-off, attached to every shipment." }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="General Logistics" className="h-10 w-auto" />
            <span className="text-lg font-medium">Freightly</span>
          </div>
          <div className="flex gap-3">
            <a href={`${PORTAL_URL}/login`} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
              Sign in
            </a>
            <a href={`${PORTAL_URL}/register`} className="rounded bg-gray-900 px-4 py-2 text-sm text-white">
              Create account
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-8 py-20 text-center">
        <h1 className="mb-4 text-4xl font-medium">Freight that moves, and you can see it move.</h1>
        <p className="mb-8 text-lg text-gray-600">
          Book a truck, track it live, and get paid or pay — all from your phone. No calls to
          dispatch, no wondering where your cargo is.
        </p>
        <div className="flex justify-center gap-3">
          <a href={`${PORTAL_URL}/register`} className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white">
            Ship with us
          </a>
          <Link to="/drive" className="rounded-lg border px-6 py-3 text-sm font-medium hover:bg-gray-50">
            Apply to drive
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-8 pb-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border p-5">
              <div className="mb-1 font-medium">{f.title}</div>
              <div className="text-sm text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t bg-gray-50 px-8 py-16 text-center">
        <h2 className="mb-2 text-2xl font-medium">Own a truck? Drive for us.</h2>
        <p className="mb-6 text-gray-600">Steady loads, fair pay, and a straightforward app — no paperwork chase.</p>
        <Link to="/drive" className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white">
          Apply to drive
        </Link>
      </div>

      <div className="px-8 py-8 text-center text-xs text-gray-400">Freightly — freight logistics, done right.</div>
    </div>
  );
}
