import * as THREE from 'three';
import {
  mergeGeometries,
  mergeVertices,
} from 'three/addons/utils/BufferGeometryUtils.js';
import { buildArtwork } from './artwork.js';

// Hand-built, softly sculpted 3D keepsakes. No external models or downloads.
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const materialCache = new Map(),
  geometryCache = new Map();
const shade = (color, roughness = 0.48, metalness = 0, extra = {}) => {
  const key = JSON.stringify([color, roughness, metalness, extra]);
  if (!materialCache.has(key))
    materialCache.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        metalness,
        clearcoat: 0.3,
        clearcoatRoughness: 0.26,
        ...extra,
      }),
    );
  return materialCache.get(key);
};
const ivory = shade('#fff2e3', 0.4),
  pink = shade('#ffe1dc', 0.42);
const gold = shade('#eac477', 0.27, 0.67),
  silver = shade('#cad5dc', 0.24, 0.73);
const add = (group, geometry, material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
};
const sphere = (
  g,
  r,
  material,
  x = 0,
  y = 0,
  z = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) => {
  if (!geometryCache.has(r))
    geometryCache.set(r, new THREE.SphereGeometry(r, 16, 12));
  const o = add(g, geometryCache.get(r), material, x, y, z);
  o.scale.set(sx, sy, sz);
  return o;
};
const tube = (g, points, radius, material, closed = false) => {
  const path = new THREE.CatmullRomCurve3(
    points.map((p) => v(...p)),
    closed,
    'centripetal',
  );
  return add(
    g,
    new THREE.TubeGeometry(
      path,
      Math.max(24, points.length * 6),
      radius,
      8,
      closed,
    ),
    material,
  );
};
function rim(g, points, radius, material, closed = false) {
  return tube(g, points, radius, material, closed);
}
function surface(g, rows, cols, point, material) {
  const vertices = [],
    indices = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const p = point(j / rows, i / cols);
      vertices.push(p[0], p[1], p[2]);
    }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i,
        b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return add(g, geo, material);
}
function heartShape(size = 0.23) {
  const s = new THREE.Shape();
  s.moveTo(0, -size * 0.88);
  s.bezierCurveTo(
    -size * 0.29,
    -size * 0.54,
    -size * 0.96,
    -size * 0.24,
    -size * 0.96,
    size * 0.31,
  );
  s.bezierCurveTo(
    -size * 0.96,
    size * 0.97,
    -size * 0.18,
    size * 1.13,
    0,
    size * 0.61,
  );
  s.bezierCurveTo(
    size * 0.18,
    size * 1.13,
    size * 0.96,
    size * 0.97,
    size * 0.96,
    size * 0.31,
  );
  s.bezierCurveTo(
    size * 0.96,
    -size * 0.24,
    size * 0.29,
    -size * 0.54,
    0,
    -size * 0.88,
  );
  return s;
}
function starShape(n = 5, outer = 0.32, inner = 0.13) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n,
      r = i % 2 ? inner : outer;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}
