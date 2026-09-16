// Temporary: deleted in Stage 6
import { USERS } from './lib/config.mjs';
import { sendPush } from './lib/push.mjs';

export default async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });

  const payload = { title: 'Weight Tracker', body: 'Test: hello from Weight Tracker' };
  const results = await Promise.all(USERS.map((user) => sendPush(user, payload)));

  return Response.json({ results });
};
