ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_tracking_token TEXT UNIQUE;