function pendant(g, shape, material, x = 0, y = 0.36, z = 0.06, depth = 0.065) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 16,
  });
  const m = add(g, geo, material, x, y, z);
  m.rotation.x = -0.22;
  return m;
}
function scallop(g, item, half = 0.43) {
  const main = shade(item.color, 0.46, 0, {
    clearcoat: 0.55,
    side: THREE.DoubleSide,
  });
  const under = shade(
    new THREE.Color(item.color).lerp(new THREE.Color('#fff5e9'), 0.42),
    0.65,
    0,
    { side: THREE.DoubleSide },
  );
  const point = (t, u, lower = false) => {
    const a = (u - 0.5) * 2.36;
    const r = 0.035 + half * t * (1 + 0.028 * Math.cos(a * 13));
    const x = Math.sin(a) * r;
    const z = -0.16 + Math.cos(a) * r * 0.76;
    const crest =
      0.19 +
      0.1 * Math.sin(Math.PI * t) +
      0.06 * Math.sin(Math.PI * u * 12) * Math.pow(t, 1.3);
    return [x, lower ? crest - 0.095 : crest, z];
  };
  surface(g, 18, 60, (t, u) => point(t, u), main);
  surface(g, 18, 60, (t, u) => point(t, u, true), under);
  const edge = [],
    hinge = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    edge.push(point(1, u));
    hinge.push(point(0.01, u));
  }
  rim(g, edge, 0.021, shade('#fff4e7', 0.35), false);
  for (let i = 0; i < 13; i++) {
    const u = 0.05 + (i / 12) * 0.9,
      trace = [];
    for (let j = 0; j <= 9; j++) {
      const p = point(0.12 + j * 0.097, u);
      trace.push([p[0], p[1] + 0.013, p[2]]);
    }
    tube(
      g,
      trace,
      0.008,
      i % 3 === 0
        ? ivory
        : shade(
            new THREE.Color(item.color).lerp(new THREE.Color('#fff5e7'), 0.35),
            0.42,
          ),
    );
  }
  sphere(g, 0.115, main, 0, 0.18, -0.17, 1, 0.43, 0.7);
}
function sandDollar(g, item) {
  const base = shade(item.color, 0.67, 0, { clearcoat: 0.15 });
  sphere(g, 0.38, base, 0, 0.205, 0, 1, 0.19, 0.96);
  const flower = shade('#e2d0b6', 0.8);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    const petal = sphere(
      g,
      0.115,
      flower,
      Math.sin(a) * 0.145,
      0.278,
      Math.cos(a) * 0.145,
      0.53,
      0.07,
      1.2,
    );
    petal.rotation.y = a;
  }
  sphere(g, 0.038, flower, 0, 0.28, 0, 1, 0.15, 1);
  for (let i = 0; i < 29; i++) {
    const a = (i * Math.PI * 2) / 29;
    sphere(
      g,
      0.013,
      ivory,
      Math.cos(a) * 0.31,
      0.266,
      Math.sin(a) * 0.3,
      1,
      0.35,
      1,
    );
  }
}
function moonShell(g, item) {
  scallop(g, item, 0.42);
  const line = [];
  for (let i = 0; i <= 75; i++) {
    const t = i / 75,
      a = t * Math.PI * 5.4,
      r = 0.015 + t * 0.16;
    line.push([
      Math.cos(a) * r,
      0.3 + Math.sin(a) * 0.006,
      0.07 + Math.sin(a) * r * 0.8,
    ]);
  }
  tube(g, line, 0.017, ivory);
}
function conch(g, item) {
  const base = shade(item.color, 0.38, 0, { clearcoat: 0.65 });
  const cream = shade('#fff1d9', 0.42);
  // Sweeping taper with a genuine spiral rather than stacked rings and a cone.
  const segments = 115,
    sides = 12,
    pts = [],
    idx = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments,
      a = t * Math.PI * 5.25,
      coil = 0.23 * (1 - t) + 0.015;
    const cx = (t - 0.45) * 0.45,
      cy = 0.37 + Math.cos(a) * coil * 0.57,
      cz = Math.sin(a) * coil * 0.72;
    const tubeRadius = 0.152 * Math.pow(1 - t, 0.82) + 0.013;
    for (let j = 0; j <= sides; j++) {
      const u = (j / sides) * Math.PI * 2;
      pts.push(
        cx + Math.cos(u) * tubeRadius * 0.62,
        cy + Math.sin(u) * tubeRadius * 0.73,
        cz + Math.cos(u) * tubeRadius * 0.83,
      );
      if (i < segments && j < sides) {
        const p = i * (sides + 1) + j,
          q = p + sides + 1;
        idx.push(p, q, p + 1, q, q + 1, p + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  add(g, geo, base);
  // A rolled open lip, with the warm inner shell showing inside.
  const lip = [],
    inner = [];
  for (let k = 0; k <= 32; k++) {
    const a = (k / 32) * Math.PI * 2;
    lip.push([
      -0.2 + 0.086 * Math.cos(a),
      0.37 + 0.127 * Math.sin(a),
      0.11 + 0.125 * Math.cos(a),
    ]);
    inner.push([
      -0.2 + 0.067 * Math.cos(a),
      0.37 + 0.09 * Math.sin(a),
      0.117 + 0.103 * Math.cos(a),
    ]);
  }
  rim(g, lip, 0.034, cream, true);
  rim(g, inner, 0.014, shade('#e7c6ac'), true);
  for (let i = 0; i < 19; i++) {
    const t = 0.09 + i * 0.043,
      a = t * Math.PI * 5.25,
      coil = 0.23 * (1 - t) + 0.015;
    sphere(
      g,
      0.019,
      cream,
      (t - 0.45) * 0.45 + 0.07,
      0.37 + Math.cos(a) * coil * 0.57,
      Math.sin(a) * coil * 0.72,
      1,
      0.8,
      1,
    );
  }
}
function glass(g, item) {
  const seed = item.id.length % 11;
  const geo = new THREE.IcosahedronGeometry(0.34, 2),
    pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const irregular =
      1 + 0.085 * Math.sin(14 * x + seed) + 0.045 * Math.cos(17 * z + seed);
    pos.setXYZ(
      i,
      x * irregular,
      y * 0.54 * irregular + 0.26,
      z * 0.91 * irregular,
    );
  }
  geo.computeVertexNormals();
  const m = shade(item.color, 0.26, 0, {
    transparent: true,
    opacity: 0.87,
    transmission: 0.09,
    thickness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    flatShading: false,
  });
  add(g, geo, m);
  sphere(
    g,
    0.065,
    shade('#ffffff', 0.1, 0, { transparent: true, opacity: 0.64 }),
    -0.08,
    0.39,
    0.12,
    1,
    0.2,
    0.62,
  );
}
function jewel(g, item) {
  const tint = shade(item.color, 0.28, 0, { clearcoat: 1 });
  const chain =
    item.id.includes('silver') || item.id.includes('moon') ? silver : gold;
  if (item.type === 'ring') {
    const band = add(
      g,
      new THREE.TorusGeometry(0.23, 0.055, 14, 46),
      chain,
      0,
      0.255,
      0,
    );
    band.rotation.x = -Math.PI / 2;
    const setting = add(
      g,
      new THREE.CylinderGeometry(0.125, 0.145, 0.065, 12),
      chain,
      0,
      0.31,
      -0.21,
    );
    const gem = add(
      g,
      new THREE.OctahedronGeometry(0.13, 1),
      tint,
      0,
      0.385,
      -0.21,
    );
    gem.scale.set(1, 0.48, 1);
    for (const x of [-0.085, 0.085]) sphere(g, 0.023, ivory, x, 0.41, -0.215);
    return;
  }
  if (item.type === 'bracelet') {
    const string = add(
      g,
      new THREE.TorusGeometry(0.285, 0.018, 8, 48),
      chain,
      0,
      0.25,
      0,
    );
    string.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 15; i++) {
      const a = (i * 2 * Math.PI) / 15;
      const beadColor = item.id.includes('pearl')
        ? ivory
        : i % 4 === 0
          ? ivory
          : i % 4 === 1
            ? pink
            : tint;
      sphere(
        g,
        0.075,
        beadColor,
        Math.cos(a) * 0.285,
        0.29,
        Math.sin(a) * 0.285,
      );
      if (i % 3 === 0)
        sphere(g, 0.026, gold, Math.cos(a) * 0.285, 0.366, Math.sin(a) * 0.285);
    }
    if (item.id.includes('shell')) {
      const charm = scallopCharm(g);
      charm.position.set(0, 0.28, -0.37);
    } else if (item.id.includes('beaded')) {
      const heart = pendant(g, heartShape(0.1), gold, 0.02, 0.2, -0.38, 0.03);
      heart.scale.setScalar(0.72);
    }
    return;
  }
  // Pendants and charms all have their own meaningful silhouette.
  if (item.id.includes('moon')) {
    const disk = add(
      g,
      new THREE.TorusGeometry(0.21, 0.1, 20, 60),
      chain,
      0,
      0.36,
      0,
    );
    disk.rotation.x = -0.23;
    sphere(g, 0.23, shade('#f4e8e6'), 0.13, 0.46, 0.06, 1, 1, 0.46);
    sphere(g, 0.045, ivory, -0.12, 0.48, 0.14);
  } else if (item.id.includes('star')) {
    pendant(g, starShape(5, 0.3, 0.14), chain, 0, 0.39, 0, 0.05);
    sphere(g, 0.055, ivory, 0, 0.39, 0.12);
  } else {
    pendant(g, heartShape(0.27), chain, 0, 0.38, 0.02, 0.058);
    const inlay = pendant(g, heartShape(0.18), tint, 0, 0.38, 0.14, 0.03);
    inlay.scale.setScalar(0.91);
  }
  const loop = add(
    g,
    new THREE.TorusGeometry(0.068, 0.021, 8, 20),
    chain,
    0,
    0.69,
    0,
  );
  loop.rotation.x = -0.16;
  if (item.id.includes('necklace') || item.id.includes('pendant')) {
    const points = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28,
        a = Math.PI * t;
      points.push([Math.cos(a) * 0.36, 0.68 + Math.sin(a) * 0.13, -0.04]);
    }
    rim(g, points, 0.012, chain);
  }
}
function scallopCharm(g) {
  const c = new THREE.Group();
  g.add(c);
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * 0.63;
    tube(
      c,
      [
        [0, 0, 0],
        [a * 0.12, 0.06, 0.09],
        [a * 0.17, 0.11, 0.2],
      ],
      0.024,
      ivory,
    );
  }
  return c;
}
function embossedCoin(g, item) {
  const base = shade(item.color, 0.37, 0.28),
    edge = shade('#efcf92', 0.28, 0.65);
  const disk = add(
    g,
    new THREE.CylinderGeometry(0.29, 0.29, 0.068, 44),
    base,
    0,
    0.29,
    0,
  );
  disk.rotation.x = Math.PI / 2;
  disk.rotation.y = 0.15;
  rim(
    g,
    Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return [Math.cos(a) * 0.265, 0.29 + Math.sin(a) * 0.265, 0.045];
    }),
    0.016,
    edge,
    true,
  );
  const pattern =
    item.id === 'blue-button'
      ? new THREE.TorusGeometry(0.12, 0.025, 10, 32)
      : new THREE.OctahedronGeometry(0.15, 0);
  const motif = add(g, pattern, edge, 0, 0.29, 0.062);
  if (item.id !== 'blue-button') motif.scale.set(1, 0.95, 0.2);
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    sphere(g, 0.013, edge, Math.cos(a) * 0.22, 0.29 + Math.sin(a) * 0.22, 0.08);
  }
}
function antiqueKey(g, item) {
  const bronze = shade(item.color, 0.3, 0.62);
  const bow = add(
    g,
    new THREE.TorusGeometry(0.144, 0.04, 12, 32),
    bronze,
    -0.24,
    0.42,
    0,
  );
  bow.rotation.z = 0.12;
  tube(
    g,
    [
      [-0.11, 0.4, 0],
      [0.07, 0.39, 0],
      [0.26, 0.37, 0],
      [0.45, 0.37, 0],
    ],
    0.048,
    bronze,
  );
  for (const x of [0.27, 0.41]) {
    tube(
      g,
      [
        [x, 0.38, 0],
        [x, 0.26, 0],
        [x + 0.047, 0.26, 0],
      ],
      0.035,
      bronze,
    );
  }
  sphere(g, 0.05, ivory, -0.24, 0.42, 0, 1, 0.4, 1);
}
function starfish(g, item) {
  const s = starShape(5, 0.4, 0.18),
    material = shade(item.color, 0.64, 0, { clearcoat: 0.26 });
  const shape = new THREE.ExtrudeGeometry(s, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelThickness: 0.035,
    bevelSize: 0.06,
    curveSegments: 12,
  });
  const o = add(g, shape, material, 0, 0.25, 0);
  o.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    for (let k = 1; k <= 3; k++) {
      const d = 0.12 + k * 0.055;
      sphere(
        g,
        0.021,
        ivory,
        Math.cos(a) * d,
        0.38,
        Math.sin(a) * d,
        1,
        0.43,
        1,
      );
    }
  }
  sphere(g, 0.07, shade('#ffd6b7'), 0, 0.39, 0, 1, 0.55, 1);
}
function oyster(g, item) {
  const base = shade(item.color, 0.5),
    inside = shade('#fff8ee', 0.2, 0, { clearcoat: 1 });
  scallop(g, item, 0.42);
  const inner = sphere(g, 0.23, inside, 0, 0.275, 0.04, 1, 0.25, 0.72);
  sphere(g, 0.17, shade('#fff8ed', 0.12, 0, { clearcoat: 1 }), 0, 0.41, 0.075);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    sphere(
      g,
      0.019,
      ivory,
      Math.cos(a) * 0.1,
      0.54,
      Math.sin(a) * 0.09 + 0.075,
      1,
      0.65,
      1,
    );
  }
}
function fossil(g, item) {
  const stone = shade(item.color, 0.68),
    light = shade('#f4e9d3', 0.55);
  const coil = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90,
      a = t * Math.PI * 6.9,
      r = 0.015 + t * 0.33;
    coil.push([Math.cos(a) * r, 0.23 + 0.048 * t, Math.sin(a) * r]);
  }
  rim(g, coil, 0.041, stone);
  rim(
    g,
    coil.map(([x, y, z]) => [x, y + 0.032, z]),
    0.012,
    light,
  );
  for (let i = 0; i < 11; i++) {
    const a = (i * Math.PI * 2) / 11;
    sphere(
      g,
      0.035,
      stone,
      Math.cos(a) * 0.3,
      0.25,
      Math.sin(a) * 0.29,
      0.7,
      0.35,
      1,
    );
  }
}
function sharkTooth(g, item) {
  const tooth = new THREE.Shape();
  tooth.moveTo(-0.24, 0.2);
  tooth.quadraticCurveTo(-0.17, 0.4, -0.09, 0.34);
  tooth.quadraticCurveTo(0, 0.49, 0.09, 0.34);
  tooth.quadraticCurveTo(0.17, 0.4, 0.25, 0.2);
  tooth.quadraticCurveTo(0.13, 0.21, 0, -0.35);
  tooth.quadraticCurveTo(-0.1, 0.05, -0.24, 0.2);
  const o = pendant(g, tooth, shade(item.color, 0.42), 0, 0.41, 0.01, 0.06);
  o.rotation.x = -Math.PI / 2.7;
  const gum = shade('#d2c4ab', 0.7);
  tube(
    g,
    [
      [-0.2, 0.48, 0.03],
      [-0.08, 0.51, 0.04],
      [0.08, 0.51, 0.04],
      [0.2, 0.48, 0.03],
    ],
    0.036,
    gum,
  );
}
function bottle(g) {
  const shape = [
    new THREE.Vector2(0, 0.05),
    new THREE.Vector2(0.14, 0.05),
    new THREE.Vector2(0.19, 0.1),
    new THREE.Vector2(0.21, 0.32),
    new THREE.Vector2(0.19, 0.46),
    new THREE.Vector2(0.1, 0.54),
    new THREE.Vector2(0.095, 0.69),
    new THREE.Vector2(0.12, 0.72),
  ];
  const body = add(
    g,
    new THREE.LatheGeometry(shape, 28),
    shade('#addbd4', 0.14, 0, {
      transparent: true,
      opacity: 0.67,
      transmission: 0.16,
      thickness: 0.55,
      clearcoat: 1,
    }),
  );
  sphere(g, 0.11, shade('#efe5c8'), 0, 0.3, 0, 1, 1.3, 0.6);
  const scroll = add(
    g,
    new THREE.CylinderGeometry(0.088, 0.088, 0.25, 16),
    shade('#f4e3c5'),
    0,
    0.33,
    0,
  );
  scroll.rotation.z = 0.25;
  const cork = add(
    g,
    new THREE.CylinderGeometry(0.11, 0.095, 0.16, 20),
    shade('#b79870', 0.9),
    0,
    0.77,
    0,
  );
  sphere(g, 0.035, ivory, -0.08, 0.6, 0.09);
}
const templates = new Map();
export function createTreasure(item, scale = 1) {
  if (templates.has(item.id)) {
    const copy = templates.get(item.id).clone(true);
    copy.scale.setScalar(scale);
    return copy;
  }
  const g = new THREE.Group();
  if (buildArtwork(g, item)) {
  } else if (item.id === 'sand-dollar') sandDollar(g, item);
  else if (item.id === 'moon-shell') moonShell(g, item);
  else if (item.type === 'scallop' || item.type === 'shell') scallop(g, item);
  else if (item.type === 'conch') conch(g, item);
  else if (item.type === 'glass') glass(g, item);
  else if (['ring', 'bracelet', 'charm'].includes(item.type)) jewel(g, item);
  else if (item.type === 'coin') embossedCoin(g, item);
  else if (item.type === 'key') antiqueKey(g, item);
  else if (item.type === 'starfish') starfish(g, item);
  else if (item.type === 'pearl') oyster(g, item);
  else if (item.type === 'fossil') fossil(g, item);
  else if (item.type === 'tooth') sharkTooth(g, item);
  else if (item.type === 'bottle') bottle(g);
  // All keepsakes rest on the shelf instead of hovering above it.
  // Keep the group's origin at ground level so existing saved placements still work.
  const bounds = new THREE.Box3().setFromObject(g);
  if (Number.isFinite(bounds.min.y)) {
    for (const child of g.children) child.position.y -= bounds.min.y;
  }
  const size = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
  const fit = Math.min(1, 0.74 / Math.hypot(size.x, size.z), 0.72 / size.y);
  for (const child of g.children) {
    child.position.multiplyScalar(fit);
    child.scale.multiplyScalar(fit);
  }
  // Every treasure is rigid. Bake its tiny beads/ribs/chain links into one mesh
  // per material, keeping a full cottage from becoming thousands of draw calls.
  g.updateMatrixWorld(true);
  const batches = new Map();
  g.traverse((object) => {
    if (!object.isMesh) return;
    const geometry = object.geometry.index
      ? object.geometry.toNonIndexed()
      : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    for (const key of Object.keys(geometry.attributes)) {
      if (!['position', 'normal', 'uv', 'color'].includes(key))
        geometry.deleteAttribute(key);
    }
    if (!geometry.attributes.uv)
      geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(
          new Float32Array(geometry.attributes.position.count * 2),
          2,
        ),
      );
    if (!object.material.vertexColors) geometry.deleteAttribute('color');
    const key = object.material.uuid;
    if (!batches.has(key))
      batches.set(key, { material: object.material, geometries: [] });
    batches.get(key).geometries.push(geometry);
  });
  g.clear();
  for (const batch of batches.values()) {
    const combined = mergeGeometries(batch.geometries, false);
    const geometry = mergeVertices(combined, 1e-5);
    combined.dispose();
    add(g, geometry, batch.material);
    batch.geometries.forEach((geometry) => geometry.dispose());
  }
  const bakedFloor = new THREE.Box3().setFromObject(g).min.y;
  for (const child of g.children) child.geometry.translate(0, -bakedFloor, 0);
  g.userData.itemId = item.id;
  templates.set(item.id, g);
  const copy = g.clone(true);
  copy.scale.setScalar(scale);
  return copy;
}
