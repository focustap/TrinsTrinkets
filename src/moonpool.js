import * as T from 'three';
import { createTreasure } from './treasures.js';
import {
  GROUND,
  createSurface,
  restOnSurface,
  addContactShadow,
  disposeContactShadow,
  softDiscTexture,
} from './surfaces.js';
import { waterLily } from './scenery.js';
import {
  grainTexture,
  addSky,
  waterNormalTexture,
  ambientTime,
} from './visuals.js';
import {
  cragGeometry,
  cragMaterial,
  coastalFir,
  updateFoliage,
} from './landscape.js';
import { batch } from './scenery.js';
const V = (x, y, z) => new T.Vector3(x, y, z);
export function createMoonpoolScene() {
  const scene = new T.Scene();
  scene.background = new T.Color('#29384d');
  scene.userData.exposure = 0.98;
  scene.userData.environmentIntensity = 0.16;
  scene.userData.environmentStyle = 'moonpool';
  scene.userData.finishCool = 0.025;
  scene.userData.finishWarm = 0.006;
  addSky(scene, '#192a43', '#82718b', { clouds: 0.25 });
  scene.fog = new T.Fog('#4e6274', 16, 70);
  const camera = new T.PerspectiveCamera(67, 1, 0.1, 100);
  camera.position.set(0, 1.7, 5.2);
  camera.rotation.order = 'YXZ';
  camera.rotation.x = -0.06;
  scene.add(new T.HemisphereLight('#a1b7dc', '#213b42', 0.72));
  const sun = new T.DirectionalLight('#afc7ea', 2.1);
  sun.position.set(-4, 12, -14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.bias = -0.0001;
  sun.shadow.normalBias = 0.01;
  scene.add(sun);
  const floorGrain = grainTexture().clone();
  floorGrain.repeat.set(0.2, 0.2);
  const stone = cragMaterial('#a4b9bf'),
    pale = new T.MeshStandardMaterial({
      color: '#a4b5b4',
      roughness: 0.95,
      map: floorGrain,
    });
  const POOLS = [
    [-5.2, -1, 3, 4],
    [5.2, -4.5, 3.2, 4.5],
    [0, -10.6, 3.6, 1.5],
  ];
  const contour = (rx, rz, index) =>
    Array.from({ length: 64 }, (_, j) => {
      const a = (j * Math.PI * 2) / 64,
        r =
          1 + 0.035 * Math.sin(a * 5 + index) + 0.02 * Math.cos(a * 3 - index);
      return [Math.cos(a) * rx * r, Math.sin(a) * rz * r];
    });
  const floorShape = new T.Shape();
  floorShape.moveTo(-14.5, 18.5);
  floorShape.lineTo(14.5, 18.5);
  floorShape.lineTo(14.5, -12.5);
  floorShape.lineTo(-14.5, -12.5);
  floorShape.closePath();
  POOLS.forEach(([x, z, rx, rz], index) => {
    const hole = new T.Path();
    contour(rx, rz, index).forEach(([px, pz], j) =>
      j ? hole.lineTo(x + px, -z - pz) : hole.moveTo(x + px, -z - pz),
    );
    hole.closePath();
    floorShape.holes.push(hole);
  });
  const floor = new T.Mesh(new T.ShapeGeometry(floorShape), pale);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = GROUND.moonpool;
  floor.receiveShadow = true;
  floor.name = 'moonpool-ground';
  scene.add(floor);
  const surface = createSurface(GROUND.moonpool, [floor]);
  const rockGeo = cragGeometry(2),
    rock = (x, y, z, sx, sy, sz) => {
      const o = new T.Mesh(rockGeo, stone);
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      o.castShadow = true;
      o.receiveShadow = true;
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
  const treeLine = new T.Group();
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2,
      x = Math.sin(a) * 18,
      z = -3 + Math.cos(a) * 21;
    if (z > 8 && Math.abs(x) < 6) continue;
    const tree = coastalFir(k);
    tree.position.set(
      x + Math.sin(k * 3.7) * 1.4,
      1.5,
      z + Math.sin(k * 2.9) * 1.5,
    );
    tree.scale.setScalar(0.6 + Math.abs(Math.sin(k * 5.3)) * 0.55);
    treeLine.add(tree);
  }
  batch(treeLine);
  treeLine.name = 'moonpool-tree-line';
  scene.add(treeLine);
  // A warm, open grotto: pools are below the shallow, walkable shoreline.
  const waters = [],
    caustics = [],
    waterPlants = [];
  for (const [poolIndex, [x, z, rx, rz]] of POOLS.entries()) {
    const outline = contour(rx, rz, poolIndex),
      shape = new T.Shape();
    outline.forEach(([px, pz], j) =>
      j ? shape.lineTo(px, -pz) : shape.moveTo(px, -pz),
    );
    shape.closePath();
    const poolGeometry = new T.ShapeGeometry(shape);
    poolGeometry.rotateX(-Math.PI / 2);
    const bedPositions = [0, 0, 0],
      bedColors = [],
      bedIndices = [];
    const deep = new T.Color('#2f8e90'),
      shallow = new T.Color('#82c3b3');
    bedColors.push(deep.r, deep.g, deep.b);
    outline.forEach(([px, pz], j) => {
      bedPositions.push(px, 0, pz);
      bedColors.push(shallow.r, shallow.g, shallow.b);
      bedIndices.push(0, ((j + 1) % outline.length) + 1, j + 1);
    });
    const bedGeometry = new T.BufferGeometry();
    bedGeometry.setAttribute(
      'position',
      new T.Float32BufferAttribute(bedPositions, 3),
    );
    bedGeometry.setAttribute(
      'color',
      new T.Float32BufferAttribute(bedColors, 3),
    );
    bedGeometry.setIndex(bedIndices);
    bedGeometry.computeVertexNormals();
    const bed = new T.Mesh(
      bedGeometry,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }),
    );
    bed.position.set(x, -0.24, z);
    bed.receiveShadow = true;
    scene.add(bed);
    surface.meshes.push(bed);
    const geo = poolGeometry.clone();
    const rippleNormal = waterNormalTexture().clone();
    rippleNormal.repeat.set(0.32, 0.32);
    const water = new T.Mesh(
      geo,
      new T.MeshPhysicalMaterial({
        color: '#37bdb8',
        roughness: 0.16,
        metalness: 0.08,
        transparent: true,
        opacity: 0.45,
        clearcoat: 1,
        normalMap: rippleNormal,
        normalScale: new T.Vector2(0.12, 0.12),
        side: T.DoubleSide,
      }),
    );
    water.position.set(x, -0.175, z);
    scene.add(water);
    waters.push(water);
    const poolLight = new T.PointLight('#71c5be', 9, 9, 2);
    poolLight.position.set(x, 0.75, z);
    scene.add(poolLight);
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
        -0.22,
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
      const lily = waterLily(k + poolIndex);
      lily.position.set(lx, -0.172, lz);
      scene.add(lily);
      waterPlants.push({ lily, water });
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
      ring.position.set(x, -0.168 + j * 0.0001, z);
      scene.add(ring);
      caustics.push(ring);
    }
    const bankPositions = [],
      bankIndices = [];
    outline.forEach(([px, pz], j) => {
      bankPositions.push(
        px * 1.003,
        GROUND.moonpool,
        pz * 1.003,
        px * 0.96,
        -0.24,
        pz * 0.96,
      );
      const a = j * 2,
        b = ((j + 1) % outline.length) * 2;
      bankIndices.push(a, b, a + 1, a + 1, b, b + 1);
    });
    const bankGeometry = new T.BufferGeometry();
    bankGeometry.setAttribute(
      'position',
      new T.Float32BufferAttribute(bankPositions, 3),
    );
    bankGeometry.setIndex(bankIndices);
    bankGeometry.computeVertexNormals();
    const bank = new T.Mesh(
      bankGeometry,
      new T.MeshStandardMaterial({
        color: '#c4c9b9',
        roughness: 0.95,
        side: T.DoubleSide,
      }),
    );
    bank.position.set(x, 0, z);
    scene.add(bank);
    surface.meshes.push(bank);
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
    restOnSurface(model, surface, 0.012);
    addContactShadow(scene, model, surface, 0.16);
    if (j % 2 === 0) {
      const coralLight = new T.PointLight('#d995a0', 3, 5, 2);
      coralLight.position.set(x, 0.6, z);
      scene.add(coralLight);
    }
    model.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.emissive?.set(j % 2 ? '#71468b' : '#8c4d66');
        o.material.emissiveIntensity = 0.15;
      }
    });
    for (let k = 0; k < 5; k++) {
      const stem = new T.Mesh(
        new T.CylinderGeometry(0.018, 0.032, 0.25 + k * 0.04, 7),
        new T.MeshStandardMaterial({ color: '#83a49f' }),
      );
      stem.position.set(
        x + 0.5 + Math.sin(k * 2.4) * 0.22,
        GROUND.moonpool + (0.25 + k * 0.04) / 2,
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
      cap.position.y += (0.25 + k * 0.04) / 2 - 0.004;
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
    o.position.set(x, 0, z);
    o.rotation.y = j * 0.37;
    scene.add(o);
    restOnSurface(o, surface, 0.012);
    surface.meshes.push(o);
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
        GROUND.moonpool + 0.05,
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
      restOnSurface(leaf, surface, 0.01);
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
      restOnSurface(model, surface, 0.015);
      addContactShadow(scene, model, surface, 0.15);
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
      restOnSurface(mineral, surface, 0.014);
      addContactShadow(scene, mineral, surface, 0.16);
    }
  }
  moss.instanceMatrix.needsUpdate = true;
  // Moon arch and a silvery curtain of falling water, seen across the last pool.
  const archMat = new T.MeshPhysicalMaterial({
    color: '#d8c9e4',
    roughness: 0.3,
    iridescence: 1,
  });
  // One continuous stone frame: vertical legs share the semicircle's exact
  // endpoints and tangents, with their lower ends buried in stone plinths.
  class MoonArchCurve extends T.Curve {
    getPoint(t, target = new T.Vector3()) {
      const leg = 2.05,
        radius = 2.3,
        arc = Math.PI * radius,
        d = t * (leg * 2 + arc);
      if (d < leg) return target.set(-radius, 0.15 + d, 0);
      if (d > leg + arc) return target.set(radius, 2.2 - (d - leg - arc), 0);
      const angle = Math.PI - (d - leg) / radius;
      return target.set(
        Math.cos(angle) * radius,
        2.2 + Math.sin(angle) * radius,
        0,
      );
    }
  }
  const arch = new T.Mesh(
    new T.TubeGeometry(new MoonArchCurve(), 160, 0.25, 16, false),
    archMat,
  );
  arch.name = 'moonpool-arch-frame';
  arch.position.z = -14;
  scene.add(arch);
  for (const x of [-2.3, 2.3]) {
    const base = new T.Mesh(
      new T.CylinderGeometry(0.43, 0.55, 0.32, 10),
      archMat,
    );
    base.position.set(x, 0, -14);
    scene.add(base);
    const collar = new T.Mesh(new T.TorusGeometry(0.26, 0.035, 8, 32), archMat);
    collar.rotation.x = -Math.PI / 2;
    collar.position.set(x, 0.38, -14);
    scene.add(collar);
    const spout = new T.Mesh(
      new T.CylinderGeometry(0.14, 0.17, 0.34, 12),
      archMat,
    );
    spout.rotation.x = Math.PI / 2;
    spout.position.set(x, 2.0, -13.7);
    scene.add(spout);
    const basin = new T.Mesh(new T.TorusGeometry(0.43, 0.09, 10, 40), archMat);
    basin.rotation.x = -Math.PI / 2;
    basin.position.set(x, 0.04, -13.48);
    scene.add(basin);
    const basinFoot = new T.Mesh(
      new T.CylinderGeometry(0.47, 0.52, 0.12, 24),
      archMat,
    );
    basinFoot.position.set(x, -0.1, -13.48);
    scene.add(basinFoot);
    const pool = new T.Mesh(
      new T.CircleGeometry(0.43, 40),
      new T.MeshPhysicalMaterial({
        color: '#80d4d1',
        roughness: 0.15,
        transparent: true,
        opacity: 0.7,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.045, -13.48);
    scene.add(pool);
  }
  const moon = new T.Mesh(
    new T.SphereGeometry(0.68, 32, 20),
    new T.MeshBasicMaterial({ color: '#fff1dd' }),
  );
  moon.position.set(0, 5, -15);
  moon.scale.z = 0.3;
  scene.add(moon);
  const halo = new T.Sprite(
    new T.SpriteMaterial({
      map: softDiscTexture(),
      color: '#f1dcdf',
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  halo.position.copy(moon.position);
  halo.scale.set(3, 3, 1);
  scene.add(halo);
  const moonlight = new T.PointLight('#c4d2ec', 10, 12, 2);
  moonlight.position.set(0, 3.6, -12.5);
  scene.add(moonlight);
  for (const x of [-2.3, 2.3]) {
    const fall = new T.Mesh(
      new T.CylinderGeometry(0.09, 0.13, 1.9, 12),
      new T.MeshPhysicalMaterial({
        color: '#c6e8ed',
        transparent: true,
        opacity: 0.45,
        roughness: 0.15,
      }),
    );
    fall.position.set(x, 1.0, -13.48);
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
      map: softDiscTexture(),
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
    g.position.set(x, 0, z);
    g.userData.find = { item, method, uid };
    const model = createTreasure(item, 0.95);
    model.name = 'discovery-model';
    g.add(model);
    restOnSurface(model, surface, 0.003);
    scene.add(g);
    g.userData.shadow = addContactShadow(scene, model, surface, 0.2);
    finds.push(g);
    return g;
  }
  function remove(g) {
    disposeContactShadow(g.userData.shadow);
    scene.remove(g);
    const index = finds.indexOf(g);
    if (index >= 0) finds.splice(index, 1);
  }
  function clearFinds() {
    for (const g of [...finds]) remove(g);
  }
  function update(t) {
    t = ambientTime(t);
    updateFoliage(t);
    scene.userData.sky.material.uniforms.time.value = t;
    waters.forEach((w, j) => {
      w.position.y = -0.175 + Math.sin(t * 0.7 + j) * 0.004;
      w.material.opacity = 0.43 + Math.sin(t * 0.4 + j) * 0.025;
      w.material.normalMap.offset.set(t * 0.0018, t * 0.001);
    });
    waterPlants.forEach(({ lily, water }) => {
      lily.position.y = water.position.y + 0.003;
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
    surface,
    stations: { exit: V(0, 0, 6.4) },
  };
}
