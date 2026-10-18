export const UPGRADES = [
  {
    id: 'pouch',
    name: 'Beach Pouch',
    cost: 100,
    requires: [],
    detail: 'A tidy backpack with quick selling for spare copies.',
  },
  {
    id: 'shovel',
    name: 'Small Shovel',
    cost: 175,
    requires: [],
    detail: 'Unearth the five daily buried discoveries.',
  },
  {
    id: 'brush',
    name: 'Delicate Shell Brush',
    cost: 350,
    requires: ['shovel'],
    detail: 'Gently reveal fragile shells at specialized sites.',
  },
  {
    id: 'sifter',
    name: 'Sand Sifter',
    cost: 700,
    requires: ['shovel'],
    detail: 'Find tiny glass, beads and delicate jewelry.',
  },
  {
    id: 'scoop',
    name: 'Shell Scoop',
    cost: 1200,
    requires: ['brush'],
    detail: 'Reach intricate coastal shells and ocean wonders.',
  },
  {
    id: 'trowel',
    name: 'Reinforced Trowel',
    cost: 2000,
    requires: ['shovel'],
    detail: 'Dig deeper deposits. Required for the cave path.',
  },
  {
    id: 'probe',
    name: 'Magnetic Probe',
    cost: 3200,
    requires: ['trowel'],
    detail: 'Find metallic keepsakes at specialized sites.',
  },
  {
    id: 'detector',
    name: 'Metal Detector',
    cost: 6500,
    requires: ['probe'],
    detail: 'Scan with F. Moderate Rare and Epic improvement on future tides.',
  },
  {
    id: 'coil',
    name: 'Enhanced Detector Coil',
    cost: 12000,
    requires: ['detector'],
    detail: 'Longer scans with a modest Epic and Legendary improvement.',
  },
  {
    id: 'professional',
    name: 'Professional Detector',
    cost: 18000,
    requires: ['coil'],
    detail: 'Best range and a small additional rarity improvement.',
  },
  {
    id: 'caveAccess',
    name: 'Cave Access',
    cost: 8000,
    requires: ['trowel'],
    unique: 30,
    detail: 'Open the seaside gate after discovering 30 unique treasures.',
  },
  {
    id: 'lantern',
    name: 'Mosslight Lantern',
    cost: 2400,
    requires: ['caveAccess'],
    detail: 'Illuminate the hidden grotto and its mineral deposits.',
  },
  {
    id: 'pick',
    name: 'Geological Pick',
    cost: 4800,
    requires: ['lantern'],
    detail: 'Open crystal seams and ancient relic deposits.',
  },
];
export const SHOP_COLORS = {
  cream: '#fff0df',
  blush: '#f7d7d9',
  blue: '#d0e9ef',
  sage: '#dbe8d4',
  lavender: '#e8dbf0',
  peach: '#f5d4bf',
  butter: '#f5e7ad',
  rose: '#b97d91',
  lagoon: '#6c9996',
  midnight: '#777b9f',
};
export const WOODS = {
  maple: '#cda579',
  white: '#eee8dc',
  walnut: '#81624e',
  rosewood: '#ae8187',
  driftwood: '#b8b3a2',
};
export const DECOR = [
  ...Object.keys(SHOP_COLORS)
    .slice(5)
    .map((id, i) => ({
      id: 'paint-' + id,
      name: id + ' wall paint',
      cost: 80 + i * 35,
      kind: 'wall',
      option: id,
    })),
  {
    id: 'wallpaper-botanical',
    name: 'Botanical wallpaper',
    cost: 300,
    kind: 'wallpaper',
    option: 'botanical',
  },
  {
    id: 'wallpaper-stripe',
    name: 'Ribbon wallpaper',
    cost: 180,
    kind: 'wallpaper',
    option: 'stripe',
  },
  {
    id: 'wallpaper-stars',
    name: 'Moonlit wallpaper',
    cost: 500,
    kind: 'wallpaper',
    option: 'stars',
  },
  {
    id: 'floor-oak',
    name: 'Honey oak flooring',
    cost: 350,
    kind: 'floor',
    option: 'oak',
  },
  {
    id: 'floor-check',
    name: 'Sage checkerboard',
    cost: 550,
    kind: 'floor',
    option: 'check',
  },
  {
    id: 'floor-marble',
    name: 'Rose marble floor',
    cost: 700,
    kind: 'floor',
    option: 'marble',
  },
  {
    id: 'secondShelf',
    name: 'Second display shelf',
    cost: 450,
    detail: '18 additional places beside the original shelves.',
  },
  {
    id: 'largeShelf',
    name: 'Larger display shelves',
    cost: 900,
    requires: ['secondShelf'],
    detail: 'A broad fourth tier with 12 additional places.',
  },
  {
    id: 'paintingKit',
    name: 'Painting kit',
    cost: 700,
    detail: 'Paint, save and hang your own little work of art.',
  },
  {
    id: 'wallGallery',
    name: 'Decorative wall gallery',
    cost: 1100,
    detail: 'Three framed seaside miniatures.',
  },
  {
    id: 'cabinet',
    name: 'Glass display cabinet',
    cost: 1700,
    detail: 'A brass and glass cabinet with 12 display places.',
  },
  {
    id: 'roomExpansion',
    name: 'Cottage room expansion',
    cost: 3500,
    detail: 'Open the sunroom alcove and 12 new display places.',
  },
  {
    id: 'deluxeGallery',
    name: 'Deluxe collection gallery',
    cost: 7500,
    requires: ['roomExpansion'],
    detail: 'A full gallery wall with 24 extra display places.',
  },
  {
    id: 'rug-seafoam',
    name: 'Seafoam woven rug',
    cost: 220,
    kind: 'rug',
    option: 'seafoam',
  },
  {
    id: 'rug-rose',
    name: 'Rose petal rug',
    cost: 180,
    kind: 'rug',
    option: 'rose',
  },
  {
    id: 'accent-lilac',
    name: 'Lilac furniture cushions',
    cost: 200,
    kind: 'accent',
    option: 'lilac',
  },
  {
    id: 'accent-sage',
    name: 'Sage furniture cushions',
    cost: 200,
    kind: 'accent',
    option: 'sage',
  },
  {
    id: 'light-moon',
    name: 'Moonlight lamps',
    cost: 400,
    kind: 'lighting',
    option: 'moon',
  },
  {
    id: 'plants',
    name: 'Little botanical garden',
    cost: 280,
    detail: 'Three potted plants for your cottage.',
  },
  {
    id: 'ornaments',
    name: 'Seaside ornaments',
    cost: 240,
    detail: 'A trio of porcelain ocean keepsakes.',
  },
  {
    id: 'wood-rosewood',
    name: 'Rosewood shelf finish',
    cost: 170,
    kind: 'wood',
    option: 'rosewood',
  },
  {
    id: 'wood-driftwood',
    name: 'Driftwood shelf finish',
    cost: 140,
    kind: 'wood',
    option: 'driftwood',
  },
];
export const owns = (s, id) =>
  !!s[id] || s.equipment?.includes(id) || s.purchases?.includes(id);
