# Central Google Sign-In setup

## Recommended architecture for this repository

The three web surfaces already use Supabase Auth sessions, so the recommended setup is **Google Cloud OAuth → Supabase Auth → the three Vercel web apps**. This gives the customer app, Yousef/Ramy staff center, and desktop reporter one `auth.users.id` without adding a second identity provider.

Firebase is **not required** for the current implementation. Enabling Google Auth in Firebase while the applications continue using Supabase would create two separate auth systems. Use Firebase only if you deliberately migrate the auth backend later.

## 1. Google Cloud setup

Open the [Google Cloud Console](https://console.cloud.google.com/) and select or create the project that owns the salon identity.

Open **Google Auth Platform** and configure the application branding. Use the salon name and a recognizable logo. Configure the audience for the Google accounts that may access the app. For a private salon, keep the audience restricted while testing; publish or verify the app only when the intended user group is ready.

In **Data Access**, keep the scopes minimal:

```text
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

Create one OAuth client under **Google Auth Platform → Clients** with application type **Web application**. Add these authorized JavaScript origins:

```text
https://yousef-ramy-kqk1.vercel.app
https://yousef-ramy-og8d.vercel.app
http://localhost:5173
http://localhost:5174
```

Add the Supabase callback URL as an authorized redirect URI. Find the exact callback in Supabase Dashboard → Authentication → Providers → Google. It normally looks like:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Do not use the Vercel app URL as the Google redirect URI for this Supabase OAuth flow. Google redirects to Supabase; Supabase then redirects back to the app URL requested by the client.

## 2. Supabase setup

Open Supabase Dashboard → **Authentication → Providers → Google**, enable Google, and paste the Google OAuth client ID and client secret. Save the provider.

Open Supabase Dashboard → **Authentication → URL Configuration**. Set the production Site URL to the customer production origin and add these additional redirect URLs:

```text
https://yousef-ramy-kqk1.vercel.app/**
https://yousef-ramy-og8d.vercel.app/**
http://localhost:5173/**
http://localhost:5174/**
```

The code uses the Supabase client call below on each surface:

```ts
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin },
});
```

Because all three surfaces use the same Supabase project and Google provider, a user who signs in with Google on one surface can use the same Google account on the other surfaces. The browser still stores a session per origin; Google provides the shared identity and Supabase validates the session for each app.

## 3. Bind Yousef and Ramy as dual-role accounts

Apply the migration `supabase/migrations/20260825000000_staff_auth_and_schedules.sql` through the Supabase SQL editor or CLI:

```bash
supabase db push
```

Before Yousef and Ramy sign in for the first time, add their real Google account email addresses to the existing staff rows. Keep real email addresses out of GitHub:

```sql
update staff
set email = 'yousef-real-email@example.com'
where id = '00000000-0000-0000-0000-000000000002';

update staff
set email = 'ramy-real-email@example.com'
where id = '00000000-0000-0000-0000-000000000003';
```

Each barber then opens the customer app, chooses **دخول فريق الصالون**, and signs in with Google. The app matches the Google email to the staff row, stores the Supabase auth user ID on that staff row, and upserts the same Google user into `customers`. The barber can then switch between the staff control center and normal customer booking.

The two-reservation limit remains unchanged because the booking use case counts the linked `customers.id` record for the current day. Yousef and Ramy do not receive an elevated limit merely because they also have staff access.

## 4. Firebase decision

If you are keeping the current repository architecture, do not add Firebase Authentication or a second Firebase Google provider. You may create a Firebase project for unrelated future services, but it is not part of the active sign-in path.

If you specifically require Firebase Authentication in the future, enable **Firebase Console → Authentication → Sign-in method → Google**, add the Vercel domains under Authentication → Settings → Authorized domains, register a Firebase web app, and migrate the Supabase session integration deliberately. That migration would also require server-side verification of Firebase ID tokens, a mapping from Firebase `uid` to `customers` and `staff`, and a replacement for the current Supabase Auth callbacks. It should not be mixed into this release.

## References

[1]: https://firebase.google.com/docs/auth/web/google-signin "Firebase — Authenticate Using Google with JavaScript"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase — Login with Google"
[3]: https://developers.google.com/identity/protocols/oauth2/web-server "Google — Using OAuth 2.0 for Web Server Applications"
