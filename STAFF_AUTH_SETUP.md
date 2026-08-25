# Authentication and staff-control setup

The new feature set uses Supabase Auth for two protected surfaces: the desktop reporter and the Yousef/Ramy mobile control center.

## Apply the migration

Run the migration in the Supabase SQL editor or through the Supabase CLI:

```bash
supabase db push
```

The migration is `supabase/migrations/20260825000000_staff_auth_and_schedules.sql`. It adds `staff.email`, `staff.auth_user_id`, and the `staff_schedules` table.

## Bind Yousef and Ramy accounts

Before either barber signs up, update the two staff rows with their real email addresses in Supabase. Do not commit real emails to the repository.

```sql
update staff
set email = 'yousef-real-email@example.com'
where id = '00000000-0000-0000-0000-000000000002';

update staff
set email = 'ramy-real-email@example.com'
where id = '00000000-0000-0000-0000-000000000003';
```

Each barber then opens the customer app, chooses `دخول فريق الصالون`, creates an account with the matching email, and signs in. The first successful staff sign-in binds the Supabase Auth user ID to that staff row. The control center then shows that barber's queue, allows calls, safe deletion, one-step reorder controls, and weekly schedule editing.

## Desktop reporter

The desktop reporter now opens on a sign-in screen. The `إنشاء حساب` action creates a Supabase Auth account. If email confirmation is enabled in Supabase, the user must confirm the email before returning to sign in.

## Important access note

The current repository contains a testing migration that disables RLS on the application tables. Before production use, replace that testing setup with authenticated RLS policies. At minimum, staff should only read and update their own staff row, read their own queue, and write only the schedule rows associated with their staff ID. The desktop reporter should be restricted to an owner/operator role rather than relying on authentication alone.
