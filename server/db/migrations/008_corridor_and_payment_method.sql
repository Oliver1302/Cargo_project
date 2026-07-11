-- Cross-border corridor tracking (Kenya-Uganda-Tanzania-Rwanda etc.)
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS border_crossing_point TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customs_status TEXT DEFAULT 'not_required'
  CHECK (customs_status IN ('not_required', 'pending', 'cleared'));

-- Track which method an invoice was paid through
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
