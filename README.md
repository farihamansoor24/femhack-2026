# Guildwork — local service marketplace (MVP)

A fully functional booking marketplace built with **HTML + Tailwind CSS (CDN) +
vanilla JavaScript (ES modules) + Firebase (Auth & Firestore) + GSAP**. No
build step, no framework — open it in a browser once Firebase is configured.

## What's included

- Responsive home page with search + category filter and 6 seeded provider
  listings (auto-created in Firestore the first time the app runs).
- Provider detail page (name, service, location, experience, price, rating, reviews).
- Email/password auth for two roles: **customer** and **provider**.
- Booking form (service, date, time, location, description) with validation
  and a generated unique booking ID (e.g. `GW-M1A2B3-X9K2`).
- Customer dashboard with live booking status + star review form once a job
  is completed.
- Provider dashboard with live incoming bookings, Accept/Reject, then
  In&nbsp;Progress → Completed transitions.
- All data lives in Firestore, so refreshing the page never loses anything.
- GSAP-driven motion: hero intro, staggered card reveals, and a "rubber
  stamp" bounce whenever a booking's status changes.

## 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. Inside the project, click the **`</>` (Web) icon** to register a web app and
   copy the `firebaseConfig` object it gives you.
3. Open `js/firebase-config.js` in this project and paste your values in place
   of every `"REPLACE_ME"`.

## 2. Turn on Authentication

Authentication → Sign-in method → enable **Email/Password**.

## 3. Turn on Firestore

Firestore Database → Create database → start in **test mode** (or paste the
rules below right away).

### Recommended security rules

Paste this into Firestore → Rules once you're ready to lock things down:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    match /providers/{providerId} {
      allow read: if true; // public directory
      allow write: if request.auth != null && request.auth.uid == providerId;
    }

    match /bookings/{bookingId} {
      allow create: if request.auth != null
        && request.resource.data.customerId == request.auth.uid;

      allow read: if request.auth != null
        && (resource.data.customerId == request.auth.uid
            || resource.data.providerId == request.auth.uid);

      // Provider can change status; customer can only attach a review
      // to their own, already-completed booking.
      allow update: if request.auth != null && (
        (resource.data.providerId == request.auth.uid
          && request.resource.data.customerId == resource.data.customerId)
        || (resource.data.customerId == request.auth.uid
          && resource.data.status == 'completed'
          && resource.data.review == null)
      );
    }
  }
}
```

## 4. Run it locally

Because the app uses ES module `import`s, it must be served over `http://`,
not opened directly as a `file://` path. Any static server works, for example:

```bash
cd service-marketplace
python3 -m http.server 8080
# then open http://localhost:8080
```

or, with Node installed:

```bash
npx serve .
```

## 5. Try the full workflow

1. Register an account as a **customer** — browse providers from the home page.
2. Open a provider, submit a booking (you'll get a ticket ID).
3. In a second browser/incognito window, register as a **provider**, fill in
   your profile (Manage profile), and note your bookings dashboard is empty
   unless a customer books *you* specifically — book one of your own seeded
   listings to test end-to-end, or have the customer book the provider
   profile you just created.
4. As the provider: **Accept** → **Start progress** → **Mark completed**.
5. As the customer: refresh the dashboard, leave a **1–5 star review**.

## Project structure

```
index.html                 shell: nav, fonts, Tailwind/GSAP/Firebase CDN tags
css/styles.css              ticket/stamp signature styling, focus states
js/firebase-config.js       your Firebase project config
js/seed-data.js             categories + 6 demo providers
js/auth.js                  register/login/logout, user profile doc
js/db.js                    Firestore reads/writes for providers & bookings
js/state.js                 tiny observable store for the current user
js/router.js                hash router with auth/role guards
js/animations.js            GSAP helpers (hero intro, stagger, stamp bounce)
js/utils.js                 booking ID gen, toasts, validation, formatting
js/ui/*.js                  one render function per screen
js/main.js                  wires everything together
```

## Business rules enforced in the UI + data layer

- Every booking gets a unique, generated `bookingId`.
- The booking form validates all required fields before submit.
- A review can only be submitted once a booking's status is `completed`,
  and only once per booking (`db.js` → `submitReview` double-checks this
  server-round-trip before writing, in addition to the UI hiding the form
  once a review exists).
- Status transitions are whitelisted in `db.js` (`ALLOWED_TRANSITIONS`) —
  a rejected booking can never move to In Progress, and the UI only ever
  renders the one next valid action per status.
- Completed/rejected bookings show no edit controls.
