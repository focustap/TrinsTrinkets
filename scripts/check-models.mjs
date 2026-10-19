import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CATALOG } from '../src/catalog.js';
import { createTreasure } from '../src/treasures.js';
import { createShelfScene, createBeachScene } from '../src/world.js';
import { createMoonpoolScene } from '../src/moonpool.js';
import { fresh } from '../src/save.js';
import { DECOR } from '../src/progression.js';
import { shelfSlots } from '../src/shelves.js';

let vertexCount = 0;
let drawCalls = 0;
for (const item of CATALOG) {
  const model = createTreasure(item);
  drawCalls += model.children.length;
  assert.ok(
    model.children.length <= 12,
    item.id + ' exceeds the model draw-call budget',
  );
  const reused = createTreasure(item);
  assert.notEqual(model, reused, 'placements need independent transforms');
  assert.equal(
    model.children[0].geometry,
    reused.children[0].geometry,
    'geometry must be cached across placements',
  );
  assert.equal(
    model.userData.itemId,
    item.id,
    item.id + ' should preserve its catalog ID',
  );
  assert.ok(model.children.length > 0, item.id + ' must have visible geometry');
  const bbox = new THREE.Box3().setFromObject(model);
  assert.equal(bbox.isEmpty(), false, item.id + ' must have nonempty bounds');
  assert.ok(
    Math.abs(bbox.min.y) < 0.005,
    item.id + ' should rest exactly on the shelf surface',
  );
  const size = bbox.getSize(new THREE.Vector3());
  assert.ok(
    size.x > 0.1 && size.y > 0.04 && size.z > 0.015,
    item.id + ' must be a sculpted 3D shape',
  );
  assert.ok(
    Math.max(size.x, size.y, size.z) < 1.9,
    item.id + ' should fit on shelf',
  );
  model.traverse((obj) => {
    if (!obj.isMesh) return;
    const positions = obj.geometry.getAttribute('position');
    assert.ok(positions?.count > 0, item.id + ' has geometry vertices');
    for (let i = 0; i < positions.count; i++)
      for (let k = 0; k < 3; k++)
        assert.ok(
          Number.isFinite(positions.array[i * 3 + k]),
          item.id + ' has invalid vertex',
        );
    vertexCount += positions.count;
  });
}
assert.equal(CATALOG.length, 230, 'all catalog items should be tested');
console.log(
  'Verified',
  CATALOG.length,
  'treasures with',
  vertexCount,
  'finite vertices.',
);

const shelf = createShelfScene();
console.log('Treasure draw calls across the entire catalog:', drawCalls);
assert.equal(
  shelf.slotPositions.length,
  18,
  'original shelf capacity is preserved',
);
shelf.setWall('#f7d7d9');
shelf.setWood('#cda579');
shelf.setLights(false);
shelf.setLights(true);
const displayed = shelf.addDisplay(CATALOG[0], {
  uid: 123,
  x: 0,
  y: shelf.heights[0],
  z: -2.55,
  rotation: 0.5,
});
assert.equal(
  displayed.userData.placementUid,
  123,
  'shelf selection must keep saved placement IDs',
);
assert.ok(
  Math.abs(displayed.position.y - shelf.heights[0]) < 0.001,
  'shelf item must keep saved coordinates',
);
shelf.clearDisplay();
assert.equal(shelf.displays.children.length, 0, 'clearing shelf display works');
shelf.scene.traverse((obj) => {
  if (!obj.isMesh || !obj.geometry) return;
  const p = obj.geometry.attributes.position;
  if (!p) return;
  for (let k = 0; k < p.array.length; k++)
    assert.ok(Number.isFinite(p.array[k]), 'invalid cottage vertex');
});
console.log(
  'Verified display room, all 18 slots, decoration controls and saved placement mapping.',
);

const expanded = fresh();
expanded.purchases = DECOR.map((u) => u.id);
expanded.artwork = Array(1024).fill('#eac1d5');
shelf.customize(expanded);
shelf.scene.updateMatrixWorld(true);
assert.equal(shelf.slotPositions.length, 96);
const down = new THREE.Vector3(0, -1, 0);
const ray = new THREE.Raycaster();
const surfaces = [];
shelf.scene.traverse((obj) => {
  if (obj.isMesh) surfaces.push(obj);
});
for (const slot of shelfSlots(expanded)) {
  ray.set(new THREE.Vector3(slot.x, slot.y + 0.03, slot.z), down);
  const hit = ray.intersectObjects(surfaces, false)[0];
  assert.ok(hit, 'every expanded slot needs a physical shelf surface');
  assert.ok(Math.abs(hit.point.y - slot.y) < 0.025, JSON.stringify(slot));
}
for (const item of CATALOG) {
  const model = createTreasure(item);
  for (const angle of [0, Math.PI / 4, Math.PI / 2]) {
    model.rotation.y = angle;
    const size = new THREE.Box3()
      .setFromObject(model)
      .getSize(new THREE.Vector3());
    assert.ok(
      size.x <= 0.75 && size.z <= 0.75,
      item.id + ' must rotate without clipping adjacent treasures',
    );
  }
}
console.log(
  'Verified all 96 physical shelf surfaces, artwork texture, and rotation clearance for 230 models.',
);

// Rays through the reported gaps must hit actual solid architecture.
const beach = createBeachScene();
beach.scene.updateMatrixWorld(true);
const exterior = beach.scene.getObjectByName('cottage-exterior');
for (const [x, y] of [
  [0, 4.2],
  [0, 5.5],
  [0, 6.35],
  [-1.5, 4.8],
  [1.5, 4.8],
]) {
  ray.set(new THREE.Vector3(-7.5 + x, y, 0), new THREE.Vector3(0, 0, 1));
  assert.ok(
    ray.intersectObject(exterior, true).length,
    'cottage gable and roof ridge must be closed',
  );
}
const moonpool = createMoonpoolScene();
moonpool.scene.updateMatrixWorld(true);
const arch = moonpool.scene.getObjectByName('moonpool-arch-frame');
for (const x of [-2.3, 2.3])
  for (const y of [0.25, 0.8, 1.5, 2.2, 2.4]) {
    ray.set(new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, -1));
    assert.ok(
      ray.intersectObject(arch).length,
      'Moonpool arch must connect continuously to its pillars',
    );
  }
ray.set(new THREE.Vector3(0, 1.7, -10), new THREE.Vector3(0, 0, -1));
assert.equal(
  ray.intersectObject(arch).length,
  0,
  'the opening between pillars stays clear',
);
console.log(
  'Verified solid cottage gables, closed roof ridge and continuous Moonpool arch supports.',
);
