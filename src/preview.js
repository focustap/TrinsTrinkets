// Explicit developer previews are transient: never read, replace or write player saves.
import { fresh, migrateSave } from './save.js';
import { CATALOG } from './catalog.js';
import { UPGRADES, DECOR } from './progression.js';
import { shelfSlots } from './shelves.js';
export function previewState(kind) {
  const s = fresh();
  s.coins = 60000;
  s.day = 32;
  s.discovered = CATALOG.slice(0, 32).map((i) => i.id);
  s.bag = Object.fromEntries(CATALOG.map((i) => [i.id, 2]));
  if (kind === 'legacy') {
    return migrateSave({
      ...s,
      version: undefined,
      shovel: true,
      detector: true,
      beachFinds: [
        {
          uid: 'legacy-shell',
          itemId: 'pink-scallop',
          method: 'surface',
          x: 0,
          z: 0,
        },
        {
          uid: 'legacy-buried',
          itemId: 'golden-ring',
          method: 'detector',
          x: 3,
          z: -3,
        },
      ],
      shelf: [
        {
          uid: 1,
          itemId: 'pink-scallop',
          x: -2.1,
          y: 1.18,
          z: -2.55,
          rotation: 0.2,
        },
      ],
      purchases: [],
      equipment: [],
    });
  }
  s.equipment = UPGRADES.map((u) => u.id);
  s.purchases = kind === 'cottage' ? DECOR.map((u) => u.id) : ['paintingKit'];
  s.artwork = Array.from({ length: 1024 }, (_, j) => {
    const x = j % 32,
      y = Math.floor(j / 32);
    if (y > 23) return '#d9c6a6';
    if ((x - 22) ** 2 + (y - 9) ** 2 < 20) return '#e9c676';
    if (y > 18 + Math.sin(x * 0.35) * 2) return '#88bbb1';
    return '#b6d9df';
  });
  s.shelf = shelfSlots(s)
    .slice(0, kind === 'cottage' ? 70 : 8)
    .map((p, j) => ({
      ...p,
      uid: j + 1,
      itemId: CATALOG[(j * 7) % 200].id,
      rotation: j * 0.13,
    }));
  return s;
}
