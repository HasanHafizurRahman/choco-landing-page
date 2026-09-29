# moyra (ময়রা): storefront prototype

A landing page and shop in one, built with Next.js (App Router), React and TypeScript.
Chocolate is always on sale. Seasonal collections (mangoes in summer, gift boxes in February, anything
you add later) switch on and off by date or from the admin panel. Outside a season the site is simply a
chocolate shop; when a season arrives it takes over the page with its own colours.

The brand lives in `brand` in `lib/data.ts`: the name (**moyra**, the Bengali word for a sweet-maker),
the Bangla name, and the letter **ম** used in the logo. Change them there and they update everywhere,
including the letter and name molded into the chocolate bar in the hero. The favicon (`app/icon.png`,
`app/apple-icon.png`) is an image, so redraw it if the letter changes.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production build: `npm run build` then `npm start`.

### Preview each state (prototype only)

The **Preview** pill (bottom right) switches the site between its states:

| Preview | URL | What you'll see |
| --- | --- | --- |
| No season | `/?preview=none` (default) | Chocolate only. No seasonal tab, poster, calendar or mango text anywhere. Pistachio brand colours |
| 20 January | `/?preview=soon` | Coming soon: gift boxes open in 12 days. Teaser poster in the rose gift colours, reminder sign-up |
| 12 June | `/?preview=mango` | Mango season live: harvest calendar, pre-booking, mango-gold theme |
| 6 February | `/?preview=gifts` | Gift boxes live: countdown to the 14th, rose theme |

Delete `components/PreviewDock.tsx` and `lib/preview.ts` once the API decides what's live, and pass
`todayInDhaka()` in `app/page.tsx`.

## How the seasons work

The site is always in one of three states, worked out from the date and the data:

| State | When | What changes |
| --- | --- | --- |
| **Chocolate only** | Nothing is live or about to open, or `settings.seasonalEnabled` is `false` | Only chocolate on the page, in the brand colours (`brandTheme`) |
| **Coming soon** | A collection opens within its `announceDays` | Top bar, a teaser poster in that season's colours, a reminder sign-up and the year calendar. Still only chocolate for sale |
| **Live** | A collection is on sale | The collection leads: top bar, hero button, Seasonal tab, poster, calendar and colours |

- **`settings.seasonalEnabled`** is the master switch. Turn it off and the site is chocolate only, whatever the date.
- **Collections** are either `core` (Premium chocolate, always on) or `seasonal`. A seasonal collection has
  a date window (`from`/`to`, as `MM-DD`), a `status` (`auto` follows the dates, `on`/`off` overrides them)
  and `announceDays`: how many days before opening to start the teaser. Set it to `0` for no teaser.
- **Always-on sections** wrap their seasonal bits (the mango delivery promise, the pre-booking question)
  in `<IfSeasonal>`, so they disappear in the chocolate-only state.
- Seasonal products can have their own window (each mango variety). Before it they show **Pre-book**,
  inside it **In season** (or **Last few days**), after it **Season over**.
- The poster has three layouts, chosen per collection with `poster.layout`: `harvest` (timeline of
  varieties), `countdown` (days to a date) and `grid` (a simple product row). A new seasonal collection
  like "Eid hampers" needs only data, no code.

## Connecting the API / admin panel

Everything reads from one function, `getShop()` in `lib/api.ts`. Make your endpoint return the
`ShopData` shape defined in `lib/types.ts`, then replace the function body with a `fetch`. The
comment in that file shows how.

Other hook points:

- **Orders:** `placeOrder` in `components/CartDrawer.tsx` (currently shows a confirmation without sending anything)
- **"Text me when it opens" reminders:** `components/NotifyForm.tsx`
- **Product images from a CDN:** add the host to `images.remotePatterns` in `next.config.ts`
- **Cart:** stored in the browser (`localStorage`), so it survives a reload

## Project layout

```
app/            layout (fonts, metadata), page, global styles, favicon
components/     Hero, Shop, ProductCard, SeasonPoster, YearWheel, CartDrawer, ProductSheet, …
lib/            types, mock data, api, season/date logic, WebGL chocolate renderer
public/images/  product photos used by the site
assets/         your original photo folders (untouched)
```

### The hero

The chocolate bar is drawn live with WebGL (`lib/chocolate-gl.ts`), so it needs no photo and is sharp on
any screen. It floats between the two words, behind "Chocolate," and in front of "always.", and casts a
soft shadow on the page. The light follows the cursor, or the tilt of a phone. One corner snaps off as
the page loads; visitors can click or tap any square to snap it off, and a few seconds later the squares
grow back. CSS decides where the bar sits: the renderer fits it into the `.hero-stage` box. It pauses when
off screen, respects reduced-motion settings, and the words still show if WebGL isn't available.

## Photos

### What's used now

From your `assets/` folders, copied to `public/images/products/` with clean names: the Lindt,
Soothys, Amul, Cadbury Silk, Ferrero and Nutri+ packshots, five mango photos and three gift boxes.

**Not used, on purpose:**

- **Other shops' watermarks.** The KitKat Dark photo (ChocolateMart BD), the Dairy Milk photo
  (chocolateshopbd.com) and the Cadbury spread photo (sevenone.com.bd, with their phone number).
  Publishing these would advertise those shops and may breach their copyright.
- **Labelled "AI-generated content".** The KitKat explosion box.
- **Another brand on the box.** The men's hamper, which has the "Gift Tree" branding.
- **Not chocolate, or too small to display.** The Eid box, the pen set, the mug set and the donut boxes.

Most of the photos that remain are small (200–550 px). They look fine at card size but soft on large
phones. Replace them with your own photos before launch.

### What to shoot (one style, every product)

| Where | What | Format |
| --- | --- | --- |
| Product cards and detail sheet (chocolate) | The pack straight on, on a pure white background, filling ~75% of the frame, soft even light, no props. Same angle for every bar. | Square, at least 1200 × 1200 px |
| Mango cards | One whole fruit plus a cut cheek, on white. Optionally a second shot of a ventilated crate. | Square, at least 1200 × 1200 px |
| Gift boxes | Box open at a three-quarter angle on one plain surface (use the same surface for every box), daylight. No text or prices in the photo. | Portrait 4:5, at least 1200 × 1500 px |
| Link previews (Facebook, WhatsApp) | The hero bar with the logo | 1200 × 630 px |

The site places white-background photos on white "plates", so a clean white background makes every
product look cut out and consistent. The hero needs no photo.

## Placeholder content to confirm before launch

These are written as if true. Keep, change or remove each one to match how you actually operate:

- Delivery fees (৳70 Dhaka / ৳130 outside), free delivery over ৳2,000, "within 24 hours" in Dhaka, "2–4 days" elsewhere
- Cold storage at 17°C, insulated boxes and ice packs from March to October
- Mangoes: "no carbide, no formalin", "at your door in two days", orchards in Rajshahi and Chapainawabganj
- "Authorised importers" and best-before dates, all prices, the phone number and social links
- Mango harvest windows and the gift-box window (edit the `from`/`to` dates in `lib/data.ts`)
