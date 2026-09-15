import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayInSydney, addDays } from '../netlify/functions/lib/dates.mjs';

test('before 14:00 UTC is still the same Sydney date (AEST, UTC+10)', () => {
  assert.equal(todayInSydney(new Date('2026-07-15T13:59:00Z')), '2026-07-15');
});

test('14:00 UTC rolls to the next Sydney date (AEST)', () => {
  assert.equal(todayInSydney(new Date('2026-07-15T14:00:00Z')), '2026-07-16');
});

test('13:00 UTC rolls to the next Sydney date during daylight saving (AEDT, UTC+11)', () => {
  assert.equal(todayInSydney(new Date('2026-01-15T12:59:00Z')), '2026-01-15');
  assert.equal(todayInSydney(new Date('2026-01-15T13:00:00Z')), '2026-01-16');
});

test('evening entry in Sydney files under the Sydney date, not UTC', () => {
  // 8:30pm Sydney on 15 July = 10:30 UTC, same date both ways
  assert.equal(todayInSydney(new Date('2026-07-15T10:30:00Z')), '2026-07-15');
  // 11:30pm UTC on 14 July = 9:30am Sydney on 15 July
  assert.equal(todayInSydney(new Date('2026-07-14T23:30:00Z')), '2026-07-15');
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});
