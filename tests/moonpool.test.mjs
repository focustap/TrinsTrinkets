import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { CATALOG, ITEMS } from '../src/catalog.js';
import { fresh, migrateSave, loadSave, writeSave } from '../src/save.js';
import {
  purchase,
  purchaseReason,
  UPGRADES,
  caveDiscoveryCount,
  equipmentState,
} from '../src/progression.js';
import { ensureTides, advanceDay, takeFind } from '../src/tide.js';
import { eligibleItems, rarityWeights, RARITIES } from '../src/rarity.js';
import { stepThrough } from '../src/locations.js';
import { createRockPassage } from '../src/passage.js';
import { createBeachScene } from '../src/world.js';
import { createCaveScene } from '../src/cave.js';
import { createMoonpoolScene } from '../src/moonpool.js';
import { createTreasure } from '../src/treasures.js';
import {
  DECOR_REWARDS,
  claimDecorRewards,
  toggleReward,
  rewardEnabled,
} from '../src/rewards.js';
import { createRewardDecor } from '../src/reward-art.js';
import { sellTreasure, claimCompletedSets } from '../src/inventory.js';
import { grantBiomeAccess } from '../src/devtools.js';
import { seeded, memoryStorage } from './helpers.mjs';

const moon = CATALOG.filter((i) => i.environment === 'moonpool');
const caveIds = CATALOG.filter((i) => i.environment === 'cave').map(
  (i) => i.id,
);
const ready = () =>
  Object.assign(fresh(), {
    coins: 15000,
    equipment: ['caveAccess', 'pick'],
    discovered: caveIds.slice(0, 15),
  });

test('all 200 existing catalog definitions remain byte-for-byte stable; 30 exclusive authored additions', () => {
  // Digest of JSON.stringify(CATALOG) from main at 8988d0a, before this expansion.
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify(CATALOG.slice(0, 200)))
      .digest('hex'),
    '9aee7c5e0accb090c0863ab3be6b70e96a6c70ab220054ed93a1a3773b6a3994',
  );
  assert.equal(moon.length, 30);
  assert.deepEqual(
    Object.fromEntries(
      ['shells', 'minerals', 'jewelry', 'ancient'].map((k) => [
        k,
        moon.filter((i) => i.kind === k).length,
      ]),
    ),
    { shells: 10, minerals: 8, jewelry: 6, ancient: 6 },
  );
  assert.equal(new Set(moon.map((i) => i.type)).size, 30);
  assert.equal(new Set(moon.map((i) => i.description)).size, 30);
  assert.deepEqual(
    new Set(moon.map((i) => i.rarity)),
    new Set(Object.keys(RARITIES)),
  );
  const hashes = moon.map((i) => {
    const hash = createHash('sha256');
    createTreasure(i).traverse((o) => {
      if (o.isMesh)
        hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));
    });
    return hash.digest('hex');
  });
  assert.equal(new Set(hashes).size, 30, 'no recolored duplicate geometry');
});

test('Moonpool unlock requires cave access, pick, 15 different cave-native finds and exactly 12000', () => {
  const u = UPGRADES.find((u) => u.id === 'moonpoolAccess');
  for (const field of ['caveAccess', 'pick', 'caveUnique', 'money']) {
    const s = ready();
    if (field === 'caveUnique')
      s.discovered = [
        ...caveIds.slice(0, 14),
        ...Array(20).fill(caveIds[0]),
        ...CATALOG.filter((i) => i.environment === 'beach').map((i) => i.id),
        'unknown',
      ];
    else if (field === 'money') s.coins = 11999;
    else s.equipment = s.equipment.filter((id) => id !== field);
    const before = structuredClone(s);
    assert.ok(purchaseReason(s, u));
    assert.equal(purchase(s, 'moonpoolAccess'), false);
    assert.deepEqual(s, before);
  }
  const s = ready();
  assert.equal(caveDiscoveryCount(s), 15);
  assert.equal(purchase(s, 'moonpoolAccess'), true);
  assert.equal(s.coins, 3000);
  assert.equal(purchase(s, 'moonpoolAccess'), false);
  assert.equal(s.coins, 3000);
  assert.ok(purchase(s, 'pearlBrush'));
  assert.ok(purchase(s, 'crystalScoop'));
  const cheat = ready();
  cheat.devInfiniteMoney = true;
  cheat.discovered = [];
  assert.equal(
    purchase(cheat, 'moonpoolAccess'),
    false,
    'money shortcut cannot bypass discoveries',
  );
});

