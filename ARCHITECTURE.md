# Weight Tracker — project notes

Reference for whoever picks this up later, including future you. For setup and install steps see [README.md](README.md); this file covers how it works and why.

## What it is

A two-person weight log, built as a PWA on Netlify. Player 1 and Player 2 each record one weight a day from their phone's home screen. When one logs, the other gets a push notification. Anyone who hasn't logged by 7pm Sydney gets a reminder.

Deliberately minimal: two hardcoded users, no accounts, no login, no database, no framework, no build step. Written to a fixed build plan that ruled these out on purpose.

- **Live:** https://blobstrackingappbeta.netlify.app
- **Repo:** https://github.com/treadly55/weighttrackerpwa
- **Built:** September 2026

## Stack

| Layer | Choice |
|---|---|
| Front end | One `index.html` with inline CSS and JS. No framework, no bundler |
| Back end | Netlify Functions, ES modules, Node |
| Storage | Netlify Blobs |
| Push | `web-push` with VAPID, iOS 16.4+ home-screen PWA |
| Scheduling | Netlify Scheduled Function, cron in `netlify.toml` |
| Tests | Node's built-in test runner. No test framework |

Only two dependencies: `@netlify/blobs` and `web-push`.

## Layout

```
public/
  index.html         Entire UI: markup, styles, logic
  manifest.json      PWA manifest, standalone display
  sw.js              Service worker: shell cache, push, notificationclick
  icons/             192, 512, apple-touch (generated, not designed)
netlify/functions/
  entry.mjs          POST: append a weight, push to the other player
  status.mjs         GET: both players' today-status + 14-day history
  subscribe.mjs      GET: public key. POST: store a push subscription
  remind.mjs         Scheduled: nudge whoever hasn't logged
  lib/
    config.mjs       Users, timezone, deadline hour, weight range
    dates.mjs        Sydney date helpers
    store.mjs        Blobs accessors
    push.mjs         web-push wrapper
tests/dates.test.mjs Date helper unit tests (npm test)
```

## Data model

Two key prefixes in a single blob store named `weight-tracker`:

```
entries/<player>/<YYYY-MM-DD>/<timestamp>.json   { user, weight, date, timestamp }
subs/<player>/<endpoint-hash>.json               { user, subscription, updated }
```

**Storage is append-only, by design.** Every entry is its own blob under a unique timestamp. A second entry the same day does not replace the first — both are kept, and reads take the latest. The app never overwrites or deletes an entry. The one exception is subscriptions, which are replaced per endpoint and deleted when a push service reports them expired.

Consequence worth knowing: a mistyped weight can't be corrected or removed through the app. Logging the right value again supersedes it in the UI, but the wrong one stays in storage.

## Things that are easy to get wrong

### Dates are Sydney dates, never UTC

Sydney runs 10 or 11 hours ahead of UTC, so anything logged after 10am Sydney is already "tomorrow" in UTC. Filing by UTC date would scatter evening entries into the next day.

`todayInSydney()` in `lib/dates.mjs` uses `Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' })`, whose `en-CA` locale yields `YYYY-MM-DD` directly. It handles daylight saving automatically because the timezone database does. `tests/dates.test.mjs` pins the boundary cases at 13:00 and 14:00 UTC in both seasons — run `npm test` before touching anything date-related.

### The cron does not follow Australian daylight saving

`netlify.toml` schedules `remind` at `0 9 * * *`, meaning 09:00 UTC. That's 7pm Sydney in winter and 8pm in summer, because cron has no timezone awareness. **This drift is accepted and needs no action.** The only requirement is an evening reminder, so either time is fine. If an exact hour ever matters, change it to `0 10` for summer and back in April. The reminder function does no time checking of its own; the cron is the entire schedule.

### The VAPID public key is served, not hardcoded

The browser needs the public key to subscribe. Rather than committing it, `GET /.netlify/functions/subscribe` returns it from the environment, and the page fetches it before subscribing. Slightly unusual — one endpoint serving both a GET config read and a POST write — but it keeps every key out of the repo. The public key isn't secret; this is about not having key material in version control at all.

