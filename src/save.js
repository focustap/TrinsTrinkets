import { UPGRADES, SHOP_COLORS, WOODS } from './progression.js';
export const SAVE_KEY = 'trins-trinkets-save-v1',
  SAVE_VERSION = 2;
export const fresh = () => ({
  version: SAVE_VERSION,
  coins: 0,
  bag: {},
  discovered: [],
  claimed: [],
  shovel: false,
  detector: false,
  equipment: [],
  purchases: [],
  shelf: [],
  wall: 'cream',
  wood: 'maple',
  lights: true,
  wallpaper: 'none',
  floor: 'original',
  rug: 'original',
  accent: 'original',
  lighting: 'warm',
  artwork: null,
  recent: [],
  day: 1,
  beachFinds: null,
  caveFinds: null,
});
const strings = (x) =>
  Array.isArray(x) ? [...new Set(x.filter((v) => typeof v === 'string'))] : [];
const finite = (x, f = 0) => (Number.isFinite(x) ? x : f);
export function migrateSave(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('The saved collection is not a valid object.');
  if (raw.version > SAVE_VERSION)
    throw new Error('This save belongs to a newer game version.');
  // Keep unrecognized fields and IDs so later updates never erase dormant content.
  const s = { ...fresh(), ...raw, version: SAVE_VERSION };
  s.coins = Math.max(0, Math.floor(finite(raw.coins)));
  s.bag = Object.fromEntries(
    Object.entries(raw.bag || {})
      .filter(([, n]) => Number.isFinite(n))
      .map(([id, n]) => [id, Math.max(0, Math.floor(n))]),
  );
  s.discovered = strings(raw.discovered);
  s.claimed = strings(raw.claimed);
  s.equipment = strings(raw.equipment);
  s.purchases = strings(raw.purchases);
  for (const u of UPGRADES)
    if (raw[u.id] && !s.equipment.includes(u.id)) s.equipment.push(u.id);
  s.shovel = !!raw.shovel || s.equipment.includes('shovel');
  s.detector = !!raw.detector || s.equipment.includes('detector');
  // An original detector keeps scanning and magnetic-probe functionality without new prerequisites.
  s.day = Math.max(1, Math.min(99999, Math.floor(finite(raw.day, 1))));
  s.shelf = Array.isArray(raw.shelf)
    ? raw.shelf
        .filter(
          (p) =>
            p &&
            typeof p.itemId === 'string' &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            Number.isFinite(p.z) &&
            (typeof p.uid === 'string' || Number.isFinite(p.uid)),
        )
        .map((p) => ({ ...p, rotation: finite(p.rotation) }))
    : [];
  for (const key of ['beachFinds', 'caveFinds']) {
    if (raw[key] == null) s[key] = null;
    else if (!Array.isArray(raw[key]))
      throw new Error('The saved tide cannot be read safely.');
    else
      s[key] = raw[key]
        .filter(
          (f) =>
            f &&
            typeof f.itemId === 'string' &&
            typeof f.method === 'string' &&
            Number.isFinite(f.x) &&
            Number.isFinite(f.z) &&
            typeof f.uid === 'string',
        )
        .map((f) => ({ ...f }));
  }
  if (!SHOP_COLORS[s.wall]) s.wall = 'cream';
  if (!WOODS[s.wood]) s.wood = 'maple';
  s.recent = strings(raw.recent).slice(0, 12);
  s.artwork =
    Array.isArray(raw.artwork) &&
    raw.artwork.length === 1024 &&
    raw.artwork.every((c) => /^#[0-9a-f]{6}$/i.test(c))
      ? [...raw.artwork]
      : null;
  return s;
}
export function loadSave(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    return {
      state: raw ? migrateSave(JSON.parse(raw)) : fresh(),
      error: null,
      original: raw,
    };
  } catch (error) {
    return {
      state: fresh(),
      error:
        'Your existing save could not be read. Saving is paused to protect it. ' +
        error.message,
      original: null,
    };
  }
}
export function writeSave(
  storage,
  state,
  { blocked = false, original = null } = {},
) {
  if (blocked)
    return {
      ok: false,
      error: 'Saving paused to protect your existing collection',
    };
  try {
    if (original && !storage.getItem(SAVE_KEY + '-backup'))
      storage.setItem(SAVE_KEY + '-backup', original);
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        'Storage unavailable or full. Keep this tab open and export your save.',
    };
  }
}
