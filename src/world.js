import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createTreasure } from './treasures.js';
import { shelfSlots } from './shelves.js';
import { owns, SHOP_COLORS, WOODS } from './progression.js';
import { createRockPassage } from './passage.js';
import { createRewardDecor } from './reward-art.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const box = (w, h, d, material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const ball = (r, material, x = 0, y = 0, z = 0, detail = 16) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, detail, 12), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
};
const mat = (color, roughness = 0.75, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const curve = (points, radius, material, closed = false) =>
  new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        points.map((p) => V(...p)),
        closed,
      ),
      Math.max(12, points.length * 4),
      radius,
      6,
      closed,
    ),
    material,
  );

function sign(
  text,
  color = '#735a55',
  background = '#fff4e9',
  w = 2.8,
  h = 0.66,
) {
  if (typeof document === 'undefined') {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: background }),
    );
    face.rotation.y = Math.PI;
    return face;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 22);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = 'bold 43px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 67, 474);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.FrontSide,
    }),
  );
  // Signs are mounted on negative-Z faces; turn them toward approaching players, not away.
  face.rotation.y = Math.PI;
  return face;
}

function sandTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#efd8b0';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3600; i++) {
    const x = Math.random() * 256,
      y = Math.random() * 256;
    g.fillStyle =
      i % 3 === 0 ? 'rgba(255,255,242,.20)' : 'rgba(166,122,89,.10)';
    g.fillRect(x, y, Math.random() * 2 + 0.3, Math.random() * 2 + 0.3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(11, 11);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function flower(x, z, color = '#f5a3b7') {
  const g = new THREE.Group();
  const stem = mat('#8eaa75'),
    petal = mat(color),
    yellow = mat('#f4cd68');
  const stemMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.42, 6),
    stem,
  );
  stemMesh.position.y = 0.23;
  g.add(stemMesh);
  for (let k = 0; k < 5; k++) {
    const a = (k * Math.PI * 2) / 5;
    g.add(
      ball(0.1, petal, Math.sin(a) * 0.12, 0.5 + Math.cos(a) * 0.12, 0.02, 9),
    );
  }
  g.add(ball(0.077, yellow, 0, 0.5, 0.035));
  g.position.set(x, 0, z);
  return g;
}
function grasses(x, z) {
  const g = new THREE.Group(),
    green = mat('#88ab80');
  for (let i = 0; i < 6; i++) {
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.38 + Math.random() * 0.35, 4),
      green,
    );
    const a = i * 2.4;
    blade.position.set(Math.cos(a) * 0.15, 0.25, Math.sin(a) * 0.15);
    blade.rotation.z = (Math.random() - 0.5) * 0.38;
    g.add(blade);
  }
  g.position.set(x, 0, z);
  return g;
}

function makeCottage(scene) {
  const house = new THREE.Group(),
    paint = mat('#f3e5d7'),
    roof = mat('#b98891'),
    trim = mat('#fffaf0'),
    wood = mat('#9b7661'),
    glass = mat('#a8d7e4', 0.21);
  house.name = 'cottage-exterior';
  house.position.set(-7.5, 0, 13);
  // Solid end walls fill the gables. The roof is one closed shell, so its
  // slopes share a ridge instead of leaving a slit or exposing dark undersides.
  const pitch = 2.2 / 3.5;
  const extrude = (points, depth, material, name) => {
    const shape = new THREE.Shape(
      points.map(([x, y]) => new THREE.Vector2(x, y)),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    house.add(mesh);
    return mesh;
  };
  extrude(
    [
      [-3.5, -0.08],
      [3.5, -0.08],
      [3.5, 4.05],
      [0, 6.25],
      [-3.5, 4.05],
    ],
    6,
    paint,
    'cottage-walls',
  );
  const eave = 6.25 - pitch * 4;
  extrude(
    [
      [-4, eave],
      [0, 6.25],
      [4, eave],
      [4, eave + 0.24],
      [0, 6.49],
      [-4, eave + 0.24],
    ],
    6.8,
    roof,
    'cottage-roof',
  );
  const course = mat('#c5959d');
  for (const side of [-1, 1]) {
    for (let j = 1; j <= 7; j++) {
      const x = side * j * 0.5;
      const seam = box(
        0.055,
        0.025,
        6.8,
        course,
        x,
        6.51 - pitch * Math.abs(x),
        0,
      );
      seam.rotation.z = -side * Math.atan(pitch);
      house.add(seam);
    }
  }
  const ridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 6.86, 12),
    course,
  );
  ridge.rotation.x = Math.PI / 2;
  ridge.position.set(0, 6.49, 0);
  house.add(ridge);
  // A little attic window gives the now enclosed gable a finished facade.
  const attic = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), glass);
  attic.rotation.y = Math.PI;
  attic.position.set(0, 4.95, -3.025);
  house.add(attic);
  const atticFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.065, 10, 40),
    trim,
  );
  atticFrame.position.set(0, 4.95, -3.07);
  house.add(atticFrame);
  house.add(box(0.065, 0.78, 0.08, trim, 0, 4.95, -3.09));
  house.add(box(0.78, 0.065, 0.08, trim, 0, 4.95, -3.09));
  house.add(box(1.5, 2.85, 0.15, wood, 0, 1.44, -3.07));
  for (const x of [-0.83, 0.83])
    house.add(box(0.12, 2.98, 0.18, trim, x, 1.49, -3.09));
  house.add(box(1.78, 0.13, 0.18, trim, 0, 2.96, -3.09));
  house.add(ball(0.085, mat('#e4c67d', 0.25, 0.6), 0.48, 1.46, -3.2));
  for (const x of [-2.25, 2.25]) {
    house.add(box(1.45, 1.65, 0.12, trim, x, 2.35, -3.12));
    house.add(box(1.17, 1.35, 0.14, glass, x, 2.35, -3.2));
    house.add(box(0.1, 1.35, 0.13, trim, x, 2.35, -3.28));
    house.add(box(1.17, 0.1, 0.13, trim, x, 2.35, -3.29));
    house.add(box(1.7, 0.19, 0.56, trim, x, 1.47, -3.2));
    const planter = box(1.5, 0.24, 0.48, mat('#d2a892'), x, 1.29, -3.45);
    house.add(planter);
    for (let j = 0; j < 5; j++) {
      const bloom = flower(
        x - 0.55 + j * 0.25,
        -3.45,
        j % 2 ? '#eab0d6' : '#fff7e5',
      );
      bloom.position.y = 1.39;
      house.add(bloom);
    }
  }
  const label = sign("TRIN'S COTTAGE", '#8f666d', '#fff1e9', 3.25, 0.76);
  label.position.set(0, 3.58, -3.16);
  house.add(label);
  for (let i = 0; i < 8; i++) {
    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.45, 0.07, 9),
      mat('#c1b7aa'),
    );
    stone.position.set(Math.sin(i * 0.7) * 0.6, 0.04, -3.9 - i * 0.75);
    house.add(stone);
  }
  scene.add(house);
  return V(-7.5, 0, 7.9);
}