test('v2 saves retain inventory, cave ownership, placements and both existing tides without rerolling', () => {
  const old = ready();
  old.version = 2;
  old.equipment.push('lantern');
  ensureTides(old, seeded(17));
  old.bag = { 'sand-dollar': 3 };
  old.shelf = [
    { uid: 1, itemId: 'sand-dollar', x: 0, y: 1.18, z: -2.55, rotation: 0.4 },
  ];
  for (const k of ['moonpoolFinds', 'biome', 'rewardDecor', 'disabledRewards'])
    delete old[k];
  const s = migrateSave(old);
  assert.equal(s.version, 3);
  assert.equal(s.moonpoolFinds, null);
  for (const k of [
    'coins',
    'day',
    'bag',
    'shelf',
    'equipment',
    'discovered',
    'beachFinds',
    'caveFinds',
  ])
    assert.deepEqual(s[k], old[k]);
  ensureTides(s, () => {
    throw Error('must not roll existing tides');
  });
  assert.equal(s.biome, 'beach');
  assert.equal(s.moonpoolFinds, null);
});

test('Moonpool tide persists through travel, sale, reload and exhaustion; only sleep refreshes all biomes', () => {
  let s = ready();
  ensureTides(s, seeded(12));
  assert.equal(s.moonpoolFinds, null);
  purchase(s, 'moonpoolAccess');
  ensureTides(s, seeded(19));
  assert.equal(s.moonpoolFinds.length, 10);
  assert.ok(
    s.moonpoolFinds.every((f) => ITEMS[f.itemId].environment === 'moonpool'),
  );
  const f = s.moonpoolFinds[0],
    found = takeFind(s, f.uid, 'moonpool');
  assert.ok(found);
  assert.equal(takeFind(s, f.uid, 'moonpool'), null);
  assert.ok(s.discovered.includes(found.id));
  assert.equal(s.bag[found.id], 1);
  s.shelf = [
    { uid: 2, itemId: found.id, x: 0, y: 1.18, z: -2.55, rotation: 0 },
  ];
  assert.equal(sellTreasure(s, found.id), false);
  s.shelf = [];
  assert.equal(sellTreasure(s, found.id), true);
  assert.ok(s.discovered.includes(found.id));
  const tides = structuredClone([s.beachFinds, s.caveFinds, s.moonpoolFinds]),
    storage = memoryStorage();
  s.biome = 'moonpool';
  for (let n = 0; n < 10; n++) {
    writeSave(storage, s);
    s = loadSave(storage).state;
    ensureTides(s, () => {
      throw Error('reload rolled a find');
    });
    assert.deepEqual([s.beachFinds, s.caveFinds, s.moonpoolFinds], tides);
    assert.equal(s.biome, 'moonpool');
  }
  s.moonpoolFinds = [];
  s = migrateSave(s);
  ensureTides(s);
  assert.deepEqual(s.moonpoolFinds, []);
  advanceDay(s, seeded(23));
  assert.equal(s.day, 2);
  assert.deepEqual(
    [s.beachFinds.length, s.caveFinds.length, s.moonpoolFinds.length],
    [18, 12, 10],
  );
  assert.ok(s.moonpoolFinds.every((f) => f.uid !== tides[2][0].uid));
});

test('all Moonpool pools include all six rarity tiers and retain the global Mythic probability', () => {
  const s = ready();
  assert.equal(
    eligibleItems(CATALOG, { method: 'moonpool', environment: 'moonpool' })
      .length,
    0,
  );
  s.equipment = UPGRADES.map((u) => u.id);
  const equipment = equipmentState(s);
  for (const method of ['moonpool', 'pearlBrush', 'crystalScoop']) {
    const pool = eligibleItems(CATALOG, {
      method,
      methods: ['moonpool', method],
      environment: 'moonpool',
      equipment,
    });
    assert.equal(new Set(pool.map((i) => i.rarity)).size, 6);
    assert.ok(pool.every((i) => i.environment === 'moonpool'));
  }
  const w = rarityWeights(equipment);
  assert.equal(w.Mythic, 0.05);
  assert.ok(w.Mythic / Object.values(w).reduce((a, b) => a + b) < 0.00051);
});

test('both carved passages animate visual and collision state together and snap open for existing owners', () => {
  for (const glowing of [false, true]) {
    const p = createRockPassage({ glowing });
    assert.equal(p.canTraverse(), false);
    assert.ok(p.blocker.visible);
    p.setOpen(true, true);
    p.update(0.3);
    assert.equal(p.canTraverse(), false);
    assert.ok(p.blocker.position.x > 0);
    p.update(1);
    assert.equal(p.canTraverse(), true);
    assert.equal(p.blocker.visible, false);
    assert.ok(p.arch.visible);
    p.setOpen(false);
    assert.equal(p.canTraverse(), false);
    assert.ok(p.blocker.visible);
    p.setOpen(true);
    assert.equal(p.canTraverse(), true);
    assert.equal(p.blocker.visible, false);
  }
});

