import { owns } from './progression.js';
export function shelfSlots(s) {
  const slots = [];
  const grid = (xs, ys, z) => {
    for (const y of ys) for (const x of xs) slots.push({ x, y, z });
  };
  grid([-2.1, -1.26, -0.42, 0.42, 1.26, 2.1], [1.18, 2.13, 3.07], -2.55);
  if (owns(s, 'secondShelf'))
    grid([-5.45, -4.61, -3.77, 3.77, 4.61, 5.45], [1.18, 2.13, 3.07], -2.55);
  if (owns(s, 'largeShelf'))
    grid(
      Array.from({ length: 12 }, (_, i) => -5.05 + i * 0.92),
      [4.6],
      -2.55,
    );
  if (owns(s, 'cabinet'))
    grid([-1.45, -0.5, 0.5, 1.45], [0.95, 1.95, 2.95], 0.25);
  if (owns(s, 'roomExpansion'))
    grid([7.2, 8.1, 9, 9.9], [1.18, 2.13, 3.07], -2.55);
  if (owns(s, 'deluxeGallery'))
    grid(
      Array.from({ length: 8 }, (_, i) => -10.5 + i * 0.9),
      [5.65, 6.6, 7.55],
      -2.55,
    );
  return slots;
}
// Models are normalized to a .68-wide footprint. Slots leave room for rotation and supports.
export const slotFree = (slot, placements, ignore = null) =>
  !placements.some(
    (p) =>
      p.uid !== ignore &&
      Math.abs(p.y - slot.y) < 0.2 &&
      Math.hypot(p.x - slot.x, p.z - slot.z) < 0.75,
  );
export function nearestSlot(s, point, ignore = null) {
  return (
    shelfSlots(s)
      .filter((slot) => slotFree(slot, s.shelf, ignore))
      .sort(
        (a, b) =>
          (a.x - point.x) ** 2 +
          (a.y - point.y) ** 2 +
          (a.z - point.z) ** 2 -
          ((b.x - point.x) ** 2 + (b.y - point.y) ** 2 + (b.z - point.z) ** 2),
      )[0] || null
  );
}
