-- Equipment types
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS equipment_type TEXT DEFAULT 'V';
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS requested_equipment_type TEXT DEFAULT 'V';

-- Full rate engine (Linehaul + FSC + Accessorials - Driver Pay - Factoring = Net Rate)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS linehaul_rate NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fsc_rate NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS detention_hours NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS detention_rate NUMERIC DEFAULT 60;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lumper_fee NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tarping_fee NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS driver_pay NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS factoring_fee NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_rate NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS miles NUMERIC DEFAULT 0;

-- Proof of delivery
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pod_photo_base64 TEXT;

-- Deadhead / ELD-proxy fields on drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_lat NUMERIC;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_lng NUMERIC;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hours_remaining NUMERIC DEFAULT 11;

-- Simulated EDI message log (204 Load Tender / 990 Accept-Decline / 214 Status Update)
CREATE TABLE IF NOT EXISTS edi_log (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  message_type TEXT NOT NULL, -- '204', '990', '214'
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