function makeExchange(scene) {
  const s = new THREE.Group(),
    wood = mat('#ba8d73'),
    white = mat('#fff1e4'),
    accent = mat('#e7a8b0'),
    sea = mat('#9fcac7');
  s.position.set(7.5, 0, 12);
  s.add(box(5.3, 0.24, 3.4, wood, 0, 1.48, 0));
  for (const x of [-2.35, 2.35])
    for (const z of [-1.35, 1.35])
      s.add(box(0.18, 3.5, 0.18, wood, x, 1.76, z));
  s.add(box(5.6, 0.27, 3.8, white, 0, 3.48, 0));
  for (let i = 0; i < 7; i++)
    s.add(
      box(0.8, 0.42, 0.1, i % 2 ? white : accent, -2.4 + i * 0.8, 3.18, -1.87),
    );
  s.add(box(4.45, 0.2, 0.96, sea, 0, 1.68, -1.12));
  s.add(box(4.9, 1.45, 0.28, wood, 0, 0.74, 1.36));
  const label = sign('BEACH EXCHANGE', '#765f58', '#fff9e8', 3.95, 0.73);
  label.position.set(0, 2.67, -1.61);
  s.add(label);
  const basket = box(1.4, 0.55, 1.1, mat('#bb9a73'), -1.55, 1.98, -0.7);
  s.add(basket);
  for (let i = 0; i < 5; i++)
    s.add(
      ball(
        0.17,
        mat(i % 2 ? '#ffe3b3' : '#f4b5ba'),
        -2.05 + i * 0.23,
        2.31,
        -0.67,
        10,
      ),
    );
  const register = box(0.9, 0.28, 0.65, white, 1.5, 1.96, -0.65);
  s.add(register);
  const price = sign('SELL  •  SHOP', '#8f7b68', '#fff3e9', 2.1, 0.43);
  price.position.set(1.2, 1.04, -1.45);
  s.add(price);
  scene.add(s);
  return V(7.5, 0, 8.2);
}

