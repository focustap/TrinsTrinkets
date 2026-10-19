import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { CATALOG, ITEMS } from '../src/catalog.js';
import { createBeachScene } from '../src/world.js';
import { createCaveScene } from '../src/cave.js';
import { createMoonpoolScene } from '../src/moonpool.js';
import { GROUND, createSurface, restOnSurface } from '../src/surfaces.js';

test('every collectible rests on its actual biome surface and stays there during animation', () => {
  const worlds = {
    beach: createBeachScene(),
    cave: createCaveScene(),
    moonpool: createMoonpoolScene(),
  };
  for (const [j, item] of CATALOG.entries()) {
    const world = worlds[item.environment];
    const [x, z] =
      item.environment === 'moonpool'
        ? [
            [0, 3],
            [0.8, -10],
            [-0.35, -10.15],
            [8, -3],
          ][j % 4]
        : [1, -5];
    const find = world.spawn(
      item,
      item.environment === 'beach' ? 'surface' : item.method,
      x,
      z,
      'test-' + item.id,
    );
    const model = find.getObjectByName('discovery-model');
    assert.ok(model, item.id);
    const before = model.position.clone();
    for (const time of [0, 2, 17]) {
      world.update(time, true, 12, 0.016);
      world.scene.updateMatrixWorld(true);
      const bottom = new T.Box3().setFromObject(model).min.y;
      const support = world.surface.heightAt(x, z);
      assert.ok(
        bottom <= support + 0.001 && bottom >= support - 0.02,
        `${item.id}: bottom ${bottom}, support ${support}`,
      );
      assert.ok(
        model.position.equals(before),
        'world keepsakes must not bob or lift away',
      );
    }
    world.remove(find);
    assert.equal(
      find.userData.shadow.parent,
      null,
      'collecting removes its contact shadow',
    );
  }
});

test('scenery roots touch real ground, including rotated leaves and weathered driftwood', () => {
  for (const world of [
    createBeachScene(),
    createCaveScene(),
    createMoonpoolScene(),
  ]) {
    world.scene.updateMatrixWorld(true);
    let checked = 0;
    world.scene.traverse((o) => {
      if (!o.userData.groundContact) return;
      const p = o.getWorldPosition(new T.Vector3()),
        bottom = new T.Box3().setFromObject(o).min.y;
      const support = world.surface.heightAt(p.x, p.z, o);
      assert.ok(
        bottom <= support + 0.001 && bottom >= support - 0.035,
        `${o.name || o.type} has a detached root`,
      );
      checked++;
    });
    assert.ok(checked > 5, 'each environment must include rooted scenery');
  }
});

test('pool beds and stepping stones provide distinct physical support heights', () => {
  const world = createMoonpoolScene();
  assert.ok(
    world.surface.heightAt(-5.2, -1) < GROUND.moonpool - 0.05,
    'pool bed sits below the dry bank',
  );
  assert.ok(
    world.surface.heightAt(0, 6) > GROUND.moonpool,
    'a real path stone supports finds above the sand',
  );
  const support = new T.Mesh(new T.BoxGeometry(2, 0.3, 2));
  support.position.y = 0.8;
  const surface = createSurface(0, [support]);
  const parent = new T.Group();
  parent.position.set(1, 2, 1);
  const object = new T.Mesh(new T.BoxGeometry(0.2, 0.4, 0.2));
  parent.add(object);
  restOnSurface(object, surface, 0);
  object.updateWorldMatrix(true, true);
  assert.ok(
    Math.abs(new T.Box3().setFromObject(object).min.y - 0.95) < 1e-6,
    'parent transforms cannot reintroduce a gap',
  );
});

test('detector shadows remain hidden until scanning, and cosmetic scenery stays stable across reloads', () => {
  const a = createBeachScene(),
    b = createBeachScene();
  const logA = a.scene.getObjectByName('weathered-driftwood'),
    logB = b.scene.getObjectByName('weathered-driftwood');
  assert.ok(logA.position.equals(logB.position));
  assert.equal(logA.rotation.y, logB.rotation.y);
  const f = a.spawn(ITEMS['golden-ring'], 'detector', 0, 0, 'buried');
  assert.equal(f.visible, false);
  assert.equal(f.userData.shadow.visible, false);
  a.update(1, true, 12);
  assert.equal(f.visible, true);
  assert.equal(f.userData.shadow.visible, true);
  a.update(2, false, 12);
  assert.equal(f.visible, false);
  assert.equal(f.userData.shadow.visible, false);
});
