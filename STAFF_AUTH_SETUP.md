# Authentication setup

This repository now uses one central Google identity across the customer booking app, the Yousef/Ramy staff control center, and the desktop reporter.

Follow `GOOGLE_AUTH_SETUP.md` for the complete Google Cloud, Supabase, and optional Firebase instructions. The required database migration is `supabase/migrations/20260825000000_staff_auth_and_schedules.sql`.

The setup has three required steps:

1. Configure one Google Cloud Web OAuth client and add the two Vercel origins plus local development origins.
2. Enable the Google provider in Supabase Auth and add the Supabase callback URI to Google Cloud.
3. Add Yousef’s and Ramy’s real Google email addresses to their existing `staff` rows before they sign in for the first time.

Yousef and Ramy are dual-role users. Their Google account is linked both to `staff` and `customers`, so they can open the staff control center and switch into the ordinary booking flow. The existing use case still limits every customer record to two reservations per day.

Before production use, replace the repository’s testing RLS-disabled migration with authenticated policies. Staff should be restricted to their own staff row, queue, and schedule; reporter access should be restricted to an owner/operator role.
