ALTER TABLE customers
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE queue_tickets 
ADD COLUMN IF NOT EXISTS reservation_status TEXT DEFAULT 'active'
  CHECK (reservation_status IN ('active', 'declined', 'completed', 'no_show', 'expired'));
