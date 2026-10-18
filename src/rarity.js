export const RARITIES = Object.freeze({
  Common: { weight: 52.55, color: '#9c8f83' },
  Uncommon: { weight: 21.4, color: '#6d997b' },
  Rare: { weight: 20, color: '#588bb8' },
  Epic: { weight: 5, color: '#a080bf' },
  Legendary: { weight: 1, color: '#bf9437' },
  Mythic: { weight: 0.05, color: '#d18eb6' },
});
export function rarityWeights(e = {}) {
  return Object.fromEntries(
    Object.entries(RARITIES).map(([r, d]) => [
      r,
      d.weight *
        ({
          Rare: 1 + (e.detector ? 0.08 : 0) + (e.professional ? 0.03 : 0),
          Epic:
            1 +
            (e.detector ? 0.1 : 0) +
            (e.coil ? 0.12 : 0) +
            (e.professional ? 0.05 : 0),
          Legendary: 1 + (e.coil ? 0.12 : 0) + (e.professional ? 0.08 : 0),
          Mythic: 1,
        }[r] || 1),
    ]),
  );
}
export function eligibleItems(
  catalog,
  { method, methods, environment = 'beach', equipment = {} },
) {
  return catalog.filter(
    (i) =>
      i.environment === environment &&
      (methods || [method]).includes(i.method) &&
      (i.rarity !== 'Mythic' ||
        environment !== 'cave' ||
        (equipment.caveAccess && equipment.pick)) &&
      (environment !== 'moonpool' || equipment.moonpoolAccess),
  );
}
export function rollTreasure(catalog, pool, rng = Math.random) {
  const items = eligibleItems(catalog, pool),
    weights = rarityWeights(pool.equipment),
    tiers = Object.keys(weights).filter((r) =>
      items.some((i) => i.rarity === r),
    );
  if (!tiers.length) return null;
  let roll = rng() * tiers.reduce((sum, r) => sum + weights[r], 0);
  const rarity = tiers.find((r) => (roll -= weights[r]) < 0) || tiers.at(-1),
    choices = items.filter((i) => i.rarity === rarity);
  return choices[
    Math.min(choices.length - 1, Math.floor(rng() * choices.length))
  ];
}
