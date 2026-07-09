-- Run this once in Supabase's SQL editor to link your test driver to a truck,
-- so the portal tracking page has something real to show.

INSERT INTO vehicles (plate, type) VALUES ('TX-8842-LG', 'Dry Van') RETURNING id;

-- Copy the id returned above into this UPDATE (replace the 1 if different),
-- and set it on your existing test driver (Marcus Ortiz):
UPDATE drivers SET vehicle_id = 1 WHERE name = 'Marcus Ortiz';

-- Optional: give your in-transit demo shipment (PRO-10431) a live position so the
-- speed/remaining-distance stats have something to show. Adjust the shipment id if needed.
UPDATE shipments
SET current_lat = 38.5816, current_lng = -121.4944, current_speed_mph = 62, last_location_update = now()
WHERE pro_number = 'PRO-10431';
