import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cache = new Map();
const material = (color) =>
  new T.MeshStandardMaterial({ color, roughness: 0.85, side: T.DoubleSide });
const stemMat = material('#728d62'),
  leafMat = material('#88a477'),
  woodMat = material('#a78d76');

export function batch(group) {
  group.updateMatrixWorld(true);
  const batches = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!g.attributes.uv)
      g.setAttribute(
        'uv',
        new T.Float32BufferAttribute(
          new Float32Array(g.attributes.position.count * 2),
          2,
        ),
      );
    if (!batches.has(o.material)) batches.set(o.material, []);
    batches.get(o.material).push(g);
  });
  group.clear();
  for (const [mat, geometries] of batches) {
    const mixedIndices = geometries.some(
      (g) => Boolean(g.index) !== Boolean(geometries[0].index),
    );
    const inputs = mixedIndices
      ? geometries.map((g) => (g.index ? g.toNonIndexed() : g))
      : geometries;
    const merged = mergeGeometries(inputs, false);
    const mesh = new T.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (mixedIndices)
      for (const g of inputs) if (!geometries.includes(g)) g.dispose();
    for (const g of geometries) g.dispose();
  }
  return group;
}

export function leafGeometry(
  height = 0.5,
  width = 0.07,
  bend = 0.25,
  angle = 0,
  segments = 10,
) {
  const vertices = [],
    indices = [];
  for (let j = 0; j <= segments; j++) {
    const u = j / segments,
      w = Math.sin(Math.PI * u) ** 0.8 * width;
    for (const side of [-1, 0, 1])
      vertices.push(
        Math.sin(angle) * bend * u * u + Math.cos(angle) * w * side,
        height * u + 0.025 * Math.sin(Math.PI * u) * (1 - Math.abs(side)),
        Math.cos(angle) * bend * u * u - Math.sin(angle) * w * side,
      );
    if (j < segments)
      for (let k = 0; k < 2; k++) {
        const a = j * 3 + k;
        indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function grassClump(variant = 0) {
  const key = 'grass-' + (variant % 5);
  if (cache.has(key)) return cache.get(key).clone(true);
  const group = new T.Group();
  for (let j = 0; j < 7; j++) {
    const a = j * 2.399 + variant * 0.7,
      h = 0.28 + (j % 4) * 0.085;
    const blade = new T.Mesh(
      leafGeometry(h, 0.035 + (j % 3) * 0.012, 0.16 + (j % 3) * 0.06, a),
      j % 2 ? leafMat : stemMat,
    );
    blade.position.set(Math.sin(a) * 0.055, 0, Math.cos(a) * 0.055);
    group.add(blade);
  }
  batch(group);
  group.name = 'dune-grass';
  cache.set(key, group);
  return group.clone(true);
}

export function wildflower(color = '#e6adbd', variant = 0) {
  const key = 'flower-' + color + (variant % 3);
  if (cache.has(key)) return cache.get(key).clone(true);
  const group = new T.Group(),
    h = 0.43 + (variant % 3) * 0.045;
  const stem = new T.Mesh(
    new T.TubeGeometry(
      new T.CatmullRomCurve3([
        new T.Vector3(0, 0, 0),
        new T.Vector3(-0.025, h * 0.5, 0.015),
        new T.Vector3(0.025, h, 0),
      ]),
      12,
      0.014,
      6,
      false,
    ),
    stemMat,
  );
  group.add(stem);
  for (const sign of [-1, 1]) {
    const leaf = new T.Mesh(
      leafGeometry(0.17, 0.055, 0.15, (sign * Math.PI) / 2),
      leafMat,
    );
    leaf.position.y = h * 0.24;
    group.add(leaf);
  }
  const petals = material(color),
    center = material('#d7ad60');
  for (let j = 0; j < 5; j++) {
    const a = (j * Math.PI * 2) / 5;
    const petal = new T.Mesh(new T.SphereGeometry(1, 12, 8), petals);
    petal.scale.set(0.071, 0.115, 0.025);
    petal.rotation.z = -a;
    petal.position.set(
      0.025 + Math.sin(a) * 0.082,
      h + Math.cos(a) * 0.082,
      0.008,
    );
    group.add(petal);
  }
  const disk = new T.Mesh(new T.SphereGeometry(0.047, 12, 8), center);
  disk.scale.z = 0.45;
  disk.position.set(0.025, h, -0.025);
  group.add(disk);
  const back = disk.clone();
  back.position.z = 0.04;
  group.add(back);
  batch(group);
  group.name = 'coastal-wildflower';
  cache.set(key, group);
  return group.clone(true);
}

export function driftwood(variant = 0) {
  const group = new T.Group(),
    length = 0.85 + (variant % 3) * 0.22;
  const points = [
    [-length / 2, 0.055, 0],
    [-length * 0.15, 0.08, 0.025],
    [length * 0.2, 0.06, -0.018],
    [length / 2, 0.045, 0.04],
  ];
  const branch = (p, r) =>
    new T.Mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(p.map((v) => new T.Vector3(...v))),
        18,
        r,
        9,
        false,
      ),
      woodMat,
    );
  group.add(branch(points, 0.055));
  group.add(
    branch(
      [
        [0.12, 0.065, 0],
        [0.2, 0.09, 0.13],
        [0.35, 0.045, 0.23],
      ],
      0.027,
    ),
  );
  batch(group);
  group.name = 'weathered-driftwood';
  return group;
}

export function pottedPlant(variant = 0) {
  const group = new T.Group();
  const pot = new T.Mesh(
    new T.CylinderGeometry(0.21, 0.15, 0.34, 24),
    material(['#c5a59b', '#b9b89c', '#cfb6a7'][variant % 3]),
  );
  pot.position.y = 0.17;
  group.add(pot);
  const lip = new T.Mesh(
    new T.TorusGeometry(0.203, 0.025, 8, 24),
    pot.material,
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.32;
  group.add(lip);
  const soil = new T.Mesh(new T.CircleGeometry(0.185, 24), material('#77695b'));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.325;
  group.add(soil);
  for (let j = 0; j < 9; j++) {
    const leaf = new T.Mesh(
      leafGeometry(0.45 + (j % 3) * 0.1, 0.065, 0.2, j * 2.399 + variant),
      leafMat,
    );
    leaf.position.y = 0.32;
    group.add(leaf);
  }
  return batch(group);
}

export function waterLily(variant = 0) {
  const group = new T.Group(),
    padMat = material('#679f91'),
    petalMat = material(variant % 2 ? '#e0b4cd' : '#e6c9db');
  const pad = new T.Mesh(
    new T.CircleGeometry(0.3, 32, 0.14, Math.PI * 1.87),
    padMat,
  );
  pad.rotation.x = -Math.PI / 2;
  group.add(pad);
  for (let layer = 0; layer < 2; layer++)
    for (let j = 0; j < 7; j++) {
      const a = (j * Math.PI * 2) / 7 + layer * 0.4,
        petal = new T.Mesh(new T.SphereGeometry(1, 12, 8), petalMat);
      petal.scale.set(0.045, 0.025, 0.105 - layer * 0.025);
      petal.rotation.y = a;
      petal.rotation.x = layer ? -0.3 : 0;
      petal.position.set(
        Math.sin(a) * (0.08 - layer * 0.03),
        0.025 + layer * 0.035,
        Math.cos(a) * (0.08 - layer * 0.03),
      );
      group.add(petal);
    }
  const heart = new T.Mesh(
    new T.SphereGeometry(0.033, 12, 8),
    material('#dfc37c'),
  );
  heart.scale.y = 0.7;
  heart.position.y = 0.07;
  group.add(heart);
  return batch(group);
}
