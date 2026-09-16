import { getStore } from '@netlify/blobs';

const store = () => getStore({ name: 'weight-tracker', consistency: 'strong' });

// Append-only: each entry gets a unique timestamped key
export async function appendEntry(user, date, record) {
  // Colons break local blob files on Windows; still sorts correctly
  const key = `entries/${user}/${date}/${record.timestamp.replace(/[:.]/g, '-')}.json`;
  await store().setJSON(key, record, { onlyIfNew: true });
  return key;
}

const subKey = (user, hash) => `subs/${user}/${hash}.json`;

// One blob per endpoint, so re-subscribing replaces the same sub
export async function saveSub(user, hash, subscription) {
  await store().setJSON(subKey(user, hash), { user, subscription, updated: new Date().toISOString() });
}

export async function listSubs(user) {
  const s = store();
  const { blobs } = await s.list({ prefix: `subs/${user}/` });
  const records = await Promise.all(blobs.map(({ key }) => s.get(key, { type: 'json' })));
  return blobs.map(({ key }, i) => ({ key, ...records[i] })).filter((r) => r.subscription);
}

export async function deleteSubByKey(key) {
  await store().delete(key);
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
