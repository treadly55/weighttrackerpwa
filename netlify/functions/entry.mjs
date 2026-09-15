import { USERS, MIN_WEIGHT, MAX_WEIGHT } from './lib/config.mjs';
import { todayInSydney } from './lib/dates.mjs';
import { appendEntry } from './lib/store.mjs';

const json = (body, status = 200) => Response.json(body, { status });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { user, weight } = body ?? {};
  if (!USERS.includes(user)) return json({ error: 'Unknown user' }, 400);
  if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
    return json({ error: `Weight must be a number between ${MIN_WEIGHT} and ${MAX_WEIGHT}` }, 400);
  }

  const now = new Date();
  const record = { user, weight, date: todayInSydney(now), timestamp: now.toISOString() };
  await appendEntry(user, record.date, record);

  // TODO(Stage 5): send confirmation push to the other player

  return json(record);
};
