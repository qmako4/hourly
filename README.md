# hourly.

A radically minimal todo app. Two views: **Today** and **Tomorrow**. Local‑only — no backend, no accounts, no database. Everything stays on your device.

Built as an installable PWA so it lives on your home screen.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

> The PWA service worker is disabled in dev. Run `npm run build && npm start` to test the installable experience locally.

## Deploy to Vercel

One line: `vercel` (after `npm i -g vercel`). Or push to GitHub and **Import Project** in the Vercel dashboard — no environment variables, no config required.

## Install on your phone

- **iPhone**: open the deployed URL in **Safari** → tap **Share** → **Add to Home Screen**.
- **Android**: open in **Chrome** → tap the **⋮ menu** → **Install app** (or **Add to Home screen**).

Once installed, hourly. launches full‑screen with no browser chrome.

## Hourly nudges — honest limits

When you tap **Hourly nudges** and grant permission, the app schedules a browser notification every hour on the hour listing your top 3 Today tasks (quiet hours 9pm–8am).

Real talk on what browsers allow:

- Notifications **only fire while the app is open** — in a tab, or running as the installed PWA. There is no server, so when the app is fully closed nothing schedules.
- **iOS** restricts PWA notifications heavily; installing to the home screen helps but isn't a guarantee.
- **Android** Chrome is more permissive; installing the PWA gives the most reliable nudges.

A native iOS/Android version with true background push is on the roadmap.

## Data

Tasks live in `localStorage` under the key `hourly:tasks:v1`. Clearing your browser data deletes them. There is no cloud sync.

The app self‑cleans on every load:

- Completed tasks older than 7 days are removed from the bin.
- Incomplete tasks whose target day has passed quietly fade away.
- Tasks marked **tomorrow** flip to **today** when tomorrow arrives.

## Stack

Next.js 14 (App Router) · TypeScript strict · Tailwind CSS · Framer Motion · next‑pwa.
