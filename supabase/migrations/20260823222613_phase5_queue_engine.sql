-- Phase 5 Queue Engine & Customer Web additions

-- 1. Add fields to queue_tickets
ALTER TABLE queue_tickets ADD COLUMN position INT;
ALTER TABLE queue_tickets ADD COLUMN phone_number TEXT;

-- 2. Shop settings
CREATE TABLE shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_accepting_remote BOOLEAN NOT NULL DEFAULT true
);

-- Disable RLS on the new table to match Phase 1-4
ALTER TABLE shop_settings DISABLE ROW LEVEL SECURITY;

-- Insert a single settings row
INSERT INTO shop_settings (id, queue_accepting_remote) VALUES ('00000000-0000-0000-0000-000000000001', true);

-- 3. Enable Realtime for queue updates
-- This allows customer-web to subscribe directly to row changes
ALTER PUBLICATION supabase_realtime ADD TABLE queue_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_settings;