// One GPU model per item, cloned for beach finds and shelf placements.
const treasureTemplates = new Map();
function treasure(item, scale = 1) {
  if (!treasureTemplates.has(item.id))
    treasureTemplates.set(item.id, createTreasure(item, 1));
  const model = treasureTemplates.get(item.id).clone(true);
  model.scale.setScalar(scale);
  model.userData.itemId = item.id;
  return model;
}
function rounded(w, h, d, r, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(
    new RoundedBoxGeometry(
      w,
      h,
      d,
      4,
      Math.min(r, w * 0.48, h * 0.48, d * 0.48),
    ),
    material,
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export function createBeachScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a7dfe5');
  scene.fog = new THREE.FogExp2('#a7dfe5', 0.0075);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 220);
  camera.position.set(0, 1.7, 2);
  camera.rotation.order = 'YXZ';
  scene.add(new THREE.HemisphereLight('#ffeed4', '#81bdb2', 2.05));
  const sunlight = new THREE.DirectionalLight('#fff2cc', 2.55);
  sunlight.position.set(-25, 35, -35);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -40;
  sunlight.shadow.camera.right = 40;
  sunlight.shadow.camera.top = 45;
  sunlight.shadow.camera.bottom = -40;
  scene.add(sunlight);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(39, 38),
    new THREE.MeshStandardMaterial({ map: sandTexture(), roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.08, 3);
  ground.receiveShadow = true;
  scene.add(ground);
  const wet = new THREE.Mesh(
    new THREE.PlaneGeometry(39, 2.4),
    new THREE.MeshStandardMaterial({
      color: '#d7d4ba',
      roughness: 0.55,
      transparent: true,
      opacity: 0.65,
    }),
  );
  wet.rotation.x = -Math.PI / 2;
  wet.position.set(0, -0.05, -14.9);
  scene.add(wet);
  const oceanGeo = new THREE.PlaneGeometry(95, 120, 64, 35);
  oceanGeo.rotateX(-Math.PI / 2);
  const base = new Float32Array(oceanGeo.attributes.position.array);
  const water = new THREE.Mesh(
    oceanGeo,
    new THREE.MeshPhysicalMaterial({
      color: '#69c8cc',
      roughness: 0.27,
      metalness: 0.12,
      transparent: true,
      opacity: 0.94,
      clearcoat: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  water.position.set(0, -0.2, -76);
  scene.add(water);
  const foam = [];
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(
      new THREE.PlaneGeometry(39, 0.15 + i * 0.034),
      new THREE.MeshBasicMaterial({
        color: '#fbffea',
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    f.rotation.x = -Math.PI / 2;
    f.position.set(0, 0.015, -16 - i * 0.46);
    scene.add(f);
    foam.push(f);
  }
  const sun = ball(
    7,
    new THREE.MeshBasicMaterial({ color: '#fff0cf' }),
    -27,
    27,
    -110,
    32,
  );
  scene.add(sun);
  // A compact, sheltered cove replaces the original featureless open sand plain.
  // Curved rocky edges and dune grass make the playable area feel intentionally small.
  const rockMats = [mat('#c0aca0'), mat('#d2bca8'), mat('#aeb5a8')];
  const dune = mat('#e9d2aa'),
    grass = mat('#9aaf86');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 25; i++) {
      const z = -16 + i * 1.54 + (Math.random() - 0.5) * 0.7;
      const x = side * (16 + Math.sin(i * 0.47) * 1.3 + Math.random() * 0.5);
      const radius = 1.45 + Math.random() * 1.4;
      if (side === 1 && z + radius * 1.65 > -1.6 && z - radius * 1.65 < 3.6)
        continue;
      const stone = ball(radius, rockMats[i % 3], x, radius * 0.36, z, 9);
      stone.scale.set(1.15, 0.6, 1.0 + Math.random() * 0.4);
      stone.rotation.y = Math.random() * 3;
      scene.add(stone);
      if (i % 2 === 0) scene.add(grasses(x - side * 1.5, z));
    }
  }
  for (let i = 0; i < 23; i++) {
    const x = -18 + i * 1.65,
      z = 20 + Math.sin(i * 0.5) * 1.4;
    const hill = ball(
      2.2 + Math.random() * 1.4,
      i % 3 === 0 ? rockMats[1] : dune,
      x,
      0.7,
      z,
      11,
    );
    hill.scale.set(1, 0.65, 1.25);
    scene.add(hill);
  }
  for (let i = 0; i < 45; i++) {
    const x = (Math.random() - 0.5) * 29,
      z = Math.random() * 30 - 12;
    if ((x > -11.5 && x < -3.5 && z > 7) || (x > 4 && x < 11 && z > 7))
      continue;
    if (i % 5 === 0)
      scene.add(flower(x, z, ['#ffc3c5', '#fff4e5', '#cdbce5'][i % 3]));
    else scene.add(grasses(x, z));
  }
  for (let i = 0; i < 34; i++) {
    const x = (Math.random() - 0.5) * 29,
      z = Math.random() * 29 - 13;
    const stone = ball(
      0.06 + Math.random() * 0.15,
      rockMats[i % 3],
      x,
      0.05,
      z,
      8,
    );
    stone.scale.set(1, 0.45, 1.2);
    scene.add(stone);
  }
  for (let i = 0; i < 7; i++) {
    const x = (Math.random() - 0.5) * 26,
      z = Math.random() * 27 - 12;
    const drift = box(
      0.8 + Math.random() * 0.8,
      0.11,
      0.16,
      mat('#b1a394'),
      x,
      0.09,
      z,
    );
    drift.rotation.y = Math.random() * Math.PI;
    scene.add(drift);
  }
  const cottage = makeCottage(scene),
    exchange = makeExchange(scene);
  // A fenced trail ends in a dark, moss-lit opening in the east cliff.
  const cavePath = new THREE.Group();
  scene.add(cavePath);
  const entrance = createRockPassage();
  entrance.group.position.set(16.7, 0, 1);
  entrance.group.rotation.y = -Math.PI / 2;
  cavePath.add(entrance.group);
  for (let j = 0; j < 5; j++) {
    const cap = ball(
      1.5,
      rockMats[j % 3],
      18.4,
      4.2 + Math.sin(j) * 0.25,
      -2.4 + j * 1.65,
      16,
    );
    cap.scale.set(1.3, 0.75, 1.1);
    cavePath.add(cap);
  }
  for (const z of [-3.2, 5.2])
    for (let j = 0; j < 3; j++) {
      const stone = ball(
        1.5,
        rockMats[j % 3],
        17 + j * 0.8,
        0.65 + j * 0.2,
        z,
        16,
      );
      stone.scale.set(1, 0.8, 1);
      cavePath.add(stone);
    }
  for (const z of [-1, 3])
    for (let x = 12; x < 18; x += 1.2) {
      cavePath.add(box(0.12, 1.25, 0.12, mat('#b29a83'), x, 0.62, z));
      cavePath.add(box(1.25, 0.1, 0.1, mat('#d9c2a0'), x, 0.83, z));
    }
  const gate = new THREE.Group();
  gate.position.set(14.5, 0, -1);
  scene.add(gate);
  for (let j = 0; j < 6; j++)
    gate.add(box(0.11, 1.25, 0.12, mat('#b69c86'), 0, 0.63, j * 0.7));
  for (const y of [0.4, 0.97])
    gate.add(box(0.13, 0.1, 4, mat('#d6b99b'), 0, y, 2));
  const trailSign = sign('MOSSGLASS CAVE', '#d9ddc1', '#536563', 2.4, 0.55);
  trailSign.position.set(13.2, 1.8, -1.1);
  cavePath.add(trailSign);
  const moss = ball(
    0.3,
    new THREE.MeshStandardMaterial({
      color: '#a1d4b4',
      emissive: '#70a78f',
      emissiveIntensity: 0.6,
    }),
    17.5,
    0.4,
    2.6,
  );
  cavePath.add(moss);
  moss.scale.set(1.4, 0.3, 1.1);
  const setGate = (open, animate = false) => {
    entrance.setOpen(open, animate);
    gate.userData.open = open;
    gate.rotation.y = animate ? gate.rotation.y : open ? Math.PI / 2 : 0;
  };
  const finds = [];
  function spawn(item, method, x, z, uid) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.find = { item, method, uid };
    if (method === 'surface') {
      const object = treasure(item, 0.88);
      object.position.y = 0.04;
      object.rotation.y = Math.random() * 6.28;
      g.add(object);
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.39, 24),
        new THREE.MeshBasicMaterial({
          color: '#a99079',
          transparent: true,
          opacity: 0.11,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.025;
      g.add(shadow);
    } else {
      const mound = ball(0.49, mat('#e9cda5'), 0, 0.02, 0, 12);
      mound.scale.set(1, 0.21, 0.78);
      g.add(mound);
      if (
        method !== 'detector' &&
        method !== 'coil' &&
        method !== 'professional'
      ) {
        const nub = treasure(item, 0.32);
        nub.position.set(0, 0.055, 0);
        g.add(nub);
      } else {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.36, 28),
          new THREE.MeshBasicMaterial({
            color: '#ffe29a',
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.07;
        g.add(ring);
        g.userData.signal = ring;
        g.visible = false;
      }
    }
    scene.add(g);
    finds.push(g);
    return g;
  }
  function remove(g) {
    scene.remove(g);
    const i = finds.indexOf(g);
    if (i !== -1) finds.splice(i, 1);
  }
  function clearFinds() {
    for (const g of [...finds]) remove(g);
  }
  function update(t, scan, scanRange = 12, dt = 0.016) {
    entrance.update(dt);
    gate.rotation.y = (entrance.progress * Math.PI) / 2;
    const pos = oceanGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3],
        z = base[i * 3 + 2];
      pos.setY(
        i,
        Math.sin(z * 0.22 + t * 1.4 + x * 0.07) * 0.19 +
          Math.sin(x * 0.12 - t * 0.8) * 0.09,
      );
    }
    pos.needsUpdate = true;
    foam.forEach((m, i) => {
      m.material.opacity = 0.36 + Math.sin(t * 1.6 + i * 0.5) * 0.16;
      m.position.z = -16 - i * 0.46 + Math.sin(t * 0.7 + i) * 0.18;
    });
    for (const g of finds) {
      if (['detector', 'coil', 'professional'].includes(g.userData.find.method))
        g.visible = scan && g.position.distanceTo(camera.position) < scanRange;
      if (g.userData.signal)
        g.userData.signal.material.opacity =
          0.5 + 0.35 * Math.sin(t * 4 + g.position.x);
      else if (g.children[0] && g.userData.find.method === 'surface')
        g.children[0].rotation.y += 0.002;
    }
  }
  return {
    scene,
    camera,
    finds,
    spawn,
    remove,
    clearFinds,
    update,
    setGate,
    entrance,
    stations: { cottage, exchange, cave: V(14, 0, 1) },
  };
}

export function createShelfScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f9e9e1');
  const camera = new THREE.PerspectiveCamera(51, 1, 0.1, 100);
  camera.position.set(0, 2.45, 7.3);
  camera.lookAt(0, 2.2, -2.48);

  scene.add(new THREE.HemisphereLight('#fff6ea', '#c4b1ab', 1.8));
  const sun = new THREE.DirectionalLight('#fff0db', 2.2);
  sun.position.set(-3.8, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.bias = -0.0003;
  scene.add(sun);
  const fill = new THREE.PointLight('#ffd8bd', 16, 13, 2);
  fill.position.set(2.5, 4.3, 3.7);
  scene.add(fill);
  const wallMat = mat('#fff0df'),
    floorMat = mat('#e6c8ad'),
    woodMat = mat('#cda579');
  const trim = mat('#fbf0e3'),
    molding = mat('#efdbc8'),
    bronze = mat('#c99e72', 0.42, 0.16);
  const back = box(11, 7, 0.22, wallMat, 0, 3.25, -3.85);
  back.receiveShadow = true;
  scene.add(back);
  const side = box(0.22, 7, 11, wallMat, -5.15, 3.25, 0);
  side.receiveShadow = true;
  scene.add(side);
  const floor = box(11, 0.3, 11, floorMat, 0, -0.08, 0);
  scene.add(floor);
  // Cottage wainscoting and trim give structure without overwhelming the displayed finds.
  scene.add(rounded(10.8, 0.15, 0.2, 0.05, trim, 0, 0.67, -3.7));
  scene.add(rounded(10.8, 0.13, 0.2, 0.05, trim, 0, 0.16, -3.7));
  for (let x = -4.6; x <= 4.6; x += 0.85) {
    scene.add(rounded(0.055, 0.4, 0.055, 0.02, molding, x, 0.4, -3.67));
  }
  scene.add(rounded(10.6, 0.11, 0.22, 0.045, trim, 0, 4.8, -3.69));
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2, 48), mat('#e8b9c6'));
  rug.rotation.x = -Math.PI / 2;
  rug.scale.set(1.65, 1.02, 1);
  rug.position.set(0, 0.083, 2.25);
  scene.add(rug);
  const innerRug = new THREE.Mesh(
    new THREE.CircleGeometry(1.71, 48),
    mat('#f2d8d8'),
  );
  innerRug.rotation.x = -Math.PI / 2;
  innerRug.scale.set(1.6, 1, 1);
  innerRug.position.set(0, 0.085, 2.25);
  scene.add(innerRug);

  // A rounded, upholstered daybed anchors the side of the display room.
  const bed = new THREE.Group();
  bed.position.set(3.83, 0, 0.3);
  scene.add(bed);
  bed.add(rounded(1.95, 0.31, 2.55, 0.13, mat('#af8476'), 0, 0.37, 0));
  bed.add(rounded(1.81, 0.26, 2.4, 0.13, mat('#fff2e7'), 0, 0.56, 0));
  bed.add(rounded(1.81, 0.19, 1.36, 0.09, mat('#deb0bd'), 0, 0.75, 0.48));
  bed.add(rounded(1.92, 0.87, 0.2, 0.08, mat('#d4a9a2'), 0, 0.76, -1.19));
  for (const x of [-0.43, 0.43]) {
    const pillow = rounded(
      0.71,
      0.19,
      0.61,
      0.09,
      mat('#fffaf0'),
      x,
      0.77,
      -0.74,
    );
    pillow.rotation.z = x * 0.13;
    bed.add(pillow);
  }
  for (const x of [-0.83, 0.83])
    for (const z of [-1.05, 1.05])
      bed.add(rounded(0.12, 0.4, 0.14, 0.045, mat('#b28876'), x, 0.16, z));
  const displayFrame = new THREE.Group();
  scene.add(displayFrame);

  // Curved edges, plinth, backboard, arched top and satin inset colors.
  const cream = mat('#fff6e9'),
    edge = mat('#f1dbc8');
  displayFrame.add(rounded(5.7, 3.67, 0.31, 0.13, cream, 0, 2.19, -3.27));
  displayFrame.add(
    rounded(5.45, 3.39, 0.055, 0.1, mat('#f6e8dc'), 0, 2.18, -3.08),
  );
  displayFrame.add(rounded(5.83, 0.27, 1.1, 0.09, woodMat, 0, 0.86, -2.75));
  for (const x of [-2.74, 2.74]) {
    displayFrame.add(rounded(0.19, 3.71, 0.89, 0.075, woodMat, x, 2.35, -2.74));
    displayFrame.add(rounded(0.29, 0.16, 1.01, 0.05, cream, x, 4.21, -2.74));
    displayFrame.add(rounded(0.29, 0.2, 1.02, 0.055, woodMat, x, 0.58, -2.74));
  }
  const heights = [1.18, 2.13, 3.07];
  for (const y of heights) {
    const shelf = rounded(5.58, 0.17, 1.12, 0.068, woodMat, 0, y - 0.095, -2.7);
    displayFrame.add(shelf);
    displayFrame.add(
      rounded(5.52, 0.052, 0.085, 0.026, edge, 0, y - 0.056, -2.115),
    );
    for (const x of [-2.44, 2.44]) {
      const bracket = rounded(
        0.16,
        0.18,
        0.45,
        0.055,
        edge,
        x,
        y - 0.22,
        -2.56,
      );
      displayFrame.add(bracket);
    }
  }
  const crown = rounded(5.9, 0.26, 1.1, 0.09, woodMat, 0, 3.9, -2.73);
  displayFrame.add(crown);
  displayFrame.add(rounded(5.65, 0.095, 0.1, 0.032, edge, 0, 3.95, -2.12));
  for (const x of [-2.65, 2.65]) {
    displayFrame.add(ball(0.08, bronze, x, 3.97, -2.04));
  }
  // Delicate fairy lights suspend clear of every shelf surface (top y < 4.05).
  // Both wire and bulbs are in front of the wooden crown, never inside it.
  const garland = [],
    wirePoints = [],
    bulbMat = new THREE.MeshStandardMaterial({
      color: '#fff4cf',
      emissive: '#ffd89b',
      emissiveIntensity: 1.6,
      roughness: 0.22,
    });
  const glowMat = new THREE.SpriteMaterial({
    color: '#fff4c3',
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  for (let i = 0; i <= 16; i++) {
    const t = i / 16,
      x = -2.53 + t * 5.06,
      y = 4.2 - 0.075 * Math.sin(t * Math.PI * 3);
    const z = -2.01;
    wirePoints.push([x, y, z]);
    if (i % 2 === 0) {
      const bulb = new THREE.Group();
      bulb.position.set(x, y - 0.058, z);
      displayFrame.add(bulb);
      bulb.add(ball(0.053, bulbMat, 0, 0, 0));
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(0.28, 0.28, 1);
      bulb.add(glow);
      garland.push(bulb);
    }
  }
  displayFrame.add(curve(wirePoints, 0.011, mat('#a08a7b')));
  // Whimsical wall frames, foliage, and tiny seaside props.
  const flowerFrame = rounded(
    1.2,
    1.23,
    0.12,
    0.075,
    mat('#cfaa91'),
    -3.89,
    3.06,
    -3.56,
  );
  scene.add(flowerFrame);
  scene.add(rounded(1, 0.99, 0.045, 0.045, mat('#eef0df'), -3.89, 3.06, -3.48));
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const petal = ball(
      0.14,
      mat('#eab4be'),
      -3.89 + Math.sin(a) * 0.19,
      3.06 + Math.cos(a) * 0.19,
      -3.43,
    );
    petal.scale.set(1, 0.95, 0.4);
    scene.add(petal);
  }
  const center = ball(0.075, mat('#e6c676'), -3.89, 3.06, -3.39);
  center.scale.z = 0.55;
  scene.add(center);
  scene.add(rounded(1.08, 1.3, 0.11, 0.07, mat('#d9b89e'), 3.9, 2.88, -3.59));
  scene.add(rounded(0.87, 1.1, 0.06, 0.05, mat('#d0e7df'), 3.9, 2.88, -3.48));
  const wallSun = ball(0.28, mat('#f0d5a9'), 3.9, 3.06, -3.43);
  wallSun.scale.z = 0.25;
  scene.add(wallSun);
  const pot = rounded(0.55, 0.55, 0.5, 0.13, mat('#e7a7a9'), 3.9, 0.43, -2.7);
  scene.add(pot);
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7;
    const leaves = [
      [3.9, 0.72, -2.7],
      [3.9 + Math.cos(a) * 0.13, 1.1, -2.7 + Math.sin(a) * 0.13],
      [3.9 + Math.cos(a) * 0.4, 1.39, -2.7 + Math.sin(a) * 0.24],
    ];
    scene.add(curve(leaves, 0.028, mat('#83a78c')));
    const l = ball(
      0.13,
      mat('#9bbb9a'),
      leaves[2][0],
      leaves[2][1],
      leaves[2][2],
    );
    l.scale.set(1, 0.42, 0.77);
    scene.add(l);
  }
  scene.add(rounded(1.1, 0.46, 0.7, 0.12, mat('#b99b7f'), -3.91, 0.39, -2.78));
  for (let i = 0; i < 3; i++) {
    const p = rounded(
      0.12,
      0.31,
      0.13,
      0.045,
      mat('#f9e8d9'),
      -4.23 + i * 0.33,
      0.79,
      -2.67,
    );
    p.rotation.z = 0.08 * (i - 1);
    scene.add(p);
  }

  // The shelf remains interactive; all original saved coordinates still fit.
  const displays = new THREE.Group();
  scene.add(displays);
  const slotPositions = [];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 6; col++)
      slotPositions.push({
        x: -2.1 + col * 0.84,
        y: heights[row],
        z: -2.55,
        row,
      });
  function setWall(hex) {
    wallMat.color.set(hex);
    scene.background = new THREE.Color(hex).lerp(
      new THREE.Color('#ffffff'),
      0.11,
    );
  }
  function setWood(hex) {
    woodMat.color.set(hex);
  }
  function setLights(on) {
    for (const b of garland) b.visible = on;
  }
  function addDisplay(item, placement) {
    const model = treasure(item, 0.97);
    model.position.set(placement.x, placement.y, placement.z);
    model.rotation.y = placement.rotation || 0;
    model.userData.placementUid = placement.uid;
    model.traverse((m) => {
      m.userData.placementUid = placement.uid;
    });
    displays.add(model);
    return model;
  }
  function clearDisplay() {
    displays.clear();
  }
  const additions = new THREE.Group();
  scene.add(additions);
  let rewardDecor = createRewardDecor({ rewardDecor: [] });
  scene.add(rewardDecor);
  let wallpaperTexture = null,
    floorTexture = null,
    artTexture = null;
  const paintingFrame = rounded(1.85, 1.85, 0.14, 0.08, bronze, 0, 5.6, -3.52);
  scene.add(paintingFrame);
  paintingFrame.visible = false;
  const artPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({ color: '#fff0df' }),
  );
  artPlane.position.set(0, 5.6, -3.43);
  scene.add(artPlane);
  artPlane.visible = false;
  function setArtwork(pixels) {
    if (!pixels) return;
    artTexture?.dispose();
    const data = new Uint8Array(32 * 32 * 4);
    pixels.forEach((hex, i) => {
      const c = parseInt(hex.slice(1), 16);
      data[i * 4] = c >> 16;
      data[i * 4 + 1] = (c >> 8) & 255;
      data[i * 4 + 2] = c & 255;
      data[i * 4 + 3] = 255;
    });
    artTexture = new THREE.DataTexture(data, 32, 32);
    artTexture.colorSpace = THREE.SRGBColorSpace;
    artTexture.magFilter = THREE.NearestFilter;
    artTexture.minFilter = THREE.NearestFilter;
    artTexture.flipY = true;
    artTexture.needsUpdate = true;
    artPlane.material.map = artTexture;
    artPlane.material.needsUpdate = true;
    artPlane.visible = paintingFrame.visible = true;
  }
  function pattern(kind, base, isFloor = false) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#bba396';
    ctx.fillStyle = '#9cb6a1';
    ctx.lineWidth = 2;
    if (kind === 'stripe')
      for (let x = 0; x < 128; x += 24) {
        ctx.fillStyle = '#e3bcc677';
        ctx.fillRect(x, 0, 8, 128);
      }
    if (kind === 'botanical')
      for (let j = 0; j < 9; j++) {
        let x = (j % 3) * 43 + 12,
          y = Math.floor(j / 3) * 43 + 10;
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 13, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 14, 5, 12, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    if (kind === 'stars')
      for (let j = 0; j < 16; j++) {
        ctx.fillStyle = '#d2b16d';
        ctx.fillText('✧', (j % 4) * 32 + 9, Math.floor(j / 4) * 32 + 20);
      }
    if (kind === 'check') {
      for (let x = 0; x < 4; x++)
        for (let y = 0; y < 4; y++)
          if ((x + y) % 2) ctx.fillRect(x * 32, y * 32, 32, 32);
    }
    if (kind === 'oak')
      for (let y = 0; y < 128; y += 24) {
        ctx.strokeRect((y % 48) * 2, y, 128, 24);
      }
    if (kind === 'marble') {
      ctx.strokeStyle = '#cba5b4';
      for (let j = 0; j < 8; j++) {
        ctx.beginPath();
        ctx.moveTo(j * 23, 0);
        ctx.bezierCurveTo(j * 23 - 20, 40, j * 23 + 25, 70, j * 23 - 15, 128);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(isFloor ? 6 : 5, isFloor ? 6 : 3);
    return tex;
  }
  function customize(s) {
    setWall(SHOP_COLORS[s.wall]);
    setWood(WOODS[s.wood]);
    setLights(s.lights);
    wallpaperTexture?.dispose();
    floorTexture?.dispose();
    wallpaperTexture = floorTexture = null;
    if (s.wallpaper !== 'none') {
      wallpaperTexture = pattern(s.wallpaper, SHOP_COLORS[s.wall]);
      wallMat.map = wallpaperTexture;
    } else wallMat.map = null;
    wallMat.needsUpdate = true;
    if (s.floor !== 'original') {
      floorTexture = pattern(
        s.floor,
        s.floor === 'check'
          ? '#e9e7d6'
          : s.floor === 'marble'
            ? '#ead9d7'
            : '#dfc49e',
        true,
      );
      floorMat.map = floorTexture;
      floorMat.color.set('#ffffff');
    } else {
      floorMat.map = null;
      floorMat.color.set('#e6c8ad');
    }
    floorMat.needsUpdate = true;
    rug.material.color.set(
      s.rug === 'seafoam'
        ? '#a3c5b6'
        : s.rug === 'rose'
          ? '#cf9cae'
          : '#e8b9c6',
    );
    bed.children[2].material.color.set(
      s.accent === 'lilac'
        ? '#b5a0c5'
        : s.accent === 'sage'
          ? '#abc5ae'
          : '#deb0bd',
    );
    fill.color.set(s.lighting === 'moon' ? '#c2c9f2' : '#ffd8bd');
    // Only rebuild purchased furnishing geometry when the ownership set changes.
    const signature = JSON.stringify([
      s.purchases,
      s.rewardDecor,
      s.disabledRewards,
    ]);
    if (additions.userData.signature !== signature) {
      additions.traverse((o) => {
        if (o.isMesh) o.geometry.dispose();
      });
      additions.clear();
      additions.userData.signature = signature;
      scene.remove(rewardDecor);
      rewardDecor.traverse((o) => {
        if (o.isMesh && !o.userData.sharedTreasureGeometry)
          o.geometry.dispose();
      });
      rewardDecor = createRewardDecor(s);
      scene.add(rewardDecor);
      const extra = shelfSlots(s).slice(18),
        rows = new Map();
      for (const p of extra) {
        const key = p.y + ':' + p.z;
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push(p);
      }
      for (const row of rows.values()) {
        row.sort((a, b) => a.x - b.x);
        const runs = [];
        for (const p of row) {
          if (!runs.length || p.x - runs.at(-1).at(-1).x > 1.3) runs.push([]);
          runs.at(-1).push(p);
        }
        for (const run of runs) {
          const left = run[0].x - 0.4,
            right = run.at(-1).x + 0.4,
            y = run[0].y,
            z = run[0].z;
          additions.add(
            rounded(
              right - left,
              0.15,
              1.1,
              0.05,
              woodMat,
              (left + right) / 2,
              y - 0.085,
              z,
            ),
          );
          for (const x of [left - 0.07, right + 0.07])
            additions.add(
              rounded(0.1, 0.85, 0.95, 0.035, woodMat, x, y + 0.3, z),
            );
        }
      }
      if (owns(s, 'cabinet')) {
        const glass = new THREE.MeshPhysicalMaterial({
          color: '#dae7e3',
          transparent: true,
          opacity: 0.12,
          roughness: 0.14,
          depthWrite: false,
        });
        additions.add(box(4, 3.4, 0.035, glass, 0, 1.65, 0.82));
        for (const x of [-2, 2])
          additions.add(rounded(0.05, 3.5, 0.04, 0.015, bronze, x, 1.7, 0.85));
      }
      if (owns(s, 'roomExpansion')) {
        additions.add(box(6, 5, 0.2, wallMat, 8, 2.5, -3.85));
        additions.add(box(6, 0.3, 7, floorMat, 8, -0.08, -0.5));
        additions.add(rounded(1.3, 0.2, 1.3, 0.1, woodMat, 8, 0.45, 1.5));
      }
      if (owns(s, 'deluxeGallery')) {
        additions.add(box(9, 8, 0.2, wallMat, -7, 4, -3.85));
        additions.add(box(9, 0.3, 8, floorMat, -7, -0.08, 0));
      }
      if (owns(s, 'plants'))
        for (let j = 0; j < 3; j++) {
          const x = -4 + j * 1.1;
          additions.add(
            rounded(0.38, 0.38, 0.38, 0.08, mat('#d2b5aa'), x, 0.2, 0.9),
          );
          for (let k = 0; k < 5; k++) {
            const a = (k * Math.PI * 2) / 5;
            const leaf = ball(
              0.22,
              mat('#94b59b'),
              x + Math.sin(a) * 0.2,
              0.6 + Math.cos(a) * 0.15,
              0.9,
            );
            leaf.scale.set(0.5, 1.7, 0.35);
            additions.add(leaf);
          }
        }
      if (owns(s, 'ornaments'))
        for (let j = 0; j < 3; j++) {
          const o = treasure(
            {
              id: 'ornament-' + j,
              type: ['coral', 'seahorse', 'bunny'][j],
              color: ['#efb8bd', '#a6c5bb', '#d5c0da'][j],
              visual: {
                variant: 7,
                motif: 'pearl',
                accent: '#fff2dc',
                profile: 1,
              },
            },
            0.6,
          );
          o.position.set(-3 + j * 0.8, 0.12, 2);
          additions.add(o);
        }
      if (owns(s, 'wallGallery'))
        for (let j = 0; j < 3; j++) {
          const fx = [-3, -1.9, 3][j];
          additions.add(rounded(0.8, 0.85, 0.1, 0.05, bronze, fx, 5.7, -3.5));
          const art = treasure(
            {
              id: 'wall-mini-' + j,
              type: ['starfish', 'scallop', 'nautilus'][j],
              color: '#d9b4bb',
              visual: {
                variant: 9,
                motif: 'ridges',
                accent: '#fff1dd',
                profile: 1,
              },
            },
            0.7,
          );
          art.position.set(fx, 5.4, -3.35);
          art.rotation.x = Math.PI / 2;
          additions.add(art);
        }
    }
    setArtwork(s.artwork);
    const expanded =
      owns(s, 'secondShelf') ||
      owns(s, 'cabinet') ||
      owns(s, 'roomExpansion') ||
      owns(s, 'deluxeGallery');
    back.scale.x = expanded ? 2.2 : 1;
    back.scale.y = owns(s, 'deluxeGallery') ? 1.5 : 1;
    floor.scale.x = expanded ? 2.2 : 1;
    side.position.x = expanded ? -12 : -5.15;
    slotPositions.splice(0, slotPositions.length, ...shelfSlots(s));
  }
  return {
    scene,
    camera,
    displays,
    slotPositions,
    addDisplay,
    clearDisplay,
    setWall,
    setWood,
    setLights,
    heights,
    customize,
    setArtwork,
    update: (t) => rewardDecor.userData.update(t),
  };
}