export function purchaseReason(s, u) {
  if (!u) return 'Unknown upgrade';
  if (owns(s, u.id)) return 'Owned';
  const missing = (u.requires || []).filter((id) => !owns(s, id));
  if (missing.length)
    return (
      'Requires ' +
      missing
        .map(
          (id) => [...UPGRADES, ...DECOR].find((u) => u.id === id)?.name || id,
        )
        .join(', ')
    );
  if (u.unique && new Set(s.discovered).size < u.unique)
    return `Discover ${u.unique} unique treasures`;
  return s.coins < u.cost ? 'Not enough sand dollars' : '';
}
export function purchase(s, id) {
  const u = [...UPGRADES, ...DECOR].find((x) => x.id === id);
  if (purchaseReason(s, u)) return false;
  s.coins -= u.cost;
  if (UPGRADES.includes(u)) {
    s.equipment.push(id);
    s[id] = true;
  } else {
    s.purchases.push(id);
    if (u.kind) s[u.kind] = u.option;
  }
  return true;
}
export const equipmentState = (s) =>
  Object.fromEntries(UPGRADES.map((u) => [u.id, owns(s, u.id)]));
export const canDiscover = (s, m) =>
  m === 'surface' ||
  (m === 'cave' && owns(s, 'caveAccess')) ||
  owns(s, m) ||
  (m === 'probe' && owns(s, 'detector'));
