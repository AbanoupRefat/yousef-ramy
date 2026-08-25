-- Staff authentication and schedule support.
-- Auth users are created by Supabase Auth; this table only stores the safe binding.
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_off BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (staff_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS staff_schedules_staff_day_idx ON staff_schedules(staff_id, day_of_week);
