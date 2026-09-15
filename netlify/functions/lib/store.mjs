import { getStore } from '@netlify/blobs';

const store = () => getStore({ name: 'weight-tracker', consistency: 'strong' });

// Append-only: each entry gets a unique timestamped key
export async function appendEntry(user, date, record) {
  // Colons break local blob files on Windows; still sorts correctly
  const key = `entries/${user}/${date}/${record.timestamp.replace(/[:.]/g, '-')}.json`;
  await store().setJSON(key, record, { onlyIfNew: true });
  return key;
}

// Latest entry per date for a user, as { 'YYYY-MM-DD': record }
export async function latestPerDay(user) {
  const s = store();
  const { blobs } = await s.list({ prefix: `entries/${user}/` });
  const latestKeys = {};
  for (const { key } of blobs) {
    const date = key.split('/')[2];
    if (!latestKeys[date] || key > latestKeys[date]) latestKeys[date] = key;
  }
  const result = {};
  await Promise.all(
    Object.entries(latestKeys).map(async ([date, key]) => {
      result[date] = await s.get(key, { type: 'json' });
    })
  );
  return result;
}
