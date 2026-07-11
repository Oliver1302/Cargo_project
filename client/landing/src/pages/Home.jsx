import { Link } from "react-router-dom";
import { DryVanIcon, ReeferIcon, FlatbedIcon, ContainerIcon, TankerIcon } from "../components/EquipmentIcons.jsx";

const PORTAL_URL = import.meta.env.VITE_PORTAL_BASE_URL || "http://localhost:5174";

const NAV = [
  { href: "#fleet", label: "Equipment" },
  { href: "#tracking", label: "Live tracking" },
  { href: "#why", label: "Why us" },
  { href: "#drive", label: "Drive with us" }
];

const MANIFEST = [
  { pro: "GL-40213", route: "NAIROBI → MOMBASA", type: "REEFER", status: "IN TRANSIT", color: "text-transit" },
  { pro: "GL-40198", route: "KISUMU → NAIROBI", type: "DRY VAN", status: "DELIVERED", color: "text-delivered" },
  { pro: "GL-40225", route: "NAIROBI → ELDORET", type: "FLATBED", status: "PENDING", color: "text-pending" },
  { pro: "GL-40201", route: "MOMBASA → NAIROBI", type: "CONTAINER 40FT", status: "IN TRANSIT", color: "text-transit" },
  { pro: "GL-40190", route: "NAKURU → KISUMU", type: "ISO TANK", status: "DELIVERED", color: "text-delivered" },
  { pro: "GL-40230", route: "NAIROBI → NAMANGA", type: "DRY VAN", status: "IN TRANSIT", color: "text-transit" }
];

const EQUIPMENT = [
  {
    Icon: DryVanIcon,
    name: "53ft Dry Van",
    spec: "26,000 KG · 53 FT · 3,800 CUFT",
    desc: "The standard for domestic freight — general cargo, palletized goods, retail restock."
  },
  {
    Icon: ReeferIcon,
    name: "53ft Reefer",
    spec: "-20°C TO 25°C · 24,000 KG",
    desc: "Temperature-controlled hauling for food, pharma, and anything that can't wait."
  },
  {
    Icon: FlatbedIcon,
    name: "Flatbed",
    spec: "48 FT · 22,000 KG · OPEN DECK",
    desc: "Construction materials, pipe, steel — open-deck freight that needs the right rig."
  },
  {
    Icon: ContainerIcon,
    name: "20ft / 40ft Container",
    spec: "ISO INTERMODAL · 28,000 KG",
    desc: "Ocean and intermodal containers, mounted and moving within hours of offload."
  },
  {
    Icon: TankerIcon,
    name: "ISO Tank",
    spec: "24,000 L · BULK LIQUID",
    desc: "Chemicals, fuel, and bulk liquid cargo hauled to spec with certified tanks."
  }
];

const REASONS = [
  {
    num: "01",
    title: "See it move, not just where it started",
    desc: "Live GPS on every load, pushed straight from the driver's phone — not a dispatcher's guess."
  },
  {
    num: "02",
    title: "No surprise invoices",
    desc: "Linehaul, fuel surcharge, and every accessorial itemized before you pay a cent."
  },
  {
    num: "03",
    title: "Updates without an app",
    desc: "WhatsApp and SMS at pickup, in transit, and delivery — works on any phone, no download."
  },
  {
    num: "04",
    title: "Proof, every time",
    desc: "Signed BOL photo captured at drop-off and attached to your shipment automatically."
  }
];

