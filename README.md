# GUILDWORK — Service Booking App (Tailwind + GSAP + Firebase + Cloudinary)

Plain JavaScript (ES modules, no framework/bundler), styled with the
Tailwind Play CDN, animated with GSAP, backed by Firebase Auth + Firestore,
with provider profile photos uploaded straight to Cloudinary.

## 1. Firebase setup

1. https://console.firebase.google.com → create a project.
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database** → create database (production mode).
4. **Project settings → General → Your apps → Web app** → copy the config
   into `firebase-config.js`.
5. **Firestore → Rules** → paste `firestore.rules` → Publish.
6. First run of the app will hit two queries combining `where` + `orderBy`
   (bookings for customer / for provider). Firestore's console error gives
   you a **link that auto-creates the needed index** — click it once per
   query, then retry.

## 2. Cloudinary setup (profile photo upload)

1. https://cloudinary.com → create a free account → copy your **Cloud name**
   from the dashboard.
2. **Settings → Upload → Upload presets → Add upload preset**.
   - Set **Signing mode = Unsigned** (required — this is what lets the
     browser upload directly with no backend/API secret).
   - Optionally restrict it to an images-only folder, set a max file size,
     or add moderation.
3. Put both values into `cloudinary-config.js`:
   ```js
   export const cloudinaryConfig = {
     cloudName: "your-cloud-name",
     uploadPreset: "your-unsigned-preset",
     folder: "GUILDWORK-profile-photos" // optional
   };
   ```
That's the entire integration — `cloudinary.js` posts the file straight to
`https://api.cloudinary.com/v1_1/<cloud_name>/image/upload` and Firestore
only ever stores the resulting `secure_url` on `users/{uid}.profileImageUrl`.

## 3. Running it

Static files + ES modules — serve over HTTP, not `file://`:

```bash
npx serve .
```

Open `login.html` (or `index.html`, which redirects based on auth state).

## 4. Pages

| Page | Purpose |
|---|---|
| `login.html` | Sign up (customer/provider) / log in |
| `browse.html` | Customer: search & browse providers |
| `provider.html?id=<uid>` | Provider profile + booking request form |
| `customer-dashboard.html` | Customer: bookings, leave reviews |
| `provider-dashboard.html` | Provider: requests, status actions |
| `edit-profile.html` | **New** — edit name/bio/trade/rate + upload profile photo (Cloudinary) |

## 5. Dark theme

The whole app now runs on a black/dark palette (`canvas #0E1310` page bg,
`paper #19211D` cards, warm off-white `ink #F3F0E8` text). A few things
worth knowing if you keep customizing colors:

- `ink` is used for **text only** now, never as a solid fill — solid dark
  buttons/active-tab states use `rustdark` (persistent) or `bg-neutral-800`
  (neutral action buttons) instead, since a light "ink" can't double as a
  dark button background.
- Every form field has an explicit `bg-canvas` + `placeholder:text-inksoft/60`
  — without that, browsers fall back to a stark white input box regardless
  of page theme.
- `<body>` carries `[color-scheme:dark]` so native browser chrome (date
  pickers, checkboxes) renders dark-appropriate icons too.
- The toast (`ui.js`) and the review-modal scrim use fixed hex/`bg-black`
  values rather than theme tokens, so they stay legible even if you swap
  the palette back to light later.

## 6. What changed in this pass

- **Styling** rebuilt on Tailwind (Play CDN, no build step) — rounded-2xl
  cards, consistent spacing scale, shadow-sm/hover states, responsive grids.
- **Color contrast** tightened: darker `ink` (#14201C) and `inksoft`
  (#46554D) body text, darker status-badge colors (`amber`, `denim`,
  `rustdark`, `ok`) so every badge and label clears WCAG AA against white
  card backgrounds, and a visible `focus-visible` ring (`denim`) on every
  interactive element for keyboard users.
- **GSAP animations** (`anim.js`, shared): page/section fade-ins, staggered
  card reveals on every list (browse grid, both dashboards), a spring-style
  modal open/close for the review dialog, a shake on invalid form
  submission, and a small pulse on successful actions (accept/reject/status
  change, photo upload, save).
- **Edit Profile page** — new. Name/bio for everyone; trade + hourly rate
  for providers; a drag-and-drop (or click) photo uploader with a live
  progress bar that uploads directly to Cloudinary and writes the resulting
  URL onto the user's profile. Avatars (photo or initials fallback) now
  show up in the nav, browse grid, and provider profile header.

## 6. Business rules (unchanged, still centralized in `db.js`)

| Rule | Where |
|---|---|
| Unique booking ID | Firestore's `addDoc()` auto-ID |
| Required-field validation | inline UI checks + re-validated in `db.js` |
| No review before completion | `submitReview()` checks `status === 'completed'` |
| One review per booking | review doc ID *is* the booking ID + existence check |
| Rejected → In Progress blocked | strict `ALLOWED_TRANSITIONS` state machine |
| Completed can't be edited | same state machine; dashboard hides action buttons |

`firestore.rules` enforces the same rules server-side, independent of the
client — don't skip publishing it.
