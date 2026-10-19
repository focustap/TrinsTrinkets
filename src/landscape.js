import * as T from 'three';
import { batch, grassClump, leafGeometry } from './scenery.js';
import { GROUND, sceneryRandom, softDiscTexture } from './surfaces.js';
import { grainTexture, fieldNoise, ambientTime } from './visuals.js';

const rockCache = new Map();
// Broad broken planes and uneven sediment bands replace the old round boulders.
export function cragGeometry(seed = 0) {
  seed %= 9;
  if (rockCache.has(seed)) return rockCache.get(seed);
  const g = new T.SphereGeometry(1, 18, 12),
    p = g.attributes.position;
  const colors = [],
    c = new T.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const n = fieldNoise(x * 2.8 + seed * 7, z * 2.8 + y * 1.2);
    const ledge =
      1 + 0.075 * Math.sin(y * 23 + seed) + 0.12 * Math.sin(y * 7 + seed);
    p.setXYZ(
      i,
      Math.sign(x) * Math.pow(Math.abs(x), 0.72) * (0.85 + n * 0.3) * ledge,
      y * (0.9 + n * 0.22),
      Math.sign(z) * Math.pow(Math.abs(z), 0.74) * (0.88 + n * 0.25) * ledge,
    );
    c.set('#c9c9bb').lerp(new T.Color('#8a9a99'), 0.2 + n * 0.42);
    const stratum = Math.sin(y * 29 + x * 2 + seed) * 0.045;
    c.multiplyScalar(0.91 + n * 0.25 + stratum);
    if (y > 0.28)
      c.lerp(new T.Color('#92996b'), Math.min(0.55, (y - 0.28) * 0.65));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  rockCache.set(seed, g);
  return g;
}
export function cragMaterial(color = '#b8b3a3') {
  return new T.MeshStandardMaterial({
    color,
    vertexColors: true,
    map: grainTexture(),
    roughness: 0.98,
  });
}

