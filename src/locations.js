export const BIOMES = {
  beach: { name: 'The little cove', finds: 'beachFinds' },
  cave: { name: 'Mossglass Cave', finds: 'caveFinds' },
  moonpool: { name: 'Hidden Moonpool', finds: 'moonpoolFinds' },
};
// Shoreline, stepping stones and one clear shallow bed. Rendering seats each
// saved location on its real support without changing the saved tide.
export const MOONPOOL_SITES = [
  [-1.2, 3.4],
  [1.2, 1.3],
  [-1.3, -1],
  [1.5, -3.4],
  [-1.2, -6.2],
  [0.8, -10],
  [-8.8, 1.4],
  [8.7, -1.8],
  [-8.6, -8.8],
  [8.2, -10.8],
];
export function stepThrough(
  mode,
  p,
  next,
  { beachOpen = false, moonpoolOpen = false } = {},
) {
  const { x, z } = next;
  if (mode === 'beach') {
    if (x > 14.4 && Math.abs(z - 1) < 1.7) {
      if (!beachOpen) return { x: Math.min(x, 14.4), z };
      if (x > 18) return { to: 'cave' };
      return { x, z };
    }
    if (
      x > 14.5 ||
      x < -14.5 ||
      z < -14 ||
      z > 18 ||
      (x > -11.2 && x < -3.8 && z > 9.5) ||
      (x > 4.7 && x < 10.3 && z > 10)
    )
      return { x: p.x, z: p.z };
  } else if (mode === 'cave') {
    if (z > 3.7 && Math.abs(x) < 2) return { to: 'beach' };
    if (z < -23.2 && Math.abs(x) < 1.65) {
      if (moonpoolOpen && z < -24.7) return { to: 'moonpool' };
      return { x, z: moonpoolOpen ? z : -23.2 };
    }
    return {
      x: Math.max(-6.2, Math.min(6.2, x)),
      z: Math.max(-23.2, Math.min(3.7, z)),
    };
  } else if (mode === 'moonpool') {
    if (z > 7 && Math.abs(x) < 2) return { to: 'cave', from: 'moonpool' };
    return {
      x: Math.max(-10.5, Math.min(10.5, x)),
      z: Math.max(-13, Math.min(7, z)),
    };
  }
  return { x, z };
}
