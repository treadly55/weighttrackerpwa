import { createHash } from 'node:crypto';
import { USERS } from './lib/config.mjs';
import { saveSub } from './lib/store.mjs';
import { vapidPublicKey } from './lib/push.mjs';

const json = (body, status = 200) => Response.json(body, { status });

export default async (req) => {
  // GET hands the front end the public key so it can subscribe
  if (req.method === 'GET') return json({ publicKey: vapidPublicKey() });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { user, subscription } = body ?? {};
  if (!USERS.includes(user)) return json({ error: 'Unknown user' }, 400);
  if (!subscription?.endpoint || !subscription?.keys) return json({ error: 'Invalid subscription' }, 400);

  const hash = createHash('sha256').update(subscription.endpoint).digest('hex').slice(0, 16);
  await saveSub(user, hash, subscription);

  return json({ ok: true, user, hash });
};
