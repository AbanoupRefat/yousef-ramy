-- Cleanup Script
-- Run this in your Supabase dashboard's SQL Editor to clear out the dummy seed data 
-- before deploying to production.

-- Note: If there are transactions/tickets tied to these IDs, you will need to delete those first.
-- The easiest way to wipe all test activity is to TRUNCATE transactions, queue_tickets, expenses.

-- Delete Products
DELETE FROM products WHERE id IN ('00000000-0000-0000-0000-000000000006');

-- Delete Services
DELETE FROM services WHERE id IN ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005');

-- Delete Staff
DELETE FROM staff WHERE id IN ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');

-- Delete Bonus Types
DELETE FROM bonus_types WHERE id IN ('00000000-0000-0000-0000-000000000001');
