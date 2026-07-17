# 🥤 Spirit Soda POS

A lightweight, mobile-first point-of-sale for the Spirit Soda cafe (prices in
Egyptian pounds). Built as an installable **PWA** (Vite + React). Runs on any
phone browser.

Tap **✨ Load Spirit Soda sample menu** on the Menu tab (shown while the menu is
empty) to populate all the drinks, smoothies, juices and snacks with emoji icons.

## What it does

- **Menu** tab — manage categories and items, set **sizes & prices** and optional
  **add-ons**, and toggle items **sold out** without deleting them.
- **Cashier** tab — build an order by tapping items, pick size/add-ons/quantity,
  attach the **customer name**, see the **running total**, send the order.
- **Orders** tab — live board of the day's orders **grouped by category**, each
  line tagged with the customer's name; tap to mark an order complete.
- **Reports** tab — **daily total**, order count, best sellers, sales by category,
  and **CSV export** for accounting. Pick any date.

## Run it (single device — works immediately)

```bash
cd cafe-pos
npm install
npm run dev
```

Open the printed `http://localhost:5173` (or the LAN address it prints) on your
phone. With no Supabase keys, all data is stored in the browser on that device.

Install to home screen: in mobile Safari/Chrome use **Share → Add to Home Screen**.

## Enable live sync across devices (cashier phone + display screen)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase-schema.sql`](supabase-schema.sql), and **Run**.
3. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env` and fill them in:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. Restart `npm run dev`. The header shows **● Live sync**. Open the app on two
   devices — orders rung up on one appear on the other instantly.

## Build for hosting

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

Deploy `dist/` to any static host (Netlify, Vercel, GitHub Pages, etc.).

## Notes

- Currency symbol: edit `CURRENCY` in [`src/lib/format.js`](src/lib/format.js).
- The prototype's Supabase policies allow the anon key full read/write. Add
  Supabase Auth and tighten the row-level-security policies before real use.
# spirit-soda
