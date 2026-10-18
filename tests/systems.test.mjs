import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, ITEMS, SETS, COLLECTION_COUNTS } from '../src/catalog.js';
import { CATALOG as ORIGINAL } from '../src/legacy-catalog.js';
import { RARITIES, rollTreasure, rarityWeights } from '../src/rarity.js';
import {
  UPGRADES,
  DECOR,
  purchase,
  canDiscover,
  equipmentState,
} from '../src/progression.js';
import {
  fresh,
  migrateSave,
  loadSave,
  writeSave,
  SAVE_KEY,
} from '../src/save.js';
import {
  ensureTides,
  advanceDay,
  takeFind,
  generateTide,
} from '../src/tide.js';
import { shelfSlots, slotFree, nearestSlot } from '../src/shelves.js';
import { seeded, memoryStorage } from './helpers.mjs';
import {
  sellTreasure,
  sellExtras,
  claimCompletedSets,
} from '../src/inventory.js';

test('exact catalog counts, permanent original IDs, complete authored definitions', () => {
  assert.equal(CATALOG.length, 230);
  assert.equal(new Set(CATALOG.map((i) => i.id)).size, 230);
  assert.equal(new Set(CATALOG.map((i) => i.name)).size, 230);
  SETS.forEach((s, n) =>
    assert.equal(
      CATALOG.filter((i) => i.set === s).length,
      COLLECTION_COUNTS[n],
    ),
  );
  ORIGINAL.forEach((i) => assert.equal(ITEMS[i.id].name, i.name));
  for (const i of CATALOG) {
    assert.ok(RARITIES[i.rarity]);
    assert.ok(i.value >= 10 && i.value <= 6000);
    assert.ok(i.description.length > 30);
    assert.ok(/^#[a-f0-9]{6}$/i.test(i.color));
    assert.ok(i.visual.variant > 0);
    assert.ok(i.visual.motif);
    assert.equal(i.collection, i.set);
    assert.ok(['beach', 'cave', 'moonpool'].includes(i.environment));
    assert.ok(
      i.method === 'surface' ||
        i.method === 'cave' ||
        i.method === 'moonpool' ||
        UPGRADES.some((u) => u.id === i.method),
    );
  }
  assert.ok(new Set(CATALOG.map((i) => i.type)).size >= 30);
  assert.equal(new Set(CATALOG.map((i) => i.description)).size, 230);
});
test('six mutually exclusive rarity tiers match the exact base distribution', () => {
  assert.ok(
    Math.abs(Object.values(RARITIES).reduce((s, d) => s + d.weight, 0) - 100) <
      1e-10,
  );
  const catalog = Object.keys(RARITIES).flatMap((r) =>
      [0, 1, 2, 3].map((k) => ({
        id: r + k,
        rarity: r,
        environment: 'beach',
        method: 'surface',
      })),
    ),
    counts = Object.fromEntries(Object.keys(RARITIES).map((r) => [r, 0])),
    rng = seeded(78233),
    n = 500000;
  for (let j = 0; j < n; j++)
    counts[rollTreasure(catalog, { method: 'surface' }, rng).rarity]++;
  for (const [r, d] of Object.entries(RARITIES)) {
    const expected = d.weight / 100,
      tolerance = Math.max(
        0.00012,
        5 * Math.sqrt((expected * (1 - expected)) / n),
      );
    assert.ok(
      Math.abs(counts[r] / n - expected) < tolerance,
      `${r}: ${counts[r] / n}`,
    );
  }
  const sameTier = new Set();
  for (let j = 0; j < 100; j++)
    sameTier.add(rollTreasure(catalog, { method: 'surface' }, seeded(j)).id);
  assert.ok(sameTier.size > 1);
});
test('missing tiers redistribute proportionally; empty pools return null', () => {
  const items = [
      { id: 'a', rarity: 'Common', method: 'surface', environment: 'beach' },
      { id: 'b', rarity: 'Rare', method: 'surface', environment: 'beach' },
    ],
    rng = seeded(44);
  let rare = 0;
  for (let j = 0; j < 100000; j++)
    rare += rollTreasure(items, { method: 'surface' }, rng).rarity === 'Rare';
  assert.ok(Math.abs(rare / 100000 - 20 / 72.55) < 0.008);
  assert.equal(rollTreasure(items, { method: 'pick' }), null);
});
test('advanced equipment never trivializes Legendary or Mythic odds', () => {
  const w = rarityWeights({ detector: true, coil: true, professional: true }),
    total = Object.values(w).reduce((a, b) => a + b);
  assert.ok(w.Mythic / total < 0.0006);
  assert.ok(w.Legendary / total < 0.0125);
  assert.ok(w.Epic / total < 0.065);
});
test('purchases are atomic, prerequisites apply, optional tools stay optional', () => {
  const s = fresh();
  s.coins = 50000;
  assert.equal(purchase(s, 'detector'), false);
  assert.equal(s.coins, 50000);
  assert.equal(purchase(s, 'shovel'), true);
  assert.equal(s.coins, 49825);
  assert.equal(purchase(s, 'shovel'), false);
  assert.equal(purchase(s, 'trowel'), true);
  assert.equal(purchase(s, 'probe'), true);
  assert.equal(purchase(s, 'detector'), true);
  assert.ok(!s.equipment.includes('sifter'));
  assert.ok(canDiscover(s, 'detector'));
  assert.equal(purchase(s, 'caveAccess'), false);
  s.discovered = CATALOG.slice(0, 30).map((i) => i.id);
  assert.equal(purchase(s, 'caveAccess'), true);
  assert.equal(purchase(s, 'pick'), false);
  assert.equal(purchase(s, 'lantern'), true);
  assert.equal(purchase(s, 'pick'), true);
  const poor = fresh();
  assert.equal(purchase(poor, 'pouch'), false);
  assert.equal(poor.coins, 0);
});
test('v1 migration preserves money, inventory, discoveries, tools, day, tide and placements exactly', () => {
  const old = {
    coins: 437,
    bag: { 'sand-dollar': 4, 'golden-ring': 1, 'future-id': 2 },
    discovered: ['sand-dollar', 'golden-ring'],
    claimed: ['Shells'],
    shovel: true,
    detector: true,
    day: 23,
    beachFinds: [
      {
        uid: 'old-day-23',
        itemId: 'golden-ring',
        method: 'detector',
        x: 4,
        z: -3,
      },
    ],
    shelf: [
      {
        uid: 123456,
        itemId: 'sand-dollar',
        x: -2.1,
        y: 1.18,
        z: -2.55,
        rotation: 0.5,
      },
    ],
    wall: 'blush',
    wood: 'walnut',
    lights: false,
  };
  const s = migrateSave(old);
  for (const k of [
    'coins',
    'bag',
    'discovered',
    'claimed',
    'day',
    'beachFinds',
    'shelf',
    'wall',
    'wood',
    'lights',
  ])
    assert.deepEqual(s[k], old[k], k);
  assert.ok(canDiscover(s, 'shovel'));
  assert.ok(canDiscover(s, 'detector'));
  assert.ok(canDiscover(s, 'probe'));
  assert.deepEqual(migrateSave(s), s);
  assert.equal(s.version, 3);
});
test('invalid and future saves are protected; storage failure never destroys original', () => {
  const store = memoryStorage();
  store.setItem(SAVE_KEY, '{broken');
  const loaded = loadSave(store);
  assert.ok(loaded.error);
  assert.equal(writeSave(store, loaded.state, { blocked: true }).ok, false);
  assert.equal(store.getItem(SAVE_KEY), '{broken');
  assert.throws(() => migrateSave({ version: 999 }));
  assert.throws(() => migrateSave({ beachFinds: 'broken' }));
  assert.equal(
    writeSave(
      {
        setItem() {
          throw Error('full');
        },
      },
      fresh(),
    ).ok,
    false,
  );
  const original = JSON.stringify({
    coins: 80,
    bag: { 'moon-shell': 2 },
    beachFinds: [],
  });
  store.setItem(SAVE_KEY, original);
  const s = loadSave(store);
  assert.equal(writeSave(store, s.state, { original }).ok, true);
  assert.equal(store.getItem(SAVE_KEY + '-backup'), original);
});
test('daily finds retain generated identity across collection, saving and repeated reloads', () => {
  const s = fresh();
  ensureTides(s, seeded(912));
  assert.equal(s.beachFinds.length, 18);
  assert.equal(s.caveFinds.length, 12);
  const start = structuredClone(s.beachFinds),
    f = s.beachFinds[0];
  assert.ok(takeFind(s, f.uid, 'beach'));
  assert.equal(takeFind(s, f.uid, 'beach'), null);
  assert.equal(s.beachFinds.length, 17);
  const store = memoryStorage();
  writeSave(store, s);
  let reloaded = loadSave(store).state;
  for (let j = 0; j < 8; j++) {
    ensureTides(reloaded, seeded(j));
    assert.deepEqual(reloaded.beachFinds, start.slice(1));
    assert.equal(reloaded.day, 1);
    writeSave(store, reloaded);
    reloaded = loadSave(store).state;
  }
  reloaded.beachFinds = [];
  ensureTides(reloaded);
  assert.deepEqual(reloaded.beachFinds, []);
  advanceDay(reloaded, seeded(113));
  assert.equal(reloaded.day, 2);
  assert.equal(reloaded.beachFinds.length, 18);
  assert.ok(
    reloaded.beachFinds.every((f) => !start.some((o) => o.uid === f.uid)),
  );
});
test('tools do not reroll current tide; cave Mythics need cave access and geological pick', () => {
  const s = fresh();
  ensureTides(s, seeded(8));
  const old = structuredClone(s.beachFinds);
  s.coins = 100000;
  purchase(s, 'shovel');
  ensureTides(s);
  assert.deepEqual(s.beachFinds, old);
  const myths = CATALOG.filter(
    (i) => i.environment === 'cave' && i.rarity === 'Mythic',
  );
  for (const myth of myths) {
    const pool = { method: myth.method, environment: 'cave', equipment: {} };
    assert.equal(rollTreasure([myth], pool), null);
    pool.equipment = { caveAccess: true, pick: true };
    assert.equal(rollTreasure([myth], pool).id, myth.id);
  }
  for (let j = 0; j < 100; j++)
    assert.ok(
      generateTide(s, 'beach', seeded(j)).every(
        (f) => ITEMS[f.itemId].environment === 'beach',
      ),
    );
});
test('every treasure has a reachable discovery pool with maximum equipment', () => {
  const s = fresh();
  s.equipment = UPGRADES.map((u) => u.id);
  const available = new Set();
  for (const environment of ['beach', 'cave', 'moonpool'])
    for (let j = 0; j < 50; j++) {
      s.day = j + 1;
      const finds = generateTide(s, environment, seeded(j + 1));
      finds.forEach((f) => available.add(f.method));
    }
  for (const i of CATALOG)
    assert.ok(available.has(i.method), i.id + ' method reachable');
});
test('shelves expand beyond eighteen, snapping avoids collisions, migration retains expanded positions and artwork', () => {
  const s = fresh();
  assert.equal(shelfSlots(s).length, 18);
  s.coins = 50000;
  for (const id of [
    'secondShelf',
    'largeShelf',
    'cabinet',
    'roomExpansion',
    'deluxeGallery',
  ])
    assert.ok(purchase(s, id));
  assert.equal(shelfSlots(s).length, 96);
  const a = nearestSlot(s, { x: 0, y: 1.18, z: -2.55 });
  s.shelf.push({ ...a, itemId: 'sand-dollar', uid: 7, rotation: 0 });
  assert.equal(slotFree(a, s.shelf), false);
  assert.equal(slotFree(a, s.shelf, 7), true);
  assert.notDeepEqual(nearestSlot(s, a), a);
  for (let j = 1; j < 96; j++) {
    const slot = nearestSlot(s, a);
    assert.ok(slot);
    s.shelf.push({ ...slot, itemId: 'sand-dollar', uid: j + 7, rotation: 0 });
  }
  assert.equal(nearestSlot(s, a), null);
  s.artwork = Array(1024).fill('#eac1d5');
  assert.deepEqual(migrateSave(s).shelf, s.shelf);
  assert.deepEqual(migrateSave(s).artwork, s.artwork);
});
test('selling protects displayed pieces; quick selling keeps at least one copy', () => {
  const s = fresh();
  s.bag = { 'sand-dollar': 3, 'pink-scallop': 1 };
  s.shelf = [{ itemId: 'sand-dollar' }, { itemId: 'sand-dollar' }];
  assert.equal(sellTreasure(s, 'sand-dollar'), true);
  assert.equal(sellTreasure(s, 'sand-dollar'), false);
  assert.equal(sellExtras(s), 0);
  assert.equal(s.bag['pink-scallop'], 1);
  assert.equal(s.coins, ITEMS['sand-dollar'].value);
});
test('collection rewards are permanent and paid exactly once', () => {
  const s = fresh();
  s.discovered = CATALOG.filter((i) => i.set === 'Shells').map((i) => i.id);
  assert.deepEqual(claimCompletedSets(s), ['Shells']);
  assert.equal(s.coins, 500);
  assert.deepEqual(claimCompletedSets(s), []);
  assert.equal(s.coins, 500);
});
