import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../scripts/simulate-economy.mjs';
test('ordinary collecting with favorite keeping reaches detector in roughly 20–40 days', () => {
  const days = Array.from({ length: 120 }, (_, i) =>
      simulate(i + 123, 0.25, true),
    ),
    mean = days.reduce((a, b) => a + b) / days.length;
  assert.ok(mean >= 20 && mean <= 40, 'average days: ' + mean);
  assert.ok(days.every((d) => d > 5 && d < 80));
});
