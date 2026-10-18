import { CATALOG, ITEMS } from './catalog.js';
import { rollTreasure } from './rarity.js';
import { equipmentState, canDiscover } from './progression.js';
export function generateTide(state, environment = 'beach', rng = Math.random) {
  const equipment = equipmentState(state),
    finds = [];
  const special = [
    'brush',
    'sifter',
    'scoop',
    'trowel',
    'probe',
    'detector',
    'coil',
    'professional',
  ].filter((m) => canDiscover(state, m));
  const methods =
    environment === 'beach'
      ? [
          'surface',
          'surface',
          'surface',
          'surface',
          'surface',
          'surface',
          'surface',
          'surface',
          'surface',
          'shovel',
          'shovel',
          'shovel',
          'shovel',
          'shovel',
          ...Array.from({ length: 4 }, (_, i) =>
            special.length
              ? special[(state.day + i) % special.length]
              : ['brush', 'sifter', 'trowel', 'detector'][i],
          ),
        ]
      : [
          'cave',
          'cave',
          'cave',
          'cave',
          'cave',
          'cave',
          'brush',
          'lantern',
          'lantern',
          'pick',
          'pick',
          'pick',
        ];
  for (const [i, method] of methods.entries()) {
    // Specialized tools also uncover ordinary finds. This keeps a detector's pool
    // broad enough that its exclusive Mythics never become a large fraction of rolls.
    const methods =
      environment === 'beach'
        ? method === 'surface'
          ? ['surface']
          : method === 'shovel'
            ? ['surface', 'shovel']
            : ['surface', 'shovel', method, ...special]
        : ['cave', method];
    const item = rollTreasure(
      CATALOG,
      { method, methods, environment, equipment },
      rng,
    );
    if (!item) continue;
    let x,
      z,
      tries = 0;
    do {
      x = environment === 'beach' ? (rng() - 0.5) * 25.5 : (rng() - 0.5) * 13;
      z = environment === 'beach' ? -12.5 + rng() * 19 : -4 - rng() * 16;
      tries++;
    } while (
      tries < 80 &&
      finds.some((f) => Math.hypot(f.x - x, f.z - z) < 1.5)
    );
    finds.push({
      uid: `${environment}-${state.day}-${i}-${Math.floor(rng() * 1e8)}`,
      itemId: item.id,
      method,
      x,
      z,
    });
  }
  return finds;
}
export function ensureTides(s, rng = Math.random) {
  if (s.beachFinds === null) s.beachFinds = generateTide(s, 'beach', rng);
  if (s.caveFinds === null) s.caveFinds = generateTide(s, 'cave', rng);
}
export function advanceDay(s, rng = Math.random) {
  s.day = Math.min(99999, s.day + 1);
  s.beachFinds = generateTide(s, 'beach', rng);
  s.caveFinds = generateTide(s, 'cave', rng);
}
export function takeFind(s, uid, environment) {
  const key = environment === 'cave' ? 'caveFinds' : 'beachFinds',
    index = s[key].findIndex((f) => f.uid === uid);
  if (index < 0) return null;
  const f = s[key][index],
    item = ITEMS[f.itemId];
  if (!item || !canDiscover(s, f.method)) return null;
  s[key].splice(index, 1);
  s.bag[item.id] = (s.bag[item.id] || 0) + 1;
  if (!s.discovered.includes(item.id)) s.discovered.push(item.id);
  s.recent = [item.id, ...s.recent.filter((id) => id !== item.id)].slice(0, 12);
  return item;
}