export default function Home() {
  const doubled = [...MANIFEST, ...MANIFEST];

  return (
    <div className="min-h-screen bg-ink font-body text-paper">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/10 bg-haze/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="General Logistics" className="h-11 w-auto" />
            <span className="font-display text-xl tracking-wide text-ink">GENERAL LOGISTICS</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-sm font-medium text-graphite transition hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-3">
            <a
              href={`${PORTAL_URL}/login`}
              className="hidden items-center rounded-full border border-black/15 px-5 py-2 text-sm font-semibold text-ink transition hover:border-signal hover:text-signal sm:inline-flex"
            >
              Sign in
            </a>
            <a
              href={`${PORTAL_URL}/register`}
              className="clip-tag-sm inline-flex items-center bg-signal px-5 py-2 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-signalbright"
            >
              Ship with us
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <img src="/hero-truck.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/70" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.35em] text-signal">
            PRO# GL-40001 &nbsp;·&nbsp; Freight visibility, built in
          </p>
          <h1 className="max-w-3xl font-display text-6xl uppercase leading-[0.95] tracking-tight sm:text-8xl">
            Ship it. Track it.
            <br />
            <span className="text-signal">Know it arrived.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Book a truck, watch it move in real time, and settle the invoice — all from your
            phone. No calls to dispatch, no wondering where your freight is.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href={`${PORTAL_URL}/register`}
              className="clip-tag inline-flex items-center bg-signal px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-signalbright"
            >
              Ship with us
            </a>
            <Link
              to="/drive"
              className="inline-flex items-center rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-paper transition hover:border-signal hover:text-signal"
            >
              Apply to drive
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            {[
              { value: "Live", label: "GPS on every load" },
              { value: "24/7", label: "WhatsApp + SMS" },
              { value: "5", label: "Equipment types" },
              { value: "0", label: "Calls to dispatch" }
            ].map((s) => (
              <div key={s.label}>
                <div className="font-mono text-3xl font-semibold text-paper">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live manifest ticker — signature element */}
      <section className="overflow-hidden border-b border-white/10 bg-panel py-4">
        <div className="flex whitespace-nowrap">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {doubled.map((m, i) => (
              <div key={i} className="flex items-center gap-3 font-mono text-xs">
                <span className="text-signal">{m.pro}</span>
                <span className="text-muted">{m.route}</span>
                <span className="text-muted/70">{m.type}</span>
                <span className={`font-semibold ${m.color}`}>● {m.status}</span>
                <span className="text-white/10">|</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section id="fleet" className="border-b border-white/10 bg-ink py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.35em] text-signal">What we move</p>
          <h2 className="mb-12 max-w-xl font-display text-4xl uppercase tracking-tight sm:text-5xl">
            The right rig for the load.
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EQUIPMENT.map((eq) => (
              <div
                key={eq.name}
                className="group rounded-sm border border-white/10 bg-panel p-6 transition hover:border-signal/50"
              >
                <eq.Icon className="mb-5 h-10 w-16 text-muted transition group-hover:text-signal" />
                <h3 className="font-display text-2xl uppercase tracking-tight text-paper">{eq.name}</h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-signal">{eq.spec}</p>
                <p className="mt-3 text-sm text-muted">{eq.desc}</p>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-sm border border-dashed border-white/15 p-6">
              <p className="font-display text-2xl uppercase tracking-tight text-paper">Not sure what fits?</p>
              <p className="mt-2 text-sm text-muted">Tell us the cargo and route — we'll match the equipment and quote it in minutes.</p>
              <a href={`${PORTAL_URL}/register`} className="mt-4 text-sm font-semibold text-signal hover:underline">
                Get a quote →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why ship with us */}
      <section id="why" className="border-b border-white/10 bg-gradient-to-b from-ink to-panel2 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.35em] text-signal">Why ship with us</p>
          <h2 className="mb-14 max-w-2xl font-display text-4xl uppercase tracking-tight sm:text-5xl">
            Freight software built for people who hate not knowing.
          </h2>
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div key={r.num} className="flex gap-5">
                <span className="font-mono text-sm font-semibold text-signal">{r.num}</span>
                <div className="border-l border-white/10 pl-5">
                  <h3 className="font-display text-xl uppercase tracking-tight text-paper">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live tracking image */}
      <section id="tracking" className="relative h-[26rem] overflow-hidden border-b border-white/10 sm:h-[30rem]">
        <img src="/fleet-convoy.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="absolute bottom-10 left-6 right-6 sm:left-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1 font-mono text-xs text-delivered">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-delivered opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-delivered" />
            </span>
            LIVE &nbsp;·&nbsp; 214 loads on the road right now
          </div>
          <h2 className="max-w-xl font-display text-3xl uppercase leading-tight tracking-tight text-paper sm:text-4xl">
            Every load tracked from dock to door.
          </h2>
        </div>
      </section>

      {/* Driver CTA */}
      <section id="drive" className="relative overflow-hidden border-b border-white/10 bg-signal py-16 text-center">
        <div className="pointer-events-none absolute -left-10 top-0 h-full w-32 -skew-x-12 bg-ink/10" />
        <div className="pointer-events-none absolute -right-10 top-0 h-full w-32 -skew-x-12 bg-ink/10" />
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.35em] text-ink/70">Own a truck?</p>
        <h2 className="font-display text-4xl uppercase tracking-tight text-ink sm:text-5xl">Drive for us.</h2>
        <p className="mx-auto mt-3 max-w-md font-medium text-ink/80">
          Steady loads, fair pay, and a straightforward app — no paperwork chase.
        </p>
        <Link
          to="/drive"
          className="clip-tag-sm mt-7 inline-flex items-center bg-ink px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-paper transition hover:bg-panel"
        >
          Apply to drive
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-ink py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="General Logistics" className="h-8 w-auto" />
              <span className="font-display text-lg tracking-wide text-paper">GENERAL LOGISTICS</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Freight logistics, done right — live tracking, transparent pricing, real accountability.
            </p>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-signal">Equipment</p>
            <ul className="space-y-2 text-sm text-muted">
              <li>Dry Van</li>
              <li>Reefer</li>
              <li>Flatbed</li>
              <li>Containers</li>
              <li>ISO Tank</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-signal">Get started</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href={`${PORTAL_URL}/register`} className="hover:text-signal">Create a shipper account</a></li>
              <li><Link to="/drive" className="hover:text-signal">Apply to drive</Link></li>
              <li><a href={`${PORTAL_URL}/login`} className="hover:text-signal">Sign in</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 px-6 pt-6 text-xs text-muted/60">
          © {new Date().getFullYear()} General Logistics.
        </div>
      </footer>
    </div>
  );
}