### Blob keys can't contain colons

ISO timestamps look like `2026-09-16T10:30:42.499Z`. Local development stores blobs as files, and Windows forbids colons in filenames, so keys replace `:` and `.` with `-`. Lexicographic sorting still matches chronological order, so "latest entry" remains a string comparison. The record inside keeps the true ISO timestamp.

### iOS push has hard requirements

- iOS 16.4 or later, and **only from the home-screen app**. In Safari the API doesn't exist, so the page shows an "add to home screen" hint instead of a dead button.
- `Notification.requestPermission()` must be called inside the tap handler. Any `await` before it breaks the user-gesture chain and iOS silently refuses.
- Permission is per installed app. Deleting and re-adding the icon starts over.
- Subscriptions are bound to the exact origin, so renaming the Netlify site invalidates every one of them.

### Subscriptions self-heal, mostly

When a push service returns 404 or 410, `sendPush` deletes that subscription blob. Dead endpoints clear themselves within a send or two.

Switching players in the UI leaves the old subscription blob under the old player name, so one device can be subscribed under both names and receive notifications meant for either player. **This is accepted.** People do switch players, and an occasional extra notification is fine for a hobby app. It clears itself once that endpoint expires.

### Push failures never fail a log

`entry.mjs` wraps its push in try/catch and logs errors. A push outage must not lose someone's weight entry.

## Security posture

Chosen deliberately, and narrow: HTTPS, VAPID keys in environment variables only, input validation on `entry` (known player, finite number, 20–400 kg).

**There is no authentication, no shared secret and no rate limiting.** Anyone who knows the URL can post an entry as either player or read the data. For two people tracking their own weight this was an accepted trade-off, not an oversight. It would need revisiting before the app held anything sensitive or had more users.

Secrets live only in Netlify environment variables. `.env` is gitignored and has never been committed; history has been scanned to confirm no key material is present.

## Operations

- **Deploy:** push to `main`. Netlify builds in roughly 10–30 seconds. There is no build step, just a file copy plus function bundling.
- **Environment changes:** editing a variable requires a new deploy before functions see it.
- **Rotating VAPID keys** invalidates every subscription. Both players must tap Enable again.
- **Renaming the site or adding a domain** breaks the home-screen apps and all subscriptions. Reinstall and re-enable.
- **Testing the reminder** is awkward, because it only acts on players who haven't logged. Options: move the cron a few minutes ahead and restore it after, or invoke it locally with `netlify functions:invoke remind`. Netlify's scheduler can run several minutes late.
- **Local development:** `npx netlify-cli dev --offline`. It uses a local blob store under `.netlify/`, entirely separate from production data.

## Odds and ends

- **Test data is permanent.** Entries made while testing (101 kg, 169.1 kg and similar) are real records and appear in history for 14 days. Append-only means there's no cleanup path.
- **Stray notifications during the build were testing, not bugs.** Both phones got a push at 8:50pm Sydney on 16 September, around the temporary reminder cron and the confirmation-push tests. The real 7pm reminder has since fired correctly.
- **The icon is generated, not designed.** `make-icons.mjs` wrote the PNGs pixel by pixel via zlib, because there was no artwork and no image library. To replace it, drop new PNGs into `public/icons/` at 192, 512 and 180 pixels.
- **An empty file named `2`** exists in two commits in history, created by a malformed shell redirect and removed immediately. Harmless, left alone rather than rewriting history.
- **The service worker caches only the shell** (page, manifest, icon) and always goes to the network for function calls, so status data is never stale. Bump `CACHE` in `sw.js` when shell files change.
- **`DEADLINE_HOUR = 21`** is display text only ("Due by 9pm"). Nothing enforces it, and it's deliberately later than the 7pm reminder.

## If you extend it

The obvious next addition is a CSV export function, which the build plan flagged as a likely follow-up. Weight change over time, editable entries or more than two players would each need real thought about the append-only model — and more than two players would break the "push the other one" assumption baked into `entry.mjs`.
