-- Reservation phone numbers are required for every queue ticket.
-- This intentionally fails with a clear message if old records need cleanup.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.queue_tickets
    WHERE phone_number IS NULL OR btrim(phone_number) = ''
  ) THEN
    RAISE EXCEPTION 'Cannot require reservation phone numbers: clean existing NULL or blank queue_tickets.phone_number values first.';
  END IF;
END $$;

ALTER TABLE public.queue_tickets
  ALTER COLUMN phone_number SET NOT NULL;

ALTER TABLE public.queue_tickets
  ADD CONSTRAINT queue_tickets_phone_not_blank
  CHECK (btrim(phone_number) <> '');
