import { USERS, HISTORY_DAYS } from './lib/config.mjs';
import { todayInSydney, addDays } from './lib/dates.mjs';
import { latestPerDay } from './lib/store.mjs';

export default async (req) => {
  if (req.method !== 'GET') return Response.json({ error: 'GET only' }, { status: 405 });

  const today = todayInSydney();
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => addDays(today, -i));

  const result = { today };
  await Promise.all(
    USERS.map(async (user) => {
      const byDay = await latestPerDay(user);
      const latestToday = byDay[today] ?? null;
      result[user] = {
        loggedToday: latestToday !== null,
        latestToday,
        history: days.filter((d) => byDay[d]).map((d) => byDay[d]),
      };
    })
  );

  return Response.json(result);
};
