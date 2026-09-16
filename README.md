# Weight Tracker

Live at https://blobstrackingappbeta.netlify.app

A small web app, hosted on Netlify, for two people (Player 1 and Player 2) to log one weight a day. Entries are stored append-only in Netlify Blobs. When one player logs, the other gets a push notification, and anyone who hasn't logged by the daily reminder time (09:00 UTC, which is 7pm Sydney) gets a nudge. It needs three Netlify environment variables: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (a `mailto:` address). Never commit these keys to the repo. To install on an iPhone (iOS 16.4 or later), open the site in Safari, tap Share → Add to Home Screen, then open the app from the home screen and tap "Enable notifications".
