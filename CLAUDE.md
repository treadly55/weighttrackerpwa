# Project instructions

## Git process

Follow this every time, no shortcuts:

1. **Stage named paths only.** `git add public/index.html netlify/functions/subscribe.mjs` — never `git add -A` or `git add .`.
2. **Run `git status --short` as its own command** and read the output before committing. Every staged path must be one you meant to add. Untracked files you did not create deliberately get investigated, not committed.
3. **Commit as a separate command**, so the status output is never buried in the same call.
4. **Commit messages are one short line.** No Claude attribution, no `Co-Authored-By`, no "Generated with" footer.
5. **Commit only after the user approves** the stage.

## Shell hygiene

- Do not use `|| true` or `2>/dev/null` to silence commands — they hide the failures worth seeing.
- Write temp paths out in full rather than using a shell variable that may be undefined; an unset variable expands to nothing silently.
- Temp files go in the scratchpad directory, never the repo.

## Build rules

- Storage is append-only. Never overwrite or delete a stored entry.
- Secrets (VAPID keys) live only in Netlify environment variables, never in the repo.
- Stop at every stage checkpoint: show QA evidence, get approval, then commit.
- No new dependencies or structural changes without asking first.