function windMaterial(color, strength, vertexColors = false) {
  const material = new T.MeshStandardMaterial({
    color,
    vertexColors,
    roughness: 0.92,
    side: T.DoubleSide,
  });
  const time = { value: 0 };
  material.userData.windTime = time;
  material.onBeforeCompile = (s) => {
    s.uniforms.breezeTime = time;
    s.vertexShader = 'uniform float breezeTime;\n' + s.vertexShader;
    s.vertexShader = s.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float flex=smoothstep(.1,5.,position.y);
      transformed.x+=sin(breezeTime*.65+position.z*.24+position.x*.1)*flex*${strength.toFixed(3)};
      transformed.z+=cos(breezeTime*.48+position.x*.2)*flex*${(strength * 0.35).toFixed(3)};`,
    );
  };
  material.customProgramCacheKey = () => 'coastal-breeze-' + strength;
  return material;
}
const bark = new T.MeshStandardMaterial({
  color: '#554a3d',
  map: grainTexture('wood'),
  roughness: 1,
});
const needles = windMaterial('#ffffff', 0.14, true);
const copper = windMaterial('#ffffff', 0.07, true);
export function updateFoliage(t) {
  needles.userData.windTime.value = ambientTime(t);
  copper.userData.windTime.value = ambientTime(t);
}
const treeCache = new Map();

export function coastalFir(variant = 0) {
  variant %= 5;
  if (treeCache.has(variant)) return treeCache.get(variant).clone(true);
  const group = new T.Group(),
    random = sceneryRandom(873 + variant * 61),
    h = 9 + variant * 0.65;
  const trunk = new T.Mesh(new T.CylinderGeometry(0.055, 0.21, h, 9, 5), bark);
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  group.add(trunk);
  const pos = [],
    colors = [],
    uvs = [],
    index = [],
    c = new T.Color();
  for (let level = 0; level < 12; level++) {
    const f = level / 12,
      y = h * (0.12 + f * 0.86),
      radius = h * 0.27 * Math.pow(1 - f, 0.8);
    for (let arm = 0; arm < 7; arm++) {
      const a = (arm * Math.PI * 2) / 7 + level * 1.77 + random() * 0.22;
      const r = radius * (0.72 + random() * 0.4),
        start = pos.length / 3;
      c.set(
        ['#435e4f', '#596d4c', '#687951', '#8a8d62'][Math.floor(random() * 4)],
      );
      c.multiplyScalar(0.88 + f * 0.2);
      for (let j = 0; j <= 5; j++) {
        const t = j / 5,
          width = Math.sin(t * Math.PI) * r * 0.37;
        for (const side of [-1, 0, 1]) {
          pos.push(
            Math.sin(a) * r * t + Math.cos(a) * width * side,
            y +
              Math.sin(t * Math.PI) * r * (side === 0 ? 0.47 : 0.12) -
              t * r * 0.19 +
              Math.sin(j * 2 + arm) * 0.035,
            Math.cos(a) * r * t - Math.sin(a) * width * side,
          );
          colors.push(c.r, c.g, c.b);
          uvs.push(t, (side + 1) / 2);
        }
        if (j < 5)
          for (let k = 0; k < 2; k++) {
            const p = start + j * 3 + k;
            index.push(p, p + 3, p + 1, p + 1, p + 3, p + 4);
          }
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const foliage = new T.Mesh(geo, needles);
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  group.add(foliage);
  group.name = 'coastal-fir';
  treeCache.set(variant, group);
  return group.clone(true);
}

const shrubCache = new Map();
export function autumnShrub(variant = 0) {
  variant %= 5;
  if (shrubCache.has(variant)) return shrubCache.get(variant).clone(true);
  const random = sceneryRandom(295 + variant * 71),
    group = new T.Group();
  for (let j = 0; j < 7; j++) {
    const a = j * 2.399,
      h = 0.75 + random() * 0.65,
      end = new T.Vector3(Math.sin(a) * 0.58, h, Math.cos(a) * 0.58);
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0, 0),
      new T.Vector3(end.x * 0.35, h * 0.55, end.z * 0.35),
      end,
    ]);
    group.add(new T.Mesh(new T.TubeGeometry(curve, 8, 0.014, 5, false), bark));
    for (let k = 2; k <= 10; k += 2) {
      const at = curve.getPoint(k / 10);
      for (const side of [-1, 1]) {
        const g = leafGeometry(
          0.16 + random() * 0.1,
          0.055,
          0.07,
          a + side * 0.8,
          4,
        );
        g.rotateZ(side * (0.5 + random() * 0.45));
        g.rotateY(a);
        g.translate(at.x, at.y, at.z);
        const p = g.attributes.position,
          colors = [],
          c = new T.Color(
            ['#98533e', '#b07543', '#756a43', '#b35b3e', '#7a493b'][
              (k + j + variant) % 5
            ],
          );
        for (let n = 0; n < p.count; n++) colors.push(c.r, c.g, c.b);
        g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
        group.add(new T.Mesh(g, copper));
      }
    }
  }
  batch(group);
  group.name = 'autumn-undergrowth';
  shrubCache.set(variant, group);
  return group.clone(true);
}

export function addCoastalLandscape(scene) {
  const random = sceneryRandom(5624),
    forest = new T.Group(),
    understory = new T.Group();
  for (const side of [-1, 1])
    for (let row = 0; row < 3; row++)
      for (let j = 0; j < 17; j++) {
        const tree = coastalFir(j + row),
          x = side * (18.3 + row * 5 + random() * 3),
          z = -16 + j * 2.9 + (random() - 0.5) * 2;
        if (side === 1 && x < 25 && z > -4.5 && z < 6.5) continue;
        tree.position.set(x, GROUND.beach - 0.22, z);
        tree.rotation.y = random() * 6.28;
        tree.scale.setScalar(0.72 + random() * 0.62 + row * 0.12);
        forest.add(tree);
      }
  // Tree-covered headlands frame the open water rather than sealing the cove.
  const distantMat = cragMaterial('#b8bdb3');
  for (const side of [-1, 1]) {
    const headland = new T.Mesh(cragGeometry(side + 3), distantMat);
    headland.position.set(side * 42, 1, -48);
    headland.scale.set(24, 7, 19);
    scene.add(headland);
    for (let j = 0; j < 18; j++) {
      const tree = coastalFir(j);
      tree.position.set(
        side * (27 + random() * 30),
        3 + random() * 2,
        -37 - random() * 16,
      );
      tree.scale.setScalar(0.55 + random() * 0.4);
      forest.add(tree);
    }
    for (let j = 0; j < 27; j++) {
      const shrub = autumnShrub(j);
      shrub.position.set(
        side * (12.7 + random() * 1.7),
        GROUND.beach - 0.01,
        -12 + j * 1.13,
      );
      shrub.rotation.y = random() * 6.28;
      shrub.scale.setScalar(0.8 + random() * 0.65);
      // Preserve the cave approach and the existing traversal corridor.
      if (side === 1 && shrub.position.z > -3.5 && shrub.position.z < 5.3)
        continue;
      understory.add(shrub);
    }
  }
  for (let j = 0; j < 26; j++) {
    const tree = coastalFir(j);
    tree.position.set(-29 + j * 2.4, GROUND.beach, 25 + random() * 9);
    tree.scale.setScalar(0.8 + random() * 0.5);
    forest.add(tree);
  }
  batch(forest);
  forest.name = 'coastal-forest';
  scene.add(forest);
  batch(understory);
  understory.name = 'autumn-banks';
  scene.add(understory);
  const grasses = new T.Group();
  for (let j = 0; j < 190; j++) {
    const side = j % 2 ? 1 : -1,
      x = side * (11.6 + random() * 3),
      z = -13 + random() * 32;
    if (side === 1 && z > -3 && z < 5) continue;
    if (z > 7 && ((x > -12 && x < -3) || (x > 4 && x < 11))) continue;
    const tuft = grassClump(j);
    tuft.position.set(x, GROUND.beach - 0.004, z);
    tuft.scale.setScalar(0.8 + random() * 0.65);
    tuft.rotation.y = random() * 6.28;
    grasses.add(tuft);
  }
  batch(grasses);
  grasses.name = 'coastal-verge';
  scene.add(grasses);
  const motes = addMotes(scene, {
    color: '#f4c485',
    count: 32,
    bounds: [28, 4, 28],
    origin: [0, 1, 1],
    opacity: 0.35,
  });
  const birds = [];
  for (let j = 0; j < 4; j++) {
    const shape = new T.Shape();
    shape.moveTo(-0.65, 0);
    shape.quadraticCurveTo(-0.3, 0.22, 0, 0.02);
    shape.quadraticCurveTo(0.3, 0.22, 0.65, 0);
    shape.quadraticCurveTo(0.25, 0.04, 0, -0.04);
    shape.quadraticCurveTo(-0.25, 0.04, -0.65, 0);
    const bird = new T.Mesh(
      new T.ShapeGeometry(shape),
      new T.MeshBasicMaterial({ color: '#3b5053', side: T.DoubleSide }),
    );
    bird.position.set(-12 + j * 6, 8 + j * 0.5, -38 - j * 3);
    scene.add(bird);
    birds.push(bird);
  }
  return {
    update(t) {
      t = ambientTime(t);
      updateFoliage(t);
      motes.update(t);
      birds.forEach((bird, j) => {
        bird.position.x = -12 + j * 6 + Math.sin(t * 0.035 + j) * 4;
        bird.position.y = 8 + j * 0.5 + Math.sin(t * 0.3 + j) * 0.16;
        bird.rotation.z = Math.sin(t * 0.25 + j) * 0.08;
      });
    },
  };
}

export function addMotes(
  scene,
  {
    color = '#e4d6b3',
    count = 36,
    bounds = [12, 5, 15],
    origin = [0, 0, 0],
    opacity = 0.3,
  } = {},
) {
  const random = sceneryRandom(823),
    positions = [],
    seeds = [];
  for (let j = 0; j < count; j++) {
    const p = [
      (random() - 0.5) * bounds[0] + origin[0],
      random() * bounds[1] + origin[1],
      (random() - 0.5) * bounds[2] + origin[2],
    ];
    positions.push(...p);
    seeds.push(p);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  const mesh = new T.Points(
    geo,
    new T.PointsMaterial({
      color,
      map: softDiscTexture(),
      size: 0.065,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  mesh.name = 'drifting-light';
  scene.add(mesh);
  return {
    update(t) {
      t = ambientTime(t);
      const p = geo.attributes.position;
      for (let j = 0; j < count; j++) {
        const s = seeds[j];
        p.setXYZ(
          j,
          s[0] + Math.sin(t * 0.13 + j) * 0.24,
          s[1] + Math.sin(t * 0.19 + j * 2) * 0.13,
          s[2] + Math.sin(t * 0.12 + j) * 0.15,
        );
      }
      p.needsUpdate = true;
    },
  };
}

export function paintBeachGround(geo) {
  const p = geo.attributes.position,
    colors = [],
    c = new T.Color();
  for (let j = 0; j < p.count; j++) {
    const x = p.getX(j),
      z = 3 - p.getY(j),
      n = fieldNoise(x * 0.22 + 4, z * 0.22 + 7);
    c.set('#c6b18a').lerp(new T.Color('#9c9b82'), n * 0.38);
    const edge = T.MathUtils.smoothstep(Math.abs(x), 10.7, 15.6);
    c.lerp(new T.Color('#727d61'), edge * 0.65);
    const path =
      Math.exp(-Math.pow((x + Math.max(0, z) * 0.52) / 1.05, 2)) * 0.16;
    c.multiplyScalar(1 - path);
    c.lerp(new T.Color('#adb1a6'), T.MathUtils.smoothstep(-z, 10, 16) * 0.24);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return geo;
}
