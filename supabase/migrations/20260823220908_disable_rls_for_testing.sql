-- Disable RLS for testing
-- This ensures the anon key can read/write without needing explicit policies during Phase 1-4.
-- In production (Phase 5/Customer Web), RLS should be re-enabled with proper policies.

ALTER TABLE bonus_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_service_durations DISABLE ROW LEVEL SECURITY;
