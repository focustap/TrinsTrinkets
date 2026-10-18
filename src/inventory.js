import { CATALOG, ITEMS, SETS } from './catalog.js';
export const displayed = (s, id) =>
  s.shelf.filter((p) => p.itemId === id).length;
export const availableCopies = (s, id) =>
  Math.max(0, (s.bag[id] || 0) - displayed(s, id));
export function sellTreasure(s, id) {
  const item = ITEMS[id];
  if (!item || availableCopies(s, id) < 1) return false;
  s.bag[id]--;
  s.coins += item.value;
  return true;
}
export function sellExtras(s) {
  let total = 0;
  for (const item of CATALOG) {
    const n = Math.max(
      0,
      Math.min(availableCopies(s, item.id), (s.bag[item.id] || 0) - 1),
    );
    if (n) {
      s.bag[item.id] -= n;
      s.coins += item.value * n;
      total += n;
    }
  }
  return total;
}
export function claimCompletedSets(s) {
  const completed = [];
  for (const set of SETS)
    if (
      !s.claimed.includes(set) &&
      CATALOG.filter((i) => i.set === set).every((i) =>
        s.discovered.includes(i.id),
      )
    ) {
      s.claimed.push(set);
      if (set !== 'Moonpool Wonders') s.coins += 500;
      completed.push(set);
    }
  return completed;
}
