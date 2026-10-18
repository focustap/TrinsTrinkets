import { fresh } from '../src/save.js';
import { generateTide } from '../src/tide.js';
import { ITEMS } from '../src/catalog.js';
import { purchase, canDiscover } from '../src/progression.js';
import { seeded } from '../tests/helpers.mjs';
export function simulate(seed, keep = 0.25, optional = true) {
  const rng = seeded(seed),
    s = fresh(),
    route = optional
      ? ['shovel', 'brush', 'sifter', 'trowel', 'probe', 'detector']
      : ['shovel', 'trowel', 'probe', 'detector'];
  let step = 0;
  for (let day = 1; day <= 150; day++) {
    s.day = day;
    for (const f of generateTide(s, 'beach', rng)) {
      if (!canDiscover(s, f.method)) continue;
      const i = ITEMS[f.itemId];
      if (!s.discovered.includes(i.id)) s.discovered.push(i.id);
      if (rng() >= keep) s.coins += i.value;
    }
    while (step < route.length && purchase(s, route[step])) step++;
    if (step === route.length) return day;
  }
  return 150;
}
export function summary(n = 400) {
  const scenarios = [];
  for (const [label, keep, optional] of [
    ['keep 25%, optional brush & sifter', 0.25, true],
    ['keep 40%, optional brush & sifter', 0.4, true],
    ['sell everything, direct equipment route', 0, false],
  ]) {
    const days = Array.from({ length: n }, (_, i) =>
      simulate(i + 123, keep, optional),
    ).sort((a, b) => a - b);
    scenarios.push({
      scenario: label,
      runs: n,
      mean: +(days.reduce((a, b) => a + b) / n).toFixed(1),
      p10: days[Math.floor(n * 0.1)],
      median: days[Math.floor(n * 0.5)],
      p90: days[Math.floor(n * 0.9)],
    });
  }
  return scenarios;
}
if (process.argv[1]?.endsWith('simulate-economy.mjs')) console.table(summary());
