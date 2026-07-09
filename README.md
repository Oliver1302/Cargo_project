# Logistics platform — monorepo

Two frontend apps sharing one backend:

```
/server         → Express API (auth, shipments, drivers, invoices)
/client/admin    → internal dashboard (dispatch, billing, analytics)
/client/portal   → client-facing B2B app (booking, tracking, payments)
/client/shared   → components shared by both frontend apps
```

## First-time setup

1. Copy environment files and fill in real values:
   ```
   cp server/.env.example server/.env
   ```
2. Create a local Postgres database, then run the schema:
   ```
   psql -U postgres -d logistics -f server/db/schema.sql
   ```
3. Install and run each piece (three terminals, or use a process manager):
   ```
   cd server && npm install && npm run dev
   cd client/admin && npm install && npm run dev
   cd client/portal && npm install && npm run dev
   ```

Admin runs on http://localhost:5173, portal on http://localhost:5174, API on
http://localhost:4000.

See `.github/copilot-instructions.md` for the full build plan — this scaffold covers Phase 1
only (schema + auth stub + empty app shells). Everything else is built step by step with
Copilot Chat referencing that file.
