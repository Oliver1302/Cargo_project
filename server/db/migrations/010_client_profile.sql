CREATE TABLE IF NOT EXISTS client_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores only a display label/masked reference — never real card numbers or CVCs.
-- This is a placeholder UI until a real payment gateway (Stripe/M-Pesa) is wired in;
-- at that point the "token" field would hold the gateway's saved-payment-method ID.
CREATE TABLE IF NOT EXISTS client_payment_methods (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('card', 'mpesa')),
  display_label TEXT NOT NULL, -- e.g. "Visa ending 4242" or "M-Pesa +2547XXXXXXXX"
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
