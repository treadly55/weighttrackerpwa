import { USERS } from './lib/config.mjs';
import { todayInSydney } from './lib/dates.mjs';
import { latestPerDay } from './lib/store.mjs';
import { sendPush } from './lib/push.mjs';

// Scheduled in netlify.toml: 0 9 * * * (7pm Sydney AEST, 8pm during daylight saving)
export default async () => {
  const today = todayInSydney();
  const reminded = [];

  for (const user of USERS) {
    const byDay = await latestPerDay(user);
    if (byDay[today]) continue;
    try {
      await sendPush(user, {
        title: 'Weight Tracker',
        body: "You haven't logged your weight yet today",
        tag: 'reminder',
      });
      reminded.push(user);
    } catch (err) {
      console.error('reminder push failed', user, err);
    }
  }

  console.log('remind', { today, reminded });
  return new Response(JSON.stringify({ today, reminded }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
