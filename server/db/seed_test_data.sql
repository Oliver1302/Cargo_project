-- Run this in Supabase's SQL Editor AFTER all migrations (001-010) have been applied.
-- Intended to run ONCE — re-running will add duplicate customers/drivers/shipments since
-- there are no unique constraints on those demo fields.
-- Defensive: re-adds any columns this script depends on, in case a migration was missed.
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS equipment_type TEXT DEFAULT 'V';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hours_remaining NUMERIC DEFAULT 11;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS requested_equipment_type TEXT DEFAULT 'V';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS linehaul_rate NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fsc_rate NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS driver_pay NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS factoring_fee NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_rate NUMERIC DEFAULT 0;
CREATE TABLE IF NOT EXISTS client_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS client_payment_methods (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'mpesa')),
  display_label TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- More customers, so Sales analytics has variety
INSERT INTO customers (company_name, tax_id, billing_address) VALUES
  ('Delta Manufacturing', '55-1122334', '900 Port Ave, Oakland, CA'),
  ('Coastal Freight Co', '77-5566778', '400 Harbor Blvd, Long Beach, CA'),
  ('Acme Foods', '22-9988776', '12 Farm Rd, Fresno, CA')
ON CONFLICT DO NOTHING;

-- More drivers + vehicles
INSERT INTO vehicles (plate, type, equipment_type) VALUES
  ('TX-2210-KA', 'Reefer', 'R'),
  ('TX-5581-MB', 'Flatbed', 'F')
ON CONFLICT DO NOTHING;

INSERT INTO drivers (name, status, phone, vehicle_id, hours_remaining) VALUES
  ('Aisha Njoroge', 'available', '+254712345678', (SELECT id FROM vehicles WHERE plate = 'TX-2210-KA'), 9),
  ('David Kimani', 'available', '+254798765432', (SELECT id FROM vehicles WHERE plate = 'TX-5581-MB'), 6)
ON CONFLICT DO NOTHING;

-- A batch of historical shipments across the last 60 days, varied status/customer/amount,
-- so the Sales dashboard's charts and KPIs have something real to show.
DO $$
DECLARE
  cust_ids INT[];
  drv_ids INT[];
  i INT;
  rand_days INT;
  rand_status TEXT;
  rand_customer INT;
  rand_driver INT;
  new_shipment_id INT;
  rand_amount NUMERIC;
BEGIN
  SELECT array_agg(id) INTO cust_ids FROM customers;
  SELECT array_agg(id) INTO drv_ids FROM drivers;

  FOR i IN 1..40 LOOP
    rand_days := floor(random() * 60);
    rand_status := (ARRAY['delivered','delivered','delivered','in_transit','pending','assigned'])[floor(random()*6)+1];
    rand_customer := cust_ids[floor(random()*array_length(cust_ids,1))+1];
    rand_driver := drv_ids[floor(random()*array_length(drv_ids,1))+1];

    INSERT INTO shipments (
      pro_number, customer_id, driver_id, status, origin_address, destination_address,
      weight_lbs, pickup_date, created_at, requested_equipment_type
    ) VALUES (
      'PRO-' || floor(random()*89999+10000)::text,
      rand_customer,
      CASE WHEN rand_status = 'pending' THEN NULL ELSE rand_driver END,
      rand_status,
      (ARRAY['1420 Distribution Way, Fresno, CA','50 Industrial Blvd, Sacramento, CA','900 Port Ave, Oakland, CA'])[floor(random()*3)+1],
      (ARRAY['800 Market St, Denver, CO','200 Retail Row, Phoenix, AZ','300 Commerce Dr, Las Vegas, NV'])[floor(random()*3)+1],
      floor(random()*3000+500),
      (now() - (rand_days || ' days')::interval)::date,
      now() - (rand_days || ' days')::interval,
      (ARRAY['V','40V','R','F'])[floor(random()*4)+1]
    ) RETURNING id INTO new_shipment_id;

    -- Generate an invoice for delivered shipments, using the same rate engine shape as the app
    IF rand_status = 'delivered' THEN
      rand_amount := floor(random()*400+300);
      INSERT INTO invoices (
        shipment_id, customer_id, amount, status, linehaul_rate, fsc_rate,
        driver_pay, factoring_fee, net_rate, created_at
      ) VALUES (
        new_shipment_id, rand_customer, rand_amount,
        (ARRAY['paid','paid','unpaid'])[floor(random()*3)+1],
        rand_amount * 0.7, rand_amount * 0.15,
        rand_amount * 0.35, rand_amount * 0.03, rand_amount * 0.47,
        now() - (rand_days || ' days')::interval
      );
    END IF;
  END LOOP;
END $$;

-- Sample saved addresses + payment methods for the first client user, so the Profile
-- page has something to show immediately.
INSERT INTO client_addresses (customer_id, label, address, is_default)
SELECT id, 'Main warehouse', '1420 Distribution Way, Fresno, CA', true FROM customers LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO client_addresses (customer_id, label, address, is_default)
SELECT id, 'Secondary dock', '50 Industrial Blvd, Sacramento, CA', false FROM customers LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO client_payment_methods (customer_id, method_type, display_label, is_default)
SELECT id, 'card', 'Visa ending 4242', true FROM customers LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO client_payment_methods (customer_id, method_type, display_label, is_default)
SELECT id, 'mpesa', 'M-Pesa +254712345678', false FROM customers LIMIT 1
ON CONFLICT DO NOTHING;
