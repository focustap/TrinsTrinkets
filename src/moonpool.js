import * as T from 'three';
import { createTreasure } from './treasures.js';
import { ITEMS } from './catalog.js';
const V = (x, y, z) => new T.Vector3(x, y, z);
export function createMoonpoolScene() {
  const scene = new T.Scene();
  scene.background = new T.Color('#aebfda');
  scene.fog = new T.FogExp2('#b9d1dc', 0.011);
  const camera = new T.PerspectiveCamera(67, 1, 0.1, 100);
  camera.position.set(0, 1.7, 5.2);
  camera.rotation.order = 'YXZ';
  camera.rotation.x = -0.06;
  scene.add(new T.HemisphereLight('#e5dffb', '#5b9e9c', 1.7));
  const sun = new T.DirectionalLight('#fff1df', 1.8);
  sun.position.set(-8, 16, 6);
  scene.add(sun);
  const stone = new T.MeshStandardMaterial({
      color: '#a1abae',
      roughness: 0.86,
    }),
    pale = new T.MeshStandardMaterial({ color: '#d0c9c8', roughness: 0.9 });
  const floor = new T.Mesh(new T.PlaneGeometry(29, 31, 24, 24), pale);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.16, -3);
  scene.add(floor);
  const rockGeo = new T.SphereGeometry(1, 18, 12),
    rock = (x, y, z, sx, sy, sz) => {
      const o = new T.Mesh(rockGeo, stone);
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      scene.add(o);
      return o;
    };
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2,
      x = Math.sin(a) * 12,
      z = -3 + Math.cos(a) * 13;
    if (z > 6.2 && Math.abs(x) < 3) continue;
    const y = 0.6 + (k % 4) * 0.26;
    rock(x, y, z, 1.7, y + 1, 1.5);
    if (k % 3 === 0) rock(x * 0.95, y + 1.3, z, 1.3, 1.1, 1.3);
  }
  // A warm, open grotto: pools are below the shallow, walkable shoreline.
  const waters = [],
    caustics = [];
  for (const [x, z, rx, rz] of [
    [-5.2, -1, 3, 4],
    [5.2, -4.5, 3.2, 4.5],
    [0, -10.6, 3.6, 1.5],
  ]) {
    const bed = new T.Mesh(
      new T.CircleGeometry(1, 64),
      new T.MeshStandardMaterial({ color: '#62b9b2', roughness: 0.7 }),
    );
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(x, -0.12, z);
    bed.scale.set(rx, rz, 1);
    scene.add(bed);
    const geo = new T.CircleGeometry(1, 64);
    geo.rotateX(-Math.PI / 2);
    const water = new T.Mesh(
      geo,
      new T.MeshPhysicalMaterial({
        color: '#37bdb8',
        roughness: 0.16,
        metalness: 0.08,
        transparent: true,
        opacity: 0.57,
        clearcoat: 1,
        side: T.DoubleSide,
      }),
    );
    water.scale.set(rx, 1, rz);
    water.position.set(x, -0.025, z);
    scene.add(water);
    waters.push(water);
    // Visible stones under the clear shallows, and luminous lilies at the edges.
    const pebbles = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 1),
      new T.MeshStandardMaterial({ color: '#a9d8cf', roughness: 0.65 }),
      55,
    );
    const pebble = new T.Object3D();
    for (let k = 0; k < 55; k++) {
      const a = k * 2.399,
        r = Math.sqrt((k + 1) / 58) * 0.92;
      pebble.position.set(
        x + Math.sin(a) * rx * r,
        -0.09,
        z + Math.cos(a) * rz * r,
      );
      pebble.scale.set(0.07 + (k % 3) * 0.025, 0.035, 0.09);
      pebble.rotation.y = a;
      pebble.updateMatrix();
      pebbles.setMatrixAt(k, pebble.matrix);
    }
    scene.add(pebbles);
    for (let k = 0; k < 3; k++) {
      const a = k * 2.1 + 0.7,
        lx = x + Math.sin(a) * rx * 0.66,
        lz = z + Math.cos(a) * rz * 0.66;
      const pad = new T.Mesh(
        new T.CircleGeometry(0.3, 28, 0.15, Math.PI * 1.88),
        new T.MeshStandardMaterial({ color: '#579e99', side: T.DoubleSide }),
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(lx, 0.025, lz);
      scene.add(pad);
      const lily = createTreasure(ITEMS['pearl-lily-cup'], 1.1);
      lily.position.set(lx, 0.03, lz);
      scene.add(lily);
    }
    for (let j = 0; j < 6; j++) {
      const ring = new T.Mesh(
        new T.RingGeometry(0.2 + j * 0.13, 0.21 + j * 0.13, 60),
        new T.MeshBasicMaterial({
          color: '#e7fff1',
          transparent: true,
          opacity: 0.1,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.scale.set(rx * 0.65, rz * 0.65, 1);
      ring.position.set(x, 0.015 + j * 0.0001, z);
      scene.add(ring);
      caustics.push(ring);
    }
  }
  // Low coral gardens frame the water without obscuring the central path.
  for (const [j, x, z] of [
    [0, -2.7, 2.6],
    [1, 2.8, -0.5],
    [2, -3.3, -5.2],
    [3, 7.5, 0.7],
    [4, -7.7, -5.2],
    [5, 3.4, -9],
  ]) {
    const model = createTreasure(
      {
        id: 'mp-garden-' + j,
        type: j % 2 ? 'fan' : 'coral',
        color: j % 2 ? '#c594c9' : '#ec9fa9',
        visual: {
          variant: j % 2 ? 17 : 9,
          motif: 'branches',
          accent: '#89cab7',
          profile: 1,
        },
      },
      1.6,
    );
    model.position.set(x, 0, z);
    scene.add(model);
    for (let k = 0; k < 5; k++) {
      const stem = new T.Mesh(
        new T.CylinderGeometry(0.018, 0.032, 0.25 + k * 0.04, 7),
        new T.MeshStandardMaterial({ color: '#83a49f' }),
      );
      stem.position.set(
        x + 0.5 + Math.sin(k * 2.4) * 0.22,
        0.13 + k * 0.02,
        z + Math.cos(k * 2.4) * 0.2,
      );
      scene.add(stem);
      const cap = new T.Mesh(
        new T.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new T.MeshStandardMaterial({
          color: '#a9dddf',
          emissive: '#61b9bc',
          emissiveIntensity: 0.6,
          side: T.DoubleSide,
        }),
      );
      cap.position.copy(stem.position);
      cap.position.y += 0.14 + k * 0.02;
      scene.add(cap);
    }
  }
  // Irregular stepping stones form an inviting winding route between the pools.
  for (let j = 0; j < 19; j++) {
    const z = 6 - j * 0.95,
      x = Math.sin(j * 0.6) * 0.5;
    const o = new T.Mesh(
      new T.CylinderGeometry(0.65 + (j % 3) * 0.06, 0.75, 0.12, 9),
      new T.MeshStandardMaterial({
        color: j % 3 ? '#e8dcca' : '#d6d1d6',
        roughness: 0.9,
      }),
    );
    o.position.set(x, -0.025, z);
    o.rotation.y = j * 0.37;
    scene.add(o);
  }
  const plants = new T.Group();
  scene.add(plants);
  const greens = ['#a5d5ba', '#a2cdd7', '#cfbce0'],
    mossMat = new T.MeshStandardMaterial({
      color: '#a7d5bd',
      emissive: '#84bca2',
      emissiveIntensity: 0.2,
      roughness: 0.9,
    });
  const moss = new T.InstancedMesh(rockGeo, mossMat, 240),
    dummy = new T.Object3D();
  scene.add(moss);
  for (let j = 0; j < 24; j++) {
    const side = j % 2 ? 1 : -1,
      x = side * (8.9 + Math.sin(j) * 0.5),
      z = 5 - j * 0.78;
    for (let k = 0; k < 10; k++) {
      const a = k * 2.399;
      dummy.position.set(
        x + Math.sin(a) * 0.45,
        0.03 + (k % 3) * 0.02,
        z + Math.cos(a) * 0.4,
      );
      dummy.scale.set(0.17, 0.08, 0.13);
      dummy.updateMatrix();
      moss.setMatrixAt(j * 10 + k, dummy.matrix);
    }
    const stem = new T.MeshStandardMaterial({
      color: greens[j % 3],
      emissive: greens[j % 3],
      emissiveIntensity: 0.11,
      side: T.DoubleSide,
      roughness: 0.55,
    });
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5,
        shape = new T.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(-0.24, 0.4, -0.14, 0.9, 0, 1.15);
      shape.bezierCurveTo(0.18, 0.8, 0.25, 0.25, 0, 0);
      const leaf = new T.Mesh(
        new T.ExtrudeGeometry(shape, {
          depth: 0.025,
          bevelEnabled: true,
          bevelSize: 0.025,
          bevelThickness: 0.015,
          bevelSegments: 2,
          curveSegments: 12,
        }),
        stem,
      );
      leaf.position.set(x, 0.05, z);
      leaf.rotation.set(0.2 + Math.sin(a) * 0.24, a, (k - 2) * 0.18);
      leaf.scale.setScalar(0.6 + (j % 4) * 0.13);
      plants.add(leaf);
    }
    if (j % 3 === 0) {
      const model = createTreasure(
        {
          id: 'mp-scenery-' + j,
          type: j % 2 ? 'fan' : 'coral',
          color: j % 2 ? '#d5afce' : '#f0b9b8',
          visual: {
            variant: j % 2 ? 17 : 9,
            motif: 'branches',
            accent: '#c7ded8',
            profile: 1,
          },
        },
        2.6,
      );
      model.position.set(x - side * 0.8, 0.02, z);
      scene.add(model);
    }
    if (j % 4 === 0) {
      const mineral = createTreasure(
        {
          id: 'mp-crystals-' + j,
          type: 'cluster',
          color: ['#a4d1d5', '#c5b3df', '#e8c0ce'][j % 3],
          visual: {
            variant: 9,
            motif: 'points',
            accent: '#e9f1df',
            profile: 1,
          },
        },
        2.3,
      );
      mineral.position.set(x, 0.02, z - 0.65);
      scene.add(mineral);
    }
  }
  moss.instanceMatrix.needsUpdate = true;
  // Moon arch and a silvery curtain of falling water, seen across the last pool.
  const archMat = new T.MeshPhysicalMaterial({
    color: '#d8c9e4',
    roughness: 0.3,
    iridescence: 1,
  });
  const arch = new T.Mesh(
    new T.TorusGeometry(2.3, 0.25, 12, 64, Math.PI),
    archMat,
  );
  arch.position.set(0, 2.2, -14);
  scene.add(arch);
  const moon = new T.Mesh(
    new T.SphereGeometry(0.68, 32, 20),
    new T.MeshBasicMaterial({ color: '#fff1dd' }),
  );
  moon.position.set(0, 5, -15);
  moon.scale.z = 0.3;
  scene.add(moon);
  for (const x of [-1.6, 1.6]) {
    const fall = new T.Mesh(
      new T.CylinderGeometry(0.09, 0.13, 2.4, 12),
      new T.MeshPhysicalMaterial({
        color: '#c6e8ed',
        transparent: true,
        opacity: 0.45,
        roughness: 0.15,
      }),
    );
    fall.position.set(x, 1.15, -13);
    scene.add(fall);
  }
  const sparkleGeo = new T.BufferGeometry(),
    sparklePositions = [];
  for (let j = 0; j < 100; j++)
    sparklePositions.push(
      Math.sin(j * 2.399) * 10,
      0.6 + (j % 17) * 0.15,
      -12 + ((j * 0.73) % 18),
    );
  sparkleGeo.setAttribute(
    'position',
    new T.Float32BufferAttribute(sparklePositions, 3),
  );
  const sparkles = new T.Points(
    sparkleGeo,
    new T.PointsMaterial({
      color: '#fff4d6',
      size: 0.045,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  scene.add(sparkles);
  const entrance = new T.Group();
  scene.add(entrance);
  for (const x of [-2.3, 2.3]) rock(x, 1.1, 8, 1, 1.8, 1);
  const exitLight = new T.PointLight('#bdc7dd', 4, 7);
  exitLight.position.set(0, 2, 8);
  scene.add(exitLight);
  const finds = [];
  function spawn(item, method, x, z, uid) {
    const g = new T.Group();
    g.position.set(x, 0.05, z);
    g.userData.find = { item, method, uid };
    g.add(createTreasure(item, 0.95));
    scene.add(g);
    finds.push(g);
    return g;
  }
  function remove(g) {
    scene.remove(g);
    const index = finds.indexOf(g);
    if (index >= 0) finds.splice(index, 1);
  }
  function clearFinds() {
    for (const g of [...finds]) remove(g);
  }
  function update(t) {
    waters.forEach((w, j) => {
      w.position.y = -0.025 + Math.sin(t * 0.7 + j) * 0.006;
      w.material.opacity = 0.54 + Math.sin(t * 0.4 + j) * 0.035;
    });
    caustics.forEach((c, j) => {
      c.material.opacity = 0.065 + 0.045 * Math.sin(t * 0.8 + j * 0.5);
      c.rotation.z = Math.sin(t * 0.12 + j) * 0.05;
    });
    sparkles.position.y = Math.sin(t * 0.35) * 0.08;
    sparkles.material.opacity = 0.55 + Math.sin(t * 0.6) * 0.2;
  }
  return {
    scene,
    camera,
    finds,
    spawn,
    remove,
    clearFinds,
    update,
    stations: { exit: V(0, 0, 6.4) },
  };
}
