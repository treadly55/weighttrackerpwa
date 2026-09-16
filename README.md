# Weight Tracker

Live at https://blobstrackingappbeta.netlify.app

A small web app for two people (Player 1 and Player 2) to log one weight a day. Entries are stored append-only in Netlify Blobs — a second entry on the same day is kept as an extra record, and nothing is ever overwritten or deleted. When one player logs, the other gets a push notification. Anyone who hasn't logged by 7pm Sydney gets a reminder. Plain HTML, CSS and JavaScript with no framework or build step, on Netlify serverless functions.

## Environment variables

Set these in Netlify under Site configuration → Environment variables. They must never be committed to the repo.

| Variable | What it is |
|---|---|
| `VAPID_PUBLIC_KEY` | Public half of the push key pair |
| `VAPID_PRIVATE_KEY` | Private half — treat as a password |
| `VAPID_SUBJECT` | Contact URI for the push services, e.g. `mailto:you@example.com` or `https://blobstrackingappbeta.netlify.app` |

Generate a pair with `npx web-push generate-vapid-keys`. Changing the keys invalidates every existing subscription, so both players would need to tap Enable notifications again. Environment variable changes only reach the functions after a new deploy.

## Installing on an iPhone

Both players do this on their own phone. iOS 16.4 or later is required, and notifications only work from the installed app, never from Safari.

1. Open https://blobstrackingappbeta.netlify.app in Safari.
2. Share → **Add to Home Screen** → Add.
3. Open the app **from the home screen icon**.
4. Choose Player 1 or Player 2. The choice is remembered, and "Switch player" in the corner changes it.
5. Tap **Enable notifications** and accept the iOS prompt. The button disappears once granted.

## The daily reminder and daylight saving

The reminder is a scheduled function in `netlify.toml`:

```toml
[functions."remind"]
  schedule = "0 9 * * *"
```

The time is in UTC. `0 9` means 09:00 UTC, which is 7pm Sydney during standard time (AEST) and 8pm during daylight saving (AEDT), since the cron does not shift with Australian clocks. To move it back to 7pm over summer, change the hour to `0 10`, and back to `0 9` when daylight saving ends. Commit and push, and the new schedule takes effect on deploy.

## How it is put together

```
public/              index.html (whole UI), manifest.json, sw.js, icons/
netlify/functions/   entry.mjs, status.mjs, subscribe.mjs, remind.mjs
                     lib/ config.mjs, dates.mjs, store.mjs, push.mjs
tests/               dates.test.mjs   (run with npm test)
```

Blob keys are `entries/<player>/<YYYY-MM-DD>/<timestamp>.json` and `subs/<player>/<endpoint-hash>.json`. Dates use the Australia/Sydney calendar date, so an entry logged at 10pm files under that evening's date rather than the following UTC day. Settings such as the player names, the timezone and the 20–400 kg range live in `netlify/functions/lib/config.mjs`.

## Exporting your data

There is no export button. The data lives in Netlify Blobs and can be read through `GET /.netlify/functions/status`, which returns the last 14 days. A small `export` function returning the full history as CSV would be a straightforward future addition.
