# Logistics Platform — Project Instructions for Copilot

You are helping build a freight logistics platform with two separate applications sharing one
backend:

1. **Admin app** (`/admin`) — internal dashboard for dispatchers, accountants, and super admins.
2. **Client portal** (`/portal`) — B2B client-facing app for booking, tracking, and paying.

Follow the phased plan below in order. Don't jump ahead to a later phase until the current
phase's steps exist and work. Prefer the specific libraries named here over alternatives unless
there's a clear reason to deviate.

---

## Tech stack (fixed — don't substitute without asking)

| Layer | Choice |
|---|---|
| Database | PostgreSQL |
| Backend | Node.js (Express or Fastify) — or Python/FastAPI if preferred, stay consistent once chosen |
| Auth | JWT, separate token scopes for admin vs. client roles |
| Frontend framework | Vite + React |
| UI kit | Tailwind CSS + shadcn/ui |
| Client-side state | Zustand |
| Routing | React Router, with two auth guards (`admin`, `client`) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Drag-and-drop | `@hello-pangea/dnd` or `dnd-kit` |
| Maps | `@react-google-maps/api` or `react-map-gl` |
| Realtime | Socket.io |
| Charts | Recharts |
| Payments | Stripe Elements (or PayPal SDK) |
| PDFs | PDFKit (Node) / ReportLab (Python) |
| Toasts | `sonner` |

---

## Repo structure

```
/server
  /db            → migrations, schema, seed data
  /routes        → REST routes, grouped by resource (shipments, drivers, invoices, auth)
  /middleware     → auth, RBAC, error handling
  /services       → rate calc, geocoding, PDF generation, invoice triggers
/client
  /admin          → internal dashboard app (routes under /admin)
  /portal         → client-facing app (routes under /portal)
  /shared         → shared UI primitives, API client, types — used by both apps
```

Keep `/admin` and `/portal` as separate route trees with separate auth guards and separate
layouts. They may share `/shared` components (buttons, inputs, badges) but never share pages,
state stores, or auth tokens.

---

## Phase 1 — Foundations & architecture
*Data models and security only. No UI yet.*

**1. Database schema**
- Core tables: `users`, `drivers`, `vehicles`, `customers`, `shipments`, `stops`, `invoices`.
- `shipments.customer_id` → `customers`, `shipments.driver_id` → `drivers`.
- `stops` links to `shipments` for multi-stop routes (Origin → Stop A → Destination).

**2. Auth & RBAC**
- JWT-based auth, two token scopes: `admin` (roles: `super_admin`, `dispatcher`,
  `accountant`) and `client` (role: `client_user`, scoped to one `customer_id`).
- Backend middleware checks role per request — e.g. `/api/admin/invoices` requires
  `super_admin` or `accountant`; `/api/portal/*` requires a valid `client` token scoped to
  the requesting customer. Return `403 Forbidden` on mismatch.
- A client token must never grant access to `/api/admin/*` routes, even if the underlying
  user record has elevated privileges elsewhere.

---

## Phase 2 — Admin: core operational modules

**3. Order & shipment management**
- Multi-step booking form (admin side): Shipper info, Consignee info, Freight details
  (weight, dimensions, hazmat), pickup/delivery dates.
- Generate a unique Pro Number / BOL number per order.
- Auto-generate a downloadable BOL PDF.
- UI: dense TanStack Table (pagination, filter, sort by Status / Pickup Date). Status badges:
  Pending (amber) · In Transit (blue) · Delivered (green) · Canceled (red).

**4. Live dispatch board**
- `drivers.status`: `available`, `on_route`, `off_duty`.
- Two-column drag-and-drop UI: unassigned shipments (left) → driver profiles (right).
- On drop: optimistic UI update, then `PATCH /api/admin/shipments/:id` — set
  `shipment.status = assigned`, `driver.status = on_route`.

---

## Phase 3 — Client portal: onboarding & self-service

**5. Client auth & onboarding**
- Login/registration at `/portal/login`.
- Onboarding wizard: corporate info, tax ID/EIN, billing address, card or credit terms.
- Auth guard: authenticated clients land on `/portal/dashboard`; unauthenticated users never
  reach `/admin` routes and vice versa.

**6. Client dashboard**
- Metric cards: Active Shipments, Pending Quotes, Unpaid Invoices.
- Instant tracking search bar at the top — paste a Pro Number, get an immediate status readout.

**7. Client booking tool**
- Simplified form (lighter than the admin booking form).
- Google Places Autocomplete on address fields.
- Interactive handling-unit list (`+ Add Pallet`, `+ Add Box`) with weight/dimension inputs.
- Optional instant quote badge: `distance × rate-per-mile`, shown before "Book now."

**8. Client shipment ledger**
- Simplified table: Order #, Origin, Destination, Estimated Delivery, Status.
- Milestone tracker on detail view: Ordered → Picked Up → In Transit → Out for Delivery →
  Delivered.
- Public unauthenticated share link per shipment for the client's own customers.

---

## Phase 4 — Realtime, billing & analytics (both apps)

**9. Real-time tracking & mapping**
- Geocode shipment addresses to lat/lng.
- Admin: full map with all active shipments plotted, polyline origin → current → destination.
- Driver-facing mobile web view: "Mark as Delivered" uses `navigator.geolocation`, verifies
  proximity, pushes update via Socket.io.
- Portal: client sees only their own shipment(s) on the tracking view.

**10. Billing & invoicing**
- Trigger: on `shipment.status → delivered`, auto-create an `invoices` row.
- Rate formula: `base_rate + (distance × fuel_surcharge_rate) + accessorial_fees`.
- Admin: analytics dashboard — monthly revenue, active loads, profit margins (bar + pie
  charts).
- Portal: invoice grid with tabs (`All` / `Unpaid` / `Paid`), PDF download per row, Stripe
  Elements checkout modal — on success, badge flips to `Paid` instantly, no page leave.

**11. Support & documents (portal)**
- File vault: download system-generated docs (BOL), upload shipping instructions, commercial
  invoices, customs docs.
- "Report an issue" form auto-attaches the current Shipment ID, routes to the admin
  notification center.

---

## Phase 5 — QA, performance & launch

**12. QA & edge cases**
- Reject invalid input (text in numeric fields, delivery date before pickup date).
- Concurrency: two dispatchers assigning the same truck at once — use DB transactions/row
  locking so only the first request succeeds.
- Confirm a client token from customer A can never read customer B's shipments or invoices.

**13. Performance & error handling**
- Skeleton loaders on tables/charts during fetch (both apps).
- Toast notifications for success/failure actions.
- Verify `/admin` and `/portal` bundles are code-split — a client user should never download
  admin-only JS.

---

## Working conventions for Copilot
- When asked to implement a step, reference its phase/step number (e.g. "Phase 3, step 7").
- Keep API routes RESTful and namespaced by app: `/api/admin/...` vs. `/api/portal/...`.
- Never let admin and portal share an auth guard, layout, or page component — only
  primitives in `/shared`.
- Don't build Phase 3/4 features before Phase 1/2 primitives exist (schema, auth, core CRUD).
- Favor the libraries in the tech stack table above over introducing new ones.
