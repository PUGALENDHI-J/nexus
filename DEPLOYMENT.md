# Saran Tours & Travels — Supabase + Vercel Deployment Guide

## Folder Structure

```
SARAN-TOURS/
├── admin/
│   ├── index.html         ← Admin login (Supabase auth)
│   ├── dashboard.html     ← Full admin dashboard
│   ├── script.js          ← Admin logic (Supabase-connected)
│   └── style.css          ← Admin styles
├── images/                ← Static assets
├── index.html             ← Homepage
├── booking.html
├── contact.html
├── services.html
├── about.html
├── tariff.html
├── script.js              ← Frontend logic (Supabase-connected)
├── supabase.js            ← Supabase client + all DB utilities
├── supabase-schema.sql    ← Run once in Supabase SQL Editor
├── style.css
├── tariff.css
├── tariff.js
└── vercel.json            ← Optional: routing config
```

---

## Step 1 — Create Supabase Project

1. Go to https://supabase.com → Sign up / Log in
2. Click **New Project**
3. Choose a name, database password, and region (e.g. Singapore for India)
4. Wait ~2 minutes for the project to spin up

---

## Step 2 — Run the SQL Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **Run** (or Ctrl+Enter)

This creates all 7 tables with default seed data and RLS policies.

---

## Step 3 — Get Your API Credentials

1. In Supabase → **Settings** → **API**
2. Copy:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public** key — long JWT string starting with `eyJ...`

---

## Step 4 — Paste Credentials into supabase.js

Open `supabase.js` and replace lines 22–23:

```js
const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

> **Important:** The anon key is safe to be public — it is read-only unless
> Row Level Security policies allow writes (and yours only allow inserts for
> booking/contact forms). Never paste your `service_role` key in frontend code.

---

## Step 5 — Create Admin User

1. In Supabase → **Authentication** → **Users** → **Add User**
2. Enter your email and a strong password
3. This is your admin login for `admin/index.html`

---

## Step 6 — Enable Realtime (for live sync)

1. Supabase → **Database** → **Replication**
2. Toggle **ON** for these tables:
   - `cab_services`
   - `bookings`
   - `contact_messages`

This makes admin changes appear instantly on all open browser tabs.

---

## Step 7 — Deploy to Vercel

### Option A: Drag-and-Drop (Simplest)

1. Go to https://vercel.com → New Project
2. Import your GitHub repo (push the folder first), OR
3. Use Vercel CLI: `npm i -g vercel && vercel` in the project folder

### Option B: Environment Variables (Recommended for production)

Instead of hardcoding credentials in `supabase.js`, create a small
`/api/config.js` Vercel serverless function that injects them:

```js
// api/config.js
export default function handler(req, res) {
  res.json({
    SUPABASE_URL:      process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  });
}
```

Add to Vercel Dashboard → Project Settings → Environment Variables:
```
SUPABASE_URL       = https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY  = eyJ...
```

Then update `supabase.js` top to fetch them:
```js
// Fetch env vars from server at startup
const _envResp = await fetch('/api/config').catch(() => ({}));
const _env     = _envResp.ok ? await _envResp.json() : {};
const SUPABASE_URL      = _env.SUPABASE_URL      || 'YOUR_FALLBACK';
const SUPABASE_ANON_KEY = _env.SUPABASE_ANON_KEY || 'YOUR_FALLBACK';
```

---

## Step 8 — Vercel Config (optional)

Create `vercel.json` in the root:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" }
      ]
    }
  ]
}
```

---

## Row Level Security Summary

| Table            | Public SELECT | Public INSERT | Auth (admin) |
|------------------|:---:|:---:|:---:|
| cab_services     | ✅  | ❌  | ✅ |
| bookings         | ❌  | ✅  | ✅ |
| contact_messages | ❌  | ✅  | ✅ |
| tour_packages    | ✅  | ❌  | ✅ |
| testimonials     | ✅* | ❌  | ✅ |
| gallery          | ✅* | ❌  | ✅ |
| website_content  | ✅  | ❌  | ✅ |

*Only `is_active = true` rows are returned to the public.

---

## How Admin Updates Reach All Devices

1. Admin edits a cab → `updateCab()` → Supabase updates the row
2. Supabase Realtime broadcasts the change to all subscribers
3. `subscribeToCabs()` in `script.js` fires on every open browser tab
4. `renderCabOptions()` is called with the fresh data
5. All visitors see the updated cabs within ~1 second — no page refresh needed

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "SDK not loaded" error | Ensure Supabase CDN `<script>` is before `supabase.js` |
| Data not loading | Check URL/key in `supabase.js`; open browser console |
| Admin login fails | Create a user in Supabase Auth dashboard |
| Changes not syncing | Enable Realtime for the table in Supabase Dashboard |
| RLS blocking writes | Check policies match the pattern in `supabase-schema.sql` |
