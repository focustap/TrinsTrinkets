import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createBeachScene } from '../src/world.js';
import { createCaveScene } from '../src/cave.js';
import { createMoonpoolScene } from '../src/moonpool.js';
import { cragGeometry, coastalFir, autumnShrub } from '../src/landscape.js';

test('dense landscape remains batched, indexed and within a practical geometry budget', () => {
  const w = createBeachScene();
  let vertices = 0;
  w.scene.traverse((o) => {
    if (o.isMesh) vertices += o.geometry.attributes.position.count;
  });
  assert.ok(
    vertices < 600000,
    `${vertices} beach vertices exceeds the scenery budget`,
  );
  for (const name of ['coastal-forest', 'autumn-banks', 'coastal-verge']) {
    const group = w.scene.getObjectByName(name);
    assert.ok(group?.children.length > 0);
    assert.ok(
      group.children.length <= 3,
      'a whole grove needs at most three material batches',
    );
    for (const mesh of group.children) {
      assert.ok(
        mesh.geometry.index,
        'foliage batching must preserve shared vertices',
      );
      assert.ok(mesh.geometry.attributes.normal);
      assert.ok(mesh.geometry.attributes.uv);
      for (const n of mesh.geometry.attributes.position.array)
        assert.ok(Number.isFinite(n));
    }
  }
});

test('forest foliage leaves the full cave approach clear at player eye height', () => {
  const w = createBeachScene();
  w.setGate(true);
  w.scene.updateMatrixWorld(true);
  const meshes = [];
  w.scene.traverseVisible((o) => {
    if (o.isMesh) meshes.push(o);
  });
  for (const z of [0.2, 1, 1.8]) {
    const ray = new T.Raycaster(
      new T.Vector3(12.7, 1.7, z),
      new T.Vector3(1, 0, 0),
      0,
      6.5,
    );
    assert.equal(
      ray.intersectObjects(meshes, false).length,
      0,
      `cave route blocked at z=${z}`,
    );
  }
});

test('authored rock and foliage variants have finite geometry and visible volume', () => {
  for (let j = 0; j < 9; j++) {
    const g = cragGeometry(j);
    assert.ok(g.attributes.color);
    for (const n of g.attributes.position.array) assert.ok(Number.isFinite(n));
  }
  for (let j = 0; j < 5; j++)
    for (const object of [coastalFir(j), autumnShrub(j)]) {
      const size = new T.Box3().setFromObject(object).getSize(new T.Vector3());
      assert.ok(
        size.x > 0.3 && size.z > 0.3 && size.y > 0.5,
        'foliage needs a physical canopy, not a flat card',
      );
    }
});

test('painted materials only request vertex colors where the geometry supplies them', () => {
  for (const w of [
    createBeachScene(),
    createCaveScene(),
    createMoonpoolScene(),
  ]) {
    w.scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        if (m.vertexColors)
          assert.ok(
            o.geometry.attributes.color,
            `${o.name || o.geometry.type} would render black without vertex colors`,
          );
    });
  }
});