test('actual beach and cave scenery leave an unobstructed eye-level opening after unlocking', () => {
  for (const [w, p, origin, dir] of [
    [
      createBeachScene(),
      'entrance',
      new T.Vector3(12.7, 1.7, 1),
      new T.Vector3(1, 0, 0),
    ],
    [
      createCaveScene(),
      'moonpoolPassage',
      new T.Vector3(0, 1.7, -20),
      new T.Vector3(0, 0, -1),
    ],
  ]) {
    const ray = new T.Raycaster(origin, dir, 0, 6.5);
    const hits = () => {
      w.scene.updateMatrixWorld(true);
      const meshes = [];
      w.scene.traverseVisible((o) => {
        if (o.isMesh) meshes.push(o);
      });
      return ray.intersectObjects(meshes, false);
    };
    assert.ok(hits().length, 'closed passage must be visually sealed');
    if (p === 'entrance') w.setGate(true);
    else w[p].setOpen(true);
    assert.equal(
      hits().length,
      0,
      'surrounding scenery must not obscure the open route',
    );
    assert.ok(w[p].arch.visible);
  }
});

test('movement blocks sealed passages and supports beach ↔ cave ↔ Moonpool', () => {
  const p = { x: 14.3, z: 1 };
  assert.equal(stepThrough('beach', p, { x: 16, z: 1 }).x, 14.4);
  assert.equal(
    stepThrough('beach', p, { x: 18.1, z: 1 }, { beachOpen: true }).to,
    'cave',
  );
  assert.equal(stepThrough('cave', { x: 0, z: 3 }, { x: 0, z: 4 }).to, 'beach');
  assert.equal(
    stepThrough('cave', { x: 0, z: -23 }, { x: 0, z: -24 }).z,
    -23.2,
  );
  assert.equal(
    stepThrough(
      'cave',
      { x: 0, z: -23 },
      { x: 0, z: -25 },
      { moonpoolOpen: true },
    ).to,
    'moonpool',
  );
  assert.deepEqual(
    stepThrough('moonpool', { x: 0, z: 6.5 }, { x: 0, z: 7.1 }),
    { to: 'cave', from: 'moonpool' },
  );
});

test('50/100/150/200/230 unique discoveries earn permanent decorations, retroactively, without money', () => {
  for (const threshold of [50, 100, 150, 200, 230]) {
    const s = fresh();
    s.discovered = CATALOG.slice(0, threshold - 1).map((i) => i.id);
    s.discovered.push(s.discovered[0], 'future-id');
    claimDecorRewards(s);
    assert.ok(
      !s.rewardDecor.includes(
        DECOR_REWARDS.find((r) => r.count === threshold).id,
      ),
    );
    s.discovered.push(CATALOG[threshold - 1].id);
    claimDecorRewards(s);
    assert.equal(
      s.rewardDecor.filter((id) => id !== 'moonpool-aquarium').length,
      [50, 100, 150, 200, 230].indexOf(threshold) + 1,
    );
    assert.equal(s.coins, 0);
    assert.deepEqual(claimDecorRewards(s), []);
    const id = DECOR_REWARDS.find((r) => r.count === threshold).id;
    assert.ok(rewardEnabled(s, id));
    assert.ok(toggleReward(s, id));
    assert.equal(rewardEnabled(migrateSave(s), id), false);
    assert.equal(toggleReward(s, 'unknown'), false);
  }
});

test('completing Moonpool Wonders earns a physical glowing aquarium once and records a seal', () => {
  const s = fresh();
  s.discovered = moon.map((i) => i.id);
  assert.deepEqual(claimCompletedSets(s), ['Moonpool Wonders']);
  assert.equal(s.coins, 0);
  assert.deepEqual(
    claimDecorRewards(s).map((r) => r.id),
    ['moonpool-aquarium'],
  );
  assert.deepEqual(claimCompletedSets(s), []);
  assert.deepEqual(claimDecorRewards(s), []);
  const model = createRewardDecor(s);
  assert.ok(model.getObjectByName('moonpool-aquarium'));
  model.userData.update(4);
  model.traverse((o) => {
    if (o.isMesh)
      assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));
  });
  toggleReward(s, 'moonpool-aquarium');
  assert.equal(createRewardDecor(s).children.length, 0);
});

test('Moonpool environment and developer grant preserve existing finds, day, money and inventory', () => {
  const s = fresh();
  ensureTides(s, seeded(4));
  s.coins = 23;
  s.bag = { 'sand-dollar': 1 };
  const old = structuredClone(s);
  grantBiomeAccess(s);
  for (const k of ['coins', 'day', 'bag', 'beachFinds', 'caveFinds'])
    assert.deepEqual(s[k], old[k]);
  assert.equal(caveDiscoveryCount(s), 15);
  assert.equal(s.moonpoolFinds.length, 10);
  const w = createMoonpoolScene();
  w.update(10);
  w.scene.traverse((o) => {
    if (o.isMesh)
      assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));
  });
  assert.ok(w.stations.exit);
  for (const i of moon) w.spawn(i, i.method, 0, 0, i.id);
  assert.equal(w.finds.length, 30);
  w.clearFinds();
  assert.equal(w.finds.length, 0);
});
