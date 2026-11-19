# ASLP CD Strategy – Summary Dashboard

Live dashboard of Community Development (CD) Strategy progress for The Salvation Army territories in the
Asia-Pacific Sharing & Learning Programme (ASLP): SPEA 1, SPEA 2, SASIA 1 and SASIA 2.

## What's here
- `index.html` – the whole website (Dashboard and Database tabs, update form, PDF/Excel downloads)
- `vendor/` – bundled libraries (Supabase client, jsPDF, ExcelJS)
- `aslp-logo-*.png`, `favicon.png` – branding
- `.github/workflows/keep-supabase-awake.yml` – pings the database every 3 days so the free Supabase project doesn't pause

## How it works
- **Hosting:** GitHub Pages (this repository, `main` branch, root folder).
- **Data:** Supabase project "ASLP CDS Dashboard". The website only calls database functions; tables are not directly readable or writable.
- **Update button:** people enter their registered email and the site shows the territory (or territories) they may update.
  - **Focal person** (focal email saved in the territory's details): status and CD Strategy details.
  - **Backup person** (one per territory, saved in the details): status only.
  - **CWG leads and programme coordinators:** status and details for their territories.
- **Admin access:** coordinators and CWG leads sign in with an emailed link to manage approved emails, see contact details, and edit/delete history entries.

The Supabase key in `index.html` is the *publishable* key, which is meant to be public.

Maintained with Claude.
