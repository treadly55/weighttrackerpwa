import webpush from 'web-push';
import { listSubs, deleteSubByKey } from './store.mjs';

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? '';

function configure() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) throw new Error('VAPID keys are not configured');
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Sends to every subscription for a user; drops ones the browser has expired
export async function sendPush(user, payload) {
  configure();
  const subs = await listSubs(user);
  const results = await Promise.all(
    subs.map(async ({ key, subscription }) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return 'sent';
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await deleteSubByKey(key);
          return 'expired';
        }
        console.error('push failed', user, err.statusCode, err.body);
        return 'failed';
      }
    })
  );
  return { user, sent: results.filter((r) => r === 'sent').length, total: results.length };
}
