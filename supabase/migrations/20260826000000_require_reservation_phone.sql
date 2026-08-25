-- Preserve historical queue tickets, but reject NULL or blank phone numbers
-- for every new insert and every update after this migration.
-- NOT VALID is intentional: it leaves legacy rows untouched while PostgreSQL
-- still enforces the CHECK for future writes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'queue_tickets_phone_required'
      AND conrelid = 'public.queue_tickets'::regclass
  ) THEN
    ALTER TABLE public.queue_tickets
      ADD CONSTRAINT queue_tickets_phone_required
      CHECK (phone_number IS NOT NULL AND btrim(phone_number) <> '')
      NOT VALID;
  END IF;
END $$;
