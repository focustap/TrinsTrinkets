import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildMoonpool } from './moonpool-art.js';
const V = (x, y, z) => new T.Vector3(x, y, z),
  TAU = Math.PI * 2;
const materials = new Map(),
  geometries = new Map();
function mat(c, r = 0.42, m = 0, e = {}) {
  const key = JSON.stringify([c, r, m, e]);
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshPhysicalMaterial({
        color: c,
        roughness: r,
        metalness: m,
        clearcoat: 0.55,
        ...e,
      }),
    );
  return materials.get(key);
}
const gold = mat('#d9b77c', 0.25, 0.72),
  silver = mat('#c6d5de', 0.24, 0.75),
  ivory = mat('#fff0dd', 0.23, 0, { iridescence: 0.45 });
function mesh(g, geo, m, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  g.add(o);
  return o;
}
function orb(g, m, x, y, z, sx = 0.1, sy = sx, sz = sx) {
  if (!geometries.has('sphere'))
    geometries.set('sphere', new T.SphereGeometry(1, 16, 12));
  const o = mesh(g, geometries.get('sphere'), m, x, y, z);
  o.scale.set(sx, sy, sz);
  return o;
}
function box(g, m, w, h, d, x = 0, y = 0, z = 0) {
  return mesh(
    g,
    new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.16),
    m,
    x,
    y,
    z,
  );
}
function tube(g, pts, r, m, closed = false) {
  return mesh(
    g,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(
        pts.map((p) => V(...p)),
        closed,
      ),
      Math.max(24, pts.length * 3),
      r,
      6,
      closed,
    ),
    m,
  );
}
function ring(g, m, r = 0.28, t = 0.018, x = 0, y = 0.1, z = 0, angle = TAU) {
  const o = mesh(g, new T.TorusGeometry(r, t, 8, 48, angle), m, x, y, z);
  o.rotation.x = -Math.PI / 2;
  return o;
}
function poly(g, points, m, depth = 0.065) {
  const extent = Math.max(...points.flat().map(Math.abs));
  const s = new T.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return mesh(
    g,
    new T.ExtrudeGeometry(s, {
      depth: Math.min(depth, extent * 0.3),
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: Math.min(0.024, extent * 0.08),
      bevelThickness: Math.min(0.024, extent * 0.08),
    }),
    m,
  );
}
function heart(g, m, size = 0.25) {
  const s = new T.Shape();
  s.moveTo(0, -size);
  s.bezierCurveTo(-size * 2, size * 0.2, -size, size * 1.9, 0, size * 0.55);
  s.bezierCurveTo(size, size * 1.9, size * 2, size * 0.2, 0, -size);
  return mesh(
    g,
    new T.ExtrudeGeometry(s, {
      depth: 0.075,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 3,
      curveSegments: 20,
    }),
    m,
  );
}
function star(g, m, n = 5, r = 0.25) {
  return poly(
    g,
    Array.from({ length: n * 2 }, (_, i) => {
      const a = (i * Math.PI) / n;
      return [
        Math.sin(a) * (i % 2 ? r * 0.45 : r),
        Math.cos(a) * (i % 2 ? r * 0.45 : r),
      ];
    }),
    m,
  );
}
function surface(g, point, m, rows = 28, cols = 64) {
  const p = [],
    ix = [];
  for (let j = 0; j <= rows; j++)
    for (let k = 0; k <= cols; k++) p.push(...point(j / rows, k / cols));
  for (let j = 0; j < rows; j++)
    for (let k = 0; k < cols; k++) {
      let a = j * (cols + 1) + k,
        b = a + cols + 1;
      ix.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  return mesh(g, geo, m);
}
function petal(g, m, x, y, z, a, len = 0.2) {
  const o = orb(g, m, x, y, z, 0.055, 0.035, len);
  o.rotation.y = a;
  return o;
}
function flower(g, m, n = 6, r = 0.12, y = 0.12) {
  for (let k = 0; k < n; k++) {
    let a = (k * TAU) / n;
    petal(g, m, Math.sin(a) * r, y, Math.cos(a) * r, a, r * 0.85);
  }
  orb(g, gold, 0, y + 0.015, 0, 0.045);
}
function gemstone(g, m, n = 8, x = 0, y = 0.18, z = 0, r = 0.12, h = 0.17) {
  const o = mesh(g, new T.CylinderGeometry(r * 0.6, r, h, n, 1), m, x, y, z);
  const cap = mesh(
    g,
    new T.ConeGeometry(r, h * 0.55, n),
    m,
    x,
    y + h * 0.65,
    z,
  );
  cap.rotation.y = Math.PI / n;
  return o;
}
function chain(g, r = 0.27, y = 0.08, n = 26) {
  for (let k = 0; k < n; k++) {
    const a = (k * TAU) / n;
    const o = mesh(
      g,
      new T.TorusGeometry(0.027, 0.008, 5, 10),
      gold,
      Math.sin(a) * r,
      y,
      Math.cos(a) * r,
    );
    o.rotation.set(Math.PI / 2 + ((k % 2) * Math.PI) / 2, a, 0);
  }
}
function shell(g, i) {
  const { variant: n, profile: p } = i.visual,
    t = i.type,
    c = mat(i.color, 0.36, 0, {
      iridescence: 0.65,
      iridescenceIOR: 1.34,
      side: T.DoubleSide,
    }),
    lip = mat(i.visual.accent, 0.28, 0, { iridescence: 0.7 });
  if (
    ['conch', 'whelk', 'auger', 'murex', 'topshell', 'nautilus'].includes(t)
  ) {
    const flat = t === 'nautilus',
      turns = t === 'auger' ? 4.5 : flat ? 2.4 : 2.8;
    const point = (u, w) => {
      const a = u * TAU * turns,
        r = 0.025 * Math.exp(u * 2.5),
        th = 0.012 + r * 0.53,
        b = w * TAU,
        height = t === 'auger' ? 0.95 : t === 'topshell' ? 0.58 : 0.72;
      return flat
        ? [
            Math.cos(a) * r + Math.cos(a) * Math.cos(b) * th,
            0.23 + Math.sin(b) * th * 0.65,
            Math.sin(a) * r + Math.sin(a) * Math.cos(b) * th,
          ]
        : [
            Math.cos(a) * r + Math.cos(a) * Math.cos(b) * th,
            0.13 + (1 - u) * height + Math.sin(b) * th * 0.85,
            Math.sin(a) * r + Math.sin(a) * Math.cos(b) * th,
          ];
    };
    const o = surface(g, point, c, 100, 16);
    o.geometry.setAttribute(
      'color',
      new T.Float32BufferAttribute(
        Array.from({ length: o.geometry.attributes.position.count }, (_, j) => {
          const col = new T.Color(i.color).lerp(
            new T.Color(i.visual.accent),
            0.18 + 0.27 * Math.sin((j / 17) * 0.23) ** 2,
          );
          return [col.r, col.g, col.b];
        }).flat(),
        3,
      ),
    );
    o.material = mat(i.color, 0.36, 0, {
      vertexColors: true,
      iridescence: 0.65,
      side: T.DoubleSide,
    });
    tube(
      g,
      Array.from({ length: 49 }, (_, k) => point(1, k / 48)),
      0.023,
      lip,
      true,
    );
    for (let j = 0; j < n; j++) {
      const u = 0.22 + (0.76 * j) / n;
      const ridge = Array.from({ length: 17 }, (_, k) => point(u, k / 16));
      tube(g, ridge, t === 'auger' ? 0.009 : 0.012, lip, true);
      if (t === 'murex') {
        const b = point(u, 0.2);
        tube(
          g,
          [
            b,
            [b[0] * 1.3, b[1] + 0.06, b[2] * 1.3],
            [b[0] * 1.7, b[1] + 0.1, b[2] * 1.7],
          ],
          0.018,
          lip,
        );
      }
    }
    if (t === 'conch' || t === 'whelk') {
      const q = new T.Group();
      g.add(q);
      surface(
        q,
        (u, w) => {
          const a = (w - 0.5) * 2.2,
            r = 0.1 + u * 0.24;
          return [
            0.24 + Math.sin(a) * r,
            0.15 + u * 0.15,
            0.05 + Math.cos(a) * r,
          ];
        },
        lip,
        16,
        32,
      );
    }
    return;
  }
  if (t === 'tusk') {
    tube(
      g,
      Array.from({ length: 24 }, (_, k) => {
        let a = (k / 23) * 1.8;
        return [Math.sin(a) * 0.36, 0.08 + (k / 23) * 0.16, Math.cos(a) * 0.36];
      }),
      0.045,
      c,
    );
    return;
  }
  if (['scallop', 'wing'].includes(t)) {
    const extent = t === 'wing' ? 1.1 : 1.28,
      point = (u, w) => {
        const a = (w - 0.5) * extent * 2,
          r = 0.04 + u * 0.45 * (1 + 0.025 * Math.cos(a * n)),
          ridge = 0.018 * Math.cos(w * TAU * ((n % 9) + 9)) * u;
        return [
          Math.sin(a) * r * (t === 'wing' ? 0.65 : p),
          0.05 + 0.11 * Math.sin(u * Math.PI) + ridge,
          -0.18 + Math.cos(a) * r * (t === 'wing' ? 1.4 : 1),
        ];
      };
    surface(g, point, c, 24, 64);
    surface(
      g,
      (u, w) => {
        const p = point(u, w);
        p[1] -= 0.035;
        return p;
      },
      lip,
      24,
      64,
    );
    tube(
      g,
      Array.from({ length: 65 }, (_, k) => point(1, k / 64)),
      0.013,
      lip,
    );
    for (let k = 0; k < (n % 9) + 9; k++)
      tube(
        g,
        Array.from({ length: 16 }, (_, j) => {
          const p = point(0.08 + (j * 0.92) / 15, (k + 0.5) / ((n % 9) + 9));
          p[1] += 0.008;
          return p;
        }),
        0.006,
        lip,
      );
    return;
  }
  const elongated = ['mussel', 'razor', 'wing'].includes(t),
    closed = ['cowrie', 'olive'].includes(t),
    bowl = ['abalone', 'slipper'].includes(t);
  const point = (u, w) => {
    const a = w * TAU,
      r = u * (0.34 + 0.02 * Math.sin(a * 7));
    const ridge = 0.015 * Math.sin(a * n) * u;
    return [
      Math.cos(a) * r * (elongated ? 0.58 : p),
      0.06 +
        (closed
          ? 0.26 * Math.sqrt(Math.max(0, 1 - u * u))
          : bowl
            ? 0.12 * u * u
            : 0.18 * (1 - u * u)) +
        ridge,
      Math.sin(a) * r * (t === 'razor' ? 1.65 : elongated ? 1.35 : 1),
    ];
  };
  surface(g, point, c);
  tube(
    g,
    Array.from({ length: 65 }, (_, k) => point(1, k / 64)),
    0.016,
    lip,
    true,
  );
  if (bowl) {
    surface(
      g,
      (u, w) => {
        const p = point(u, w);
        p[1] += 0.012;
        return p;
      },
      mat(i.visual.accent, 0.18, 0, { iridescence: 1, side: T.DoubleSide }),
    );
    for (let k = 0; k < 5; k++)
      orb(
        g,
        c,
        Math.cos(k) * 0.25,
        0.17,
        Math.sin(k) * 0.25,
        0.035,
        0.012,
        0.018,
      );
  } else
    for (let j = 0; j < n; j++) {
      const a = j / n;
      const points = Array.from({ length: 17 }, (_, k) =>
        point(0.1 + (k * 0.9) / 16, a),
      );
      tube(g, points, 0.006, lip);
    }
  if (closed) {
    tube(
      g,
      [
        [0, 0.07, -0.29],
        [0.025, 0.11, 0],
        [0, 0.07, 0.29],
      ],
      0.018,
      ivory,
    );
    for (let k = 0; k < n; k++) {
      const a = k * 2.399;
      orb(
        g,
        lip,
        Math.sin(a) * 0.18,
        0.21,
        Math.cos(a) * 0.23,
        0.019,
        0.01,
        0.026,
      );
    }
  }
}
function glass(g, i) {
  const n = i.visual.variant,
    t = i.type,
    m = mat(i.color, 0.31, 0, {
      transmission: 0.25,
      transparent: true,
      opacity: 0.92,
      thickness: 0.3,
      iridescence: 0.3,
    });
  if (t === 'glass-heart' || t === 'wood-heart') {
    const o = heart(g, m);
    o.rotation.x = -Math.PI / 2;
    return;
  }
  if (t === 'glass-ring') {
    ring(g, m, 0.27, 0.075);
    ring(g, m, 0.23, 0.012, 0, 0.177);
    return;
  }
  if (t === 'glass-vial') {
    vessel(g, i, 'vial');
    return;
  }
  if (t === 'marble') {
    orb(g, m, 0, 0.24, 0, 0.26);
    for (let j = 0; j < 3; j++)
      tube(
        g,
        Array.from({ length: 33 }, (_, k) => {
          let a = (k / 32) * TAU;
          return [
            Math.sin(a) * 0.18,
            0.24 + Math.cos(a) * 0.18,
            Math.sin(a * 2 + j) * 0.1,
          ];
        }),
        0.023,
        mat(i.visual.accent, 0.2),
      );
    return;
  }
  if (t === 'cut-gem') {
    gemstone(g, m, n, 0, 0.16, 0, 0.3, 0.16);
    if (i.rarity === 'Mythic') {
      const inset = star(g, ivory, 6, 0.14);
      inset.rotation.x = -Math.PI / 2;
      inset.position.y = 0.32;
      for (let j = 0; j < 8; j++) {
        const a = (j * TAU) / 8;
        const setting = star(g, gold, 5, 0.035);
        setting.rotation.x = -Math.PI / 2;
        setting.position.set(Math.sin(a) * 0.32, 0.08, Math.cos(a) * 0.32);
      }
    }
    return;
  }
  if (t === 'glass-flower') {
    flower(g, m, 5, 0.19, 0.1);
    return;
  }
  if (t === 'glass-honey') {
    const o = poly(
      g,
      Array.from({ length: 6 }, (_, k) => [
        Math.sin((k * TAU) / 6) * 0.32,
        Math.cos((k * TAU) / 6) * 0.32,
      ]),
      m,
      0.12,
    );
    o.rotation.x = -Math.PI / 2;
    return;
  }
  if (t === 'glass-sail') {
    const o = poly(
      g,
      [
        [-0.25, -0.22],
        [0.23, -0.22],
        [0.03, 0.35],
      ],
      m,
      0.12,
    );
    o.rotation.x = -Math.PI / 2;
    return;
  }
  const point = (u, w) => {
    const a = w * TAU,
      r = Math.sin(u * Math.PI);
    return [
      Math.cos(a) * r * (0.28 + 0.025 * Math.sin(a * n)),
      0.22 + Math.cos(u * Math.PI) * 0.16,
      Math.sin(a) *
        r *
        0.34 *
        (t === 'glass-drop' ? 0.7 + 0.3 * Math.cos(a) : 1),
    ];
  };
  surface(g, point, m, 24, 40);
  if (t === 'agate')
    for (let j = 0; j < 5; j++) {
      const r = 0.06 + j * 0.045;
      const o = ring(
        g,
        mat(j % 2 ? i.color : i.visual.accent, 0.36),
        r,
        0.012,
        0,
        0.36 - j * 0.013,
      );
      o.scale.z = 0.83;
    }
  else
    for (let k = 0; k < (n % 4) + 2; k++)
      orb(
        g,
        ivory,
        Math.sin(k * 2.4) * 0.13,
        0.27,
        Math.cos(k * 2.4) * 0.14,
        0.012,
      );
}
function jewelry(g, i) {
  const n = i.visual.variant,
    t = i.type,
    m = mat(i.color, 0.2, 0.08, { iridescence: 0.45 }),
    metal = i.color.includes('c4') || i.name.includes('Silver') ? silver : gold;
  if (['ring', 'signet', 'twist-ring'].includes(t)) {
    ring(g, metal, 0.26, 0.035);
    if (t === 'twist-ring') {
      for (let j = 0; j < 2; j++)
        tube(
          g,
          Array.from({ length: 65 }, (_, k) => {
            let a = (k / 64) * TAU;
            return [
              Math.sin(a) * (0.26 + 0.015 * Math.sin(a * 9 + j * Math.PI)),
              0.09 + 0.016 * Math.cos(a * 9 + j * Math.PI),
              Math.cos(a) * (0.26 + 0.015 * Math.sin(a * 9 + j * Math.PI)),
            ];
          }),
          0.014,
          metal,
          true,
        );
      return;
    }
    const setting = ring(g, metal, 0.11, 0.024, 0, 0.19, -0.24);
    setting.scale.z = 0.82;
    if (i.visual.motif === 'heart') {
      const h = heart(g, m, 0.12);
      h.rotation.x = -Math.PI / 2;
      h.position.set(0, 0.21, -0.24);
    } else if (i.visual.motif === 'flower') {
      const f = new T.Group();
      g.add(f);
      f.position.set(0, 0.22, -0.24);
      flower(f, m, 5, 0.08, 0.03);
    } else
      gemstone(
        g,
        m,
        t === 'signet' ? 6 : (n % 5) + 5,
        0,
        0.22,
        -0.24,
        0.1,
        0.08,
      );
    for (let k = 0; k < 4; k++) {
      let a = (k * Math.PI) / 2;
      orb(
        g,
        metal,
        Math.sin(a) * 0.11,
        0.25,
        -0.24 + Math.cos(a) * 0.08,
        0.017,
      );
    }
    for (let k = 0; k < 8; k++)
      orb(
        g,
        ivory,
        Math.sin(k * 0.6) * 0.26,
        0.115,
        Math.cos(k * 0.6) * 0.26,
        0.014,
      );
    return;
  }
  if (['bracelet', 'bangle', 'cuff', 'braid'].includes(t)) {
    if (t === 'cuff') {
      ring(g, metal, 0.29, 0.045, 0, 0.08, 0, Math.PI * 1.65);
      ring(g, metal, 0.29, 0.025, 0, 0.18, 0, Math.PI * 1.65);
      for (let k = 0; k < 11; k++) {
        let a = (k / 10) * Math.PI * 1.65;
        orb(g, m, Math.cos(a) * 0.29, 0.13, -Math.sin(a) * 0.29, 0.035);
      }
      return;
    }
    if (t === 'braid') {
      for (let j = 0; j < 3; j++)
        tube(
          g,
          Array.from({ length: 65 }, (_, k) => {
            const a = (k / 64) * TAU;
            return [
              Math.sin(a) * (0.28 + Math.cos(a * 12 + (j * TAU) / 3) * 0.02),
              0.1 + Math.sin(a * 12 + (j * TAU) / 3) * 0.02,
              Math.cos(a) * (0.28 + Math.cos(a * 12 + (j * TAU) / 3) * 0.02),
            ];
          }),
          0.018,
          j === 1 ? ivory : m,
          true,
        );
      return;
    }
    ring(g, metal, 0.29, t === 'bangle' ? 0.035 : 0.012);
    const beads =
      i.id === 'pearl-bracelet'
        ? 20
        : i.id === 'shell-bracelet'
          ? 11
          : i.id === 'beaded-bracelet'
            ? 15
            : n;
    for (let k = 0; k < beads; k++) {
      const a = (k * TAU) / beads,
        x = Math.sin(a) * 0.29,
        z = Math.cos(a) * 0.29;
      if (t === 'bangle') {
        orb(g, k % 2 ? m : ivory, x, 0.13, z, 0.024);
        continue;
      }
      const r = 0.042 + (k % 3 === 0 ? 0.016 : 0);
      orb(
        g,
        i.id === 'pearl-bracelet' || k % 3 === 0 ? ivory : m,
        x,
        0.1,
        z,
        r,
        r,
        k % 4 === 0 ? r * 1.4 : r,
      );
      if (i.id === 'shell-bracelet' && k % 2 === 0) {
        const q = new T.Group();
        g.add(q);
        q.position.set(x, 0.11, z);
        q.rotation.y = a;
        for (let j = -2; j <= 2; j++)
          tube(
            q,
            [
              [0, 0, 0],
              [j * 0.014, 0.012, 0.025],
              [j * 0.022, 0.02, 0.055],
            ],
            0.009,
            ivory,
          );
      }
      if (i.visual.motif === 'daisy' && k % 3 === 0) {
        const f = new T.Group();
        g.add(f);
        f.position.set(x, 0.1, z);
        flower(f, ivory, 5, 0.045, 0.03);
      }
      if (k % 4 === 0) orb(g, gold, x, 0.16, z, 0.016);
    }
    const charm = new T.Group();
    g.add(charm);
    charm.position.set(0.02, 0.04, 0.39);
    if (i.visual.motif === 'shell' || i.id === 'shell-bracelet') {
      shell(charm, { ...i, type: 'clam' });
      charm.scale.setScalar(0.27);
    } else if (i.id === 'pearl-bracelet') {
      orb(charm, ivory, 0, 0.035, 0, 0.065);
      ring(charm, gold, 0.065, 0.012, 0, 0.025);
    } else {
      const h = heart(charm, m, 0.075);
      h.rotation.x = -Math.PI / 2;
    }
    ring(g, metal, 0.04, 0.012, 0, 0.1, -0.3);
    return;
  }
  if (['tiara', 'relic-crown', 'comb'].includes(t)) {
    ring(g, metal, 0.32, 0.027, 0, 0.05, 0, t === 'comb' ? Math.PI : TAU);
    for (let k = 0; k < n; k++) {
      let a = (k / n) * TAU,
        h = 0.13 + 0.16 * Math.sin(a / 2) ** 2,
        x = Math.sin(a) * 0.31,
        z = Math.cos(a) * 0.31;
      tube(
        g,
        [
          [x, 0.06, z],
          [x * 1.06, h, z * 1.06],
          [x * 0.9, h + 0.05, z * 0.9],
        ],
        0.013,
        metal,
      );
      orb(g, k % 2 ? m : ivory, x * 1.02, h + 0.04, z * 1.02, 0.04);
      if (i.visual.motif === 'stars' && k % 2 === 0) {
        const tip = star(g, gold, 5, 0.055);
        tip.position.set(x, h + 0.09, z);
        tip.rotation.y = a;
      }
      if (t === 'comb')
        tube(
          g,
          [
            [x, 0.06, z],
            [x, -0.13, z],
          ],
          0.015,
          metal,
        );
    }
    return;
  }
  if (['necklace', 'locket', 'charm', 'relic-necklace'].includes(t)) {
    if (t !== 'charm') chain(g, 0.31, 0.1, n + 18);
    const pendant = new T.Group();
    g.add(pendant);
    pendant.position.set(0, 0.08, 0.35);
    if (i.visual.motif === 'stars' || i.id === 'star-necklace') {
      const o = star(pendant, metal, 5, 0.14);
      o.rotation.x = -Math.PI / 2;
      orb(pendant, m, 0, 0.1, 0, 0.04);
    } else if (i.id.includes('moon')) {
      const o = mesh(
        pendant,
        new T.TorusGeometry(0.14, 0.045, 10, 40, Math.PI * 1.5),
        silver,
      );
      o.rotation.x = -Math.PI / 2;
    } else if (i.visual.motif === 'sun') {
      flower(pendant, gold, 12, 0.12, 0.04);
      orb(pendant, m, 0, 0.07, 0, 0.06);
    } else if (t === 'locket') {
      const h = heart(pendant, metal, 0.14);
      h.rotation.x = -Math.PI / 2;
      const inner = heart(pendant, m, 0.105);
      inner.rotation.x = -Math.PI / 2;
      inner.position.y = 0.07;
      flower(pendant, ivory, 5, 0.055, 0.17);
    } else if (i.visual.motif === 'drop') {
      orb(pendant, gold, 0, 0.03, 0, 0.095, 0.035, 0.16);
      const drop = orb(pendant, m, 0, 0.07, 0, 0.075, 0.045, 0.13);
      gemstone(pendant, m, 6, 0, 0.1, -0.09, 0.045, 0.04);
    } else {
      const o = heart(pendant, m, 0.12);
      o.rotation.x = -Math.PI / 2;
      ring(pendant, metal, 0.025, 0.01, 0, 0.03, -0.14);
    }
    if (t === 'charm') ring(pendant, metal, 0.036, 0.012, 0, 0.06, -0.16);
    if (i.visual.motif === 'pearl')
      for (let k = 0; k < n; k++) {
        let a = (k * TAU) / n;
        orb(g, ivory, Math.sin(a) * 0.3, 0.11, Math.cos(a) * 0.3, 0.04);
      }
    return;
  }
  if (t === 'earrings') {
    for (const x of [-0.18, 0.18]) {
      const f = new T.Group();
      g.add(f);
      f.position.x = x;
      flower(f, ivory, 6, 0.09, 0.1);
      tube(
        f,
        [
          [0, 0.12, -0.13],
          [0, 0.28, -0.17],
          [0.05, 0.29, -0.2],
        ],
        0.012,
        metal,
      );
    }
    return;
  }
  if (t === 'anchor') {
    tube(
      g,
      [
        [0, 0.05, -0.28],
        [0, 0.05, 0.27],
      ],
      0.034,
      metal,
    );
    tube(
      g,
      [
        [-0.23, 0.05, 0.07],
        [-0.21, 0.05, 0.25],
        [0, 0.05, 0.33],
        [0.21, 0.05, 0.25],
        [0.23, 0.05, 0.07],
      ],
      0.034,
      metal,
    );
    ring(g, metal, 0.065, 0.018, 0, 0.05, -0.3);
    tube(
      g,
      [
        [-0.17, 0.05, -0.11],
        [0.17, 0.05, -0.11],
      ],
      0.024,
      metal,
    );
    return;
  }
  if (t === 'wishbone') {
    tube(
      g,
      [
        [-0.2, 0.04, 0.25],
        [-0.1, 0.07, 0.1],
        [0, 0.1, -0.22],
        [0.1, 0.07, 0.1],
        [0.2, 0.04, 0.25],
      ],
      0.035,
      metal,
    );
    return;
  }
  if (t === 'bow') {
    for (const sign of [-1, 1]) {
      tube(
        g,
        [
          [0, 0.1, 0],
          [sign * 0.25, 0.12, -0.12],
          [sign * 0.28, 0.1, 0.13],
          [0, 0.1, 0],
          [sign * 0.16, 0.04, 0.28],
        ],
        0.045,
        m,
      );
    }
    orb(g, ivory, 0, 0.12, 0, 0.07);
    return;
  }
  if (t === 'butterfly' || t === 'bee') {
    for (const sign of [-1, 1])
      for (const z of [-0.12, 0.12]) {
        const wing = orb(
          g,
          t === 'bee' ? ivory : m,
          sign * 0.16,
          0.1,
          z,
          0.18,
          0.025,
          0.12,
        );
        wing.rotation.y = sign * z * 3;
      }
    orb(g, metal, 0, 0.11, 0, 0.04, 0.055, 0.23);
    for (const x of [-0.06, 0.06])
      tube(
        g,
        [
          [0, 0.12, -0.2],
          [x, 0.14, -0.3],
        ],
        0.012,
        metal,
      );
    return;
  }
  if (t === 'brooch' && i.visual.motif === 'seahorse') {
    ocean(g, { ...i, type: 'seahorse' });
    return;
  }
  flower(g, m, (n % 5) + 5, 0.18, 0.09);
  ring(g, metal, 0.24, 0.014);
}
function mineral(g, i) {
  const t = i.type,
    n = i.visual.variant,
    m = mat(i.color, 0.23, 0.05, { iridescence: 0.55, clearcoat: 1 }),
    accent = mat(i.visual.accent, 0.3),
    stone = mat('#b5a7a5', 0.85);
  if (t === 'agate') {
    glass(g, i);
    return;
  }
  if (t === 'crescent') {
    const o = mesh(
      g,
      new T.TorusGeometry(0.27, 0.08, 12, 64, Math.PI * 1.55),
      m,
      0,
      0.29,
      0,
    );
    o.rotation.z = -0.8;
    return;
  }
  if (['rosette', 'mineral-wing'].includes(t)) {
    for (let j = 0; j < n; j++) {
      let a = j * 2.399,
        r = 0.08 + (0.2 * j) / n;
      const o = orb(
        g,
        j % 3 ? m : accent,
        Math.sin(a) * r,
        0.09 + j * 0.008,
        Math.cos(a) * r,
        0.065,
        0.04,
        0.19,
      );
      o.rotation.set(0.3, a, 0.3);
    }
    return;
  }
  if (t === 'botryoidal') {
    for (let j = 0; j < n; j++) {
      let a = j * 2.399,
        r = 0.22 * Math.sqrt(j / n);
      orb(
        g,
        m,
        Math.sin(a) * r,
        0.12 + 0.13 * (1 - j / n),
        Math.cos(a) * r,
        0.09 + (j % 3) * 0.014,
      );
    }
    return;
  }
  if (t === 'bismuth') {
    for (let j = 0; j < 4; j++) {
      let a = j * 2.4;
      const q = new T.Group();
      g.add(q);
      q.position.set(Math.sin(a) * 0.17, j * 0.07, Math.cos(a) * 0.17);
      q.rotation.y = a;
      for (let k = 0; k < 6; k++) {
        const r = 0.25 - k * 0.033,
          h = k * 0.035;
        const col = mat(
          ['#c3a4d0', '#9fc8c2', '#d7bb83', '#a2b4d6'][k % 4],
          0.27,
          0.5,
        );
        box(q, col, r, 0.025, 0.025, 0, h, -r / 2);
        box(q, col, r, 0.025, 0.025, 0, h, r / 2);
        box(q, col, 0.025, 0.025, r, -r / 2, h, 0);
        box(q, col, 0.025, 0.025, r, r / 2, h, 0);
      }
    }
    return;
  }
  if (t === 'pyrite' || t === 'calcite' || t === 'fluorite') {
    for (let j = 0; j < n; j++) {
      let a = j * 2.4,
        r = 0.18 * Math.sqrt(j / n),
        size = 0.11 + (j % 3) * 0.04;
      const o = box(
        g,
        t === 'pyrite' ? gold : m,
        size,
        size,
        size,
        Math.sin(a) * r,
        0.07 + Math.floor(j / 3) * 0.055,
        Math.cos(a) * r,
      );
      o.rotation.set(j * 0.11, a, j * 0.07);
    }
    return;
  }
  if (t === 'geode' || t === 'heart-geode') {
    if (t === 'heart-geode') {
      const h = heart(g, stone, 0.3);
      h.position.y = 0.3;
    } else
      surface(
        g,
        (u, w) => {
          const a = w * TAU,
            r = 0.27 + u * 0.1 + 0.012 * Math.sin(a * 9);
          return [
            Math.cos(a) * r,
            0.32 + Math.sin(a) * r * 0.85,
            0.025 + Math.sin(u * Math.PI) * 0.08,
          ];
        },
        stone,
        8,
        48,
      );
    orb(g, mat('#514b68', 0.92), 0, 0.32, 0.04, 0.265, 0.22, 0.025);
    for (let j = 0; j < n * 2; j++) {
      const a = j * 2.4,
        r = 0.25 * Math.sqrt(j / (n * 2));
      const q = new T.Group();
      g.add(q);
      q.position.set(Math.sin(a) * r, 0.32 + Math.cos(a) * r * 0.78, 0.055);
      q.rotation.x = Math.PI / 2 + ((j % 3) - 1) * 0.15;
      gemstone(
        q,
        j % 5 ? m : accent,
        5,
        0,
        0.035,
        0,
        0.034 + (j % 3) * 0.008,
        0.09 + (j % 4) * 0.018,
      );
    }
    const rim = mesh(
      g,
      new T.TorusGeometry(0.285, 0.018, 8, 64),
      accent,
      0,
      0.32,
      0.09,
    );
    rim.scale.y = 0.82;
    return;
  }
  orb(g, stone, 0, 0.04, 0, 0.31, 0.06, 0.27);
  const count = t === 'obelisk' ? 1 : n;
  for (let j = 0; j < count; j++) {
    const a = j * 2.399,
      r = count === 1 ? 0 : 0.23 * Math.sqrt(j / count),
      h = t === 'obelisk' ? 0.65 : 0.2 + (j % 5) * 0.08;
    const q = new T.Group();
    g.add(q);
    q.position.set(Math.sin(a) * r, 0.07, Math.cos(a) * r);
    q.rotation.set(((j % 3) - 1) * 0.2, a, ((j % 4) - 1.5) * 0.12);
    if (t === 'starburst' || t === 'needles')
      q.rotation.z = (j / count - 0.5) * 1.8;
    gemstone(
      q,
      j % 4 === 0 ? accent : m,
      t === 'tourmaline' ? 3 : 6,
      0,
      h / 2,
      0,
      t === 'needles' ? 0.025 : 0.055,
      h,
    );
    if (t === 'tourmaline')
      gemstone(q, mat('#9fbd9b', 0.24), 3, 0, h * 0.78, 0, 0.04, h * 0.3);
  }
}
function ocean(g, i) {
  const t = i.type,
    n = i.visual.variant,
    m = mat(i.color, 0.47, 0, { iridescence: 0.25 }),
    a = mat(i.visual.accent, 0.4);
  if (['coral', 'fan', 'fossil-coral'].includes(t)) {
    for (let j = 0; j < n; j++) {
      const angle = (j / n - 0.5) * (t === 'fan' ? Math.PI : TAU),
        h = 0.25 + (j % 4) * 0.095,
        x = Math.sin(angle) * 0.31,
        z = t === 'fan' ? 0 : Math.cos(angle) * 0.22;
      const points = [
        [0, 0.03, 0],
        [x * 0.5, h * 0.55, z * 0.5],
        [x, h, z],
      ];
      tube(g, points, 0.025, m);
      for (const sign of [-1, 1]) {
        tube(
          g,
          [
            [x * 0.6, h * 0.6, z * 0.6],
            [x + sign * 0.07, h * 0.9, z],
            [x + sign * 0.1, h + 0.08, z],
          ],
          0.017,
          m,
        );
        orb(g, a, x + sign * 0.1, h + 0.08, z, 0.027);
      }
      if (t === 'fan' && j > 0)
        tube(
          g,
          [
            [x * 0.4, h * 0.4, 0],
            [x * 0.7 - 0.04, h * 0.7, 0],
            [x, h, 0],
          ],
          0.008,
          a,
        );
    }
    return;
  }
  if (t === 'urchin' || t === 'echinoid') {
    surface(
      g,
      (u, w) => {
        const a = w * TAU,
          r = Math.sin((u * Math.PI) / 2) * 0.32;
        return [
          Math.cos(a) * r,
          0.07 + Math.cos((u * Math.PI) / 2) * 0.28 + 0.009 * Math.sin(a * n),
          Math.sin(a) * r,
        ];
      },
      m,
    );
    for (let j = 0; j < n; j++) {
      let a = (j * TAU) / n;
      for (let k = 1; k < 6; k++) {
        let r = k * 0.047;
        orb(
          g,
          a ? ivory : m,
          Math.cos(a) * r,
          0.07 + 0.28 * Math.sqrt(1 - (r * r) / 0.1024),
          Math.sin(a) * r,
          0.012,
        );
      }
    }
    return;
  }
  if (t === 'sponge') {
    surface(
      g,
      (u, w) => {
        let a = w * TAU,
          r = 0.18 + 0.06 * u + 0.015 * Math.sin(a * 7);
        return [Math.cos(a) * r, 0.04 + u * 0.4, Math.sin(a) * r];
      },
      mat(i.color, 0.8, 0, { side: T.DoubleSide }),
    );
    ring(g, a, 0.24, 0.025, 0, 0.44);
    orb(g, mat('#997b59', 0.9), 0, 0.1, 0, 0.15, 0.02, 0.15);
    for (let j = 0; j < n; j++) {
      let angle = j * 2.4;
      orb(
        g,
        a,
        Math.cos(angle) * 0.23,
        0.1 + (j % 4) * 0.08,
        Math.sin(angle) * 0.23,
        0.018,
        0.024,
        0.008,
      );
    }
    return;
  }
  if (t === 'seahorse') {
    tube(
      g,
      [
        [0.06, 0.04, 0.05],
        [-0.12, 0.05, 0.05],
        [-0.15, 0.18, 0.05],
        [0.04, 0.24, 0],
        [0.08, 0.4, 0],
        [-0.03, 0.57, 0],
        [-0.17, 0.56, 0],
        [-0.22, 0.49, 0],
      ],
      0.055,
      m,
    );
    tube(
      g,
      [
        [-0.15, 0.55, 0],
        [-0.29, 0.51, 0],
      ],
      0.027,
      m,
    );
    orb(g, mat('#645c67'), -0.08, 0.58, 0.043, 0.012);
    for (let k = 0; k < 7; k++) orb(g, a, 0.12, 0.18 + k * 0.045, 0, 0.027);
    return;
  }
  if (t === 'nest' || t === 'pearl-nest') {
    for (let j = 0; j < 5; j++)
      ring(g, j % 2 ? gold : m, 0.25 - j * 0.018, 0.018, 0, 0.04 + j * 0.023);
    for (let j = 0; j < (i.visual.motif === 'egg' ? 1 : 3); j++)
      orb(
        g,
        ivory,
        Math.sin((j * TAU) / 3) * 0.11,
        0.16,
        Math.cos((j * TAU) / 3) * 0.1,
        0.09,
        0.11,
        0.09,
      );
    return;
  }
  if (t === 'anemone') {
    for (let j = 0; j < n; j++) {
      let angle = j * 2.4,
        r = 0.09 + (0.2 * j) / n;
      tube(
        g,
        [
          [0, 0.04, 0],
          [Math.sin(angle) * r * 0.7, 0.1, Math.cos(angle) * r * 0.7],
          [Math.sin(angle) * r, 0.19 + (j % 4) * 0.02, Math.cos(angle) * r],
        ],
        0.027,
        j % 3 ? m : a,
      );
    }
    orb(g, ivory, 0, 0.18, 0, 0.075);
    if (i.rarity === 'Mythic') {
      for (let j = 0; j < 9; j++) {
        const angle = (j * TAU) / 9;
        const p = petal(
          g,
          mat('#e4bd9a', 0.25, 0.25),
          Math.sin(angle) * 0.23,
          0.06,
          Math.cos(angle) * 0.23,
          angle,
          0.18,
        );
        p.rotation.z = 0.16;
        orb(
          g,
          ivory,
          Math.sin(angle) * 0.32,
          0.08,
          Math.cos(angle) * 0.32,
          0.035,
        );
      }
      orb(g, mat('#f3d5e6', 0.12, 0, { iridescence: 1 }), 0, 0.24, 0, 0.12);
    }
    return;
  }
  if (t === 'jelly') {
    orb(g, m, 0, 0.42, 0, 0.26, 0.17, 0.26);
    for (let j = 0; j < n; j++) {
      let a = (j * TAU) / n;
      tube(
        g,
        [
          [Math.sin(a) * 0.2, 0.4, Math.cos(a) * 0.2],
          [Math.sin(a) * 0.23, 0.25, Math.cos(a) * 0.23],
          [Math.sin(a + 0.4) * 0.2, 0.05, Math.cos(a + 0.4) * 0.2],
        ],
        0.018,
        ivory,
      );
    }
    return;
  }
  if (t === 'octopus') {
    orb(g, m, 0, 0.22, 0, 0.18, 0.2, 0.16);
    for (let j = 0; j < 8; j++) {
      const a = (j * TAU) / 8;
      tube(
        g,
        [
          [0, 0.12, 0],
          [Math.sin(a) * 0.19, 0.07, Math.cos(a) * 0.19],
          [Math.sin(a + 0.3) * 0.34, 0.04, Math.cos(a + 0.3) * 0.34],
          [Math.sin(a + 0.7) * 0.32, 0.08, Math.cos(a + 0.7) * 0.32],
        ],
        0.035,
        m,
      );
    }
    for (const x of [-0.07, 0.07]) orb(g, mat('#645a6c'), x, 0.24, 0.14, 0.015);
    return;
  }
  if (t === 'turtle') {
    orb(g, m, 0, 0.15, 0, 0.25, 0.15, 0.31);
    orb(g, a, 0, 0.1, -0.36, 0.09);
    for (const x of [-0.23, 0.23])
      for (const z of [-0.2, 0.2]) orb(g, a, x, 0.065, z, 0.1, 0.035, 0.08);
    for (let j = 0; j < 7; j++) {
      const a = j * 2.4;
      ring(g, ivory, 0.06, 0.008, Math.sin(a) * 0.14, 0.25, Math.cos(a) * 0.18);
    }
    return;
  }
  if (t === 'bunny') {
    orb(g, m, 0, 0.12, 0, 0.23, 0.15, 0.3);
    for (const x of [-0.08, 0.08]) {
      const ear = orb(g, a, x, 0.34, -0.17, 0.035, 0.14, 0.045);
      ear.rotation.z = x * 2;
      orb(g, mat('#675d70'), x, 0.2, -0.27, 0.012);
    }
    for (let j = 0; j < 12; j++) {
      let a = (j * TAU) / 12;
      orb(g, a ? ivory : m, Math.cos(a) * 0.2, 0.08, Math.sin(a) * 0.25, 0.025);
    }
    return;
  }
  if (t === 'angel') {
    orb(g, ivory, 0, 0.2, 0, 0.065, 0.2, 0.065);
    for (const sign of [-1, 1]) {
      const wing = orb(g, m, sign * 0.17, 0.26, 0, 0.2, 0.08, 0.13);
      wing.rotation.z = sign * 0.35;
    }
    return;
  }
}
function vessel(g, i, kind = 'bottle') {
  const m = mat(i.color, 0.22, 0, {
      transparent: true,
      opacity: 0.78,
      transmission: 0.22,
      thickness: 0.25,
    }),
    metal = gold;
  const points =
    kind === 'teacup'
      ? [
          [0, 0],
          [0.17, 0.01],
          [0.23, 0.12],
          [0.24, 0.3],
          [0.21, 0.31],
        ]
      : kind === 'bell'
        ? [
            [0, 0.04],
            [0.28, 0.04],
            [0.26, 0.09],
            [0.14, 0.22],
            [0.06, 0.35],
            [0, 0.36],
          ]
        : [
            [0, 0],
            [0.16, 0],
            [0.2, 0.07],
            [0.2, 0.3],
            [0.12, 0.41],
            [0.07, 0.46],
            [0.07, 0.58],
            [0.09, 0.59],
          ];
  mesh(
    g,
    new T.LatheGeometry(
      points.map((p) => new T.Vector2(...p)),
      32,
    ),
    kind === 'bell' ? gold : kind === 'teacup' ? mat(i.color, 0.22) : m,
  );
  if (kind === 'teacup') {
    const handle = ring(g, gold, 0.1, 0.025, 0.24, 0.16);
    handle.rotation.x = 0;
    ring(g, ivory, 0.28, 0.025, 0, 0.02);
    flower(g, mat('#dda4b3'), 5, 0.055, 0.08);
    return;
  }
  if (kind === 'bell') {
    ring(g, metal, 0.06, 0.018, 0, 0.42).rotation.x = 0;
    orb(g, metal, 0, 0.04, 0, 0.055);
    return;
  }
  mesh(
    g,
    new T.CylinderGeometry(0.085, 0.075, 0.08, 16),
    kind === 'perfume' ? gold : mat('#b59b7d', 0.8),
    0,
    0.62,
    0,
  );
  if (kind === 'perfume') {
    orb(g, m, 0, 0.72, 0, 0.09);
    flower(g, ivory, 5, 0.08, 0.22);
  } else {
    const o = mesh(
      g,
      new T.CylinderGeometry(0.055, 0.055, 0.26, 16),
      ivory,
      0,
      0.23,
      0,
    );
    o.rotation.z = 0.3;
    ring(g, metal, 0.08, 0.012, 0, 0.49);
  }
}
function keepsake(g, i) {
  const t = i.type,
    n = i.visual.variant,
    m = mat(i.color, 0.4),
    a = mat(i.visual.accent, 0.3);
  if (['bottle', 'perfume', 'teacup', 'bell'].includes(t)) {
    vessel(g, i, t);
    return;
  }
  if (t === 'musicbox' || t === 'case') {
    box(g, m, 0.62, 0.22, 0.43, 0, 0.13);
    box(g, gold, 0.64, 0.035, 0.45, 0, 0.03);
    box(g, a, 0.54, 0.02, 0.35, 0, 0.25);
    const lid = new T.Group();
    g.add(lid);
    lid.position.set(0, 0.25, -0.22);
    lid.rotation.x = -0.85;
    box(lid, m, 0.64, 0.045, 0.44, 0, 0, 0.22);
    box(lid, gold, 0.53, 0.012, 0.32, 0, -0.03, 0.22);
    for (const x of [-0.23, 0.23])
      for (const z of [-0.14, 0.14]) orb(g, gold, x, 0, z, 0.035);
    if (t === 'musicbox') {
      const stage = new T.Group();
      g.add(stage);
      stage.position.y = 0.27;
      if (i.visual.motif === 'swan') {
        keepsake(stage, { ...i, type: 'swan', color: '#fff0df' });
        stage.scale.setScalar(0.6);
        for (let j = 0; j < 9; j++)
          tube(
            g,
            [
              [0.15 + j * 0.025, 0.28, -0.12],
              [0.15 + j * 0.025, 0.3, -0.04],
            ],
            0.006,
            gold,
          );
      } else {
        flower(stage, ivory, 7, 0.12, 0.05);
        orb(stage, gold, 0, 0.18, 0, 0.045);
        for (let k = 0; k < 5; k++)
          orb(stage, a, Math.sin(k) * 0.06, 0.23, Math.cos(k) * 0.06, 0.04);
      }
    } else {
      for (let k = 0; k < 3; k++)
        ring(g, gold, 0.055, 0.015, -0.15 + k * 0.15, 0.28);
    }
    return;
  }
  if (t === 'compass' || t === 'astrolabe') {
    const base = mesh(
      g,
      new T.CylinderGeometry(0.3, 0.3, 0.065, 48),
      gold,
      0,
      0.08,
    );
    orb(g, mat('#e9e0c9', 0.4), 0, 0.115, 0, 0.255, 0.012, 0.255);
    for (let k = 0; k < 16; k++) {
      let a = (k * TAU) / 16;
      tube(
        g,
        [
          [Math.sin(a) * 0.22, 0.14, Math.cos(a) * 0.22],
          [Math.sin(a) * 0.25, 0.14, Math.cos(a) * 0.25],
        ],
        0.007,
        m,
      );
    }
    const needle = poly(
      g,
      [
        [0, -0.2],
        [0.06, 0],
        [0, 0.21],
        [-0.04, 0],
      ],
      m,
      0.015,
    );
    needle.rotation.x = -Math.PI / 2;
    needle.position.y = 0.15;
    ring(g, gold, 0.32, 0.018, 0, 0.08);
    if (t === 'astrolabe') {
      for (let k = 0; k < 3; k++) {
        const r = ring(g, k % 2 ? m : gold, 0.29, 0.014, 0, 0.28);
        r.rotation.x = k * 0.85;
        r.rotation.y = k * 0.7;
      }
      star(g, a, 5, 0.07).position.set(0, 0.28, 0);
      if (i.rarity === 'Mythic') {
        orb(g, mat('#f3d7e8', 0.16, 0, { iridescence: 1 }), 0, 0.28, 0, 0.1);
        for (let j = 0; j < 12; j++) {
          const angle = (j * TAU) / 12;
          orb(
            g,
            j % 2 ? ivory : m,
            Math.sin(angle) * 0.29,
            0.28 + Math.cos(angle) * 0.16,
            Math.cos(angle) * 0.2,
            0.025,
          );
        }
      }
    } else ring(g, gold, 0.065, 0.018, 0, 0.08, -0.35);
    return;
  }
  if (t === 'key') {
    ring(g, gold, 0.14, 0.035, -0.2, 0.06);
    tube(
      g,
      [
        [-0.06, 0.06, 0],
        [0.35, 0.06, 0],
      ],
      0.03,
      gold,
    );
    for (let k = 0; k < 3; k++)
      tube(
        g,
        [
          [0.15 + k * 0.07, 0.06, 0],
          [0.15 + k * 0.07, 0.06, 0.1],
        ],
        0.022,
        gold,
      );
    flower(g, a, 5, 0.06, 0.07);
    return;
  }
  if (t === 'scissors') {
    for (const sign of [-1, 1]) {
      ring(g, silver, 0.08, 0.022, sign * 0.13, 0.06, 0.19);
      tube(
        g,
        [
          [sign * 0.08, 0.06, 0.12],
          [0, 0.07, 0],
          [sign * 0.18, 0.07, -0.29],
        ],
        0.021,
        silver,
      );
    }
    orb(g, gold, 0, 0.09, 0, 0.025);
    return;
  }
  if (t === 'telescope') {
    for (let k = 0; k < 4; k++) {
      const o = mesh(
        g,
        new T.CylinderGeometry(0.09 - k * 0.014, 0.09 - k * 0.014, 0.22, 24),
        k % 2 ? gold : m,
        -0.24 + k * 0.15,
        0.14,
      );
      o.rotation.z = Math.PI / 2;
    }
    orb(g, mat('#8baeb9', 0.1), -0.36, 0.14, 0, 0.015, 0.075, 0.075);
    return;
  }
  if (t === 'thimble') {
    surface(
      g,
      (u, w) => {
        let a = w * TAU,
          r = 0.2 * (1 - u * 0.25);
        return [Math.cos(a) * r, 0.03 + u * 0.35, Math.sin(a) * r];
      },
      m,
    );
    orb(g, m, 0, 0.38, 0, 0.15, 0.035, 0.15);
    for (let j = 0; j < 30; j++) {
      let a = j * 2.4;
      orb(
        g,
        a ? gold : m,
        Math.sin(a) * 0.17,
        0.07 + (j % 5) * 0.06,
        Math.cos(a) * 0.17,
        0.009,
      );
    }
    return;
  }
  if (t === 'lighthouse') {
    mesh(g, new T.CylinderGeometry(0.1, 0.23, 0.55, 24), ivory, 0, 0.28);
    for (let j = 0; j < 3; j++)
      ring(g, m, 0.21 - j * 0.035, 0.025, 0, 0.12 + j * 0.15);
    mesh(
      g,
      new T.CylinderGeometry(0.13, 0.13, 0.15, 8),
      mat('#b7d8df', 0.15),
      0,
      0.62,
    );
    mesh(g, new T.ConeGeometry(0.2, 0.15, 16), m, 0, 0.77);
    return;
  }
  if (t === 'stamp') {
    mesh(g, new T.CylinderGeometry(0.19, 0.2, 0.07, 24), gold, 0, 0.05);
    orb(g, m, 0, 0.25, 0, 0.09, 0.18, 0.09);
    ring(g, gold, 0.09, 0.02, 0, 0.38);
    return;
  }
  if (t === 'swan' || t === 'bird') {
    orb(g, m, 0, 0.14, 0, 0.22, 0.12, 0.15);
    tube(
      g,
      [
        [0.1, 0.2, 0],
        [0.2, 0.4, 0],
        [0.12, 0.51, 0],
        [0.03, 0.48, 0],
      ],
      0.036,
      m,
    );
    poly(
      g,
      [
        [0, 0],
        [0.12, -0.025],
        [0, -0.045],
      ],
      gold,
    ).position.set(0.015, 0.48, 0);
    for (const sign of [-1, 1])
      for (let k = 0; k < 5; k++) {
        const wing = orb(
          g,
          a,
          -0.05 + k * 0.025,
          0.2,
          sign * 0.13,
          0.18,
          0.025,
          0.055,
        );
        wing.rotation.z = k * 0.12;
      }
    return;
  }
  if (t === 'cameo') {
    orb(g, gold, 0, 0.15, 0, 0.26, 0.08, 0.32);
    orb(g, m, 0, 0.22, 0, 0.22, 0.045, 0.27);
    orb(g, ivory, 0, 0.27, 0, 0.08, 0.025, 0.14);
    flower(g, ivory, 6, 0.07, 0.28);
    return;
  }
  if (t === 'button') {
    mesh(g, new T.CylinderGeometry(0.27, 0.27, 0.07, 40), m, 0, 0.05);
    ring(g, ivory, 0.22, 0.015, 0, 0.09);
    for (const x of [-0.06, 0.06])
      for (const z of [-0.06, 0.06])
        orb(g, mat('#6c788c'), x, 0.09, z, 0.025, 0.008, 0.025);
    return;
  }
  if (t === 'relic-lantern') {
    for (const x of [-0.15, 0.15])
      for (const z of [-0.15, 0.15])
        tube(
          g,
          [
            [x, 0.05, z],
            [x, 0.45, z],
          ],
          0.018,
          gold,
        );
    box(g, gold, 0.36, 0.05, 0.36, 0, 0.04);
    box(g, gold, 0.36, 0.05, 0.36, 0, 0.46);
    orb(
      g,
      mat('#edce96', 0.3, 0, { emissive: '#dcad70', emissiveIntensity: 0.4 }),
      0,
      0.24,
      0,
      0.06,
      0.16,
      0.06,
    );
    ring(g, gold, 0.1, 0.02, 0, 0.58).rotation.x = 0;
    return;
  }
}
function fossil(g, i) {
  const t = i.type,
    n = i.visual.variant,
    m = mat(i.color, 0.7),
    a = mat(i.visual.accent, 0.52);
  if (t === 'ammonite') {
    const pts = [];
    for (let j = 0; j < 121; j++) {
      let u = j / 120,
        ang = u * TAU * 2.6,
        r = 0.015 + u * 0.29;
      pts.push([Math.cos(ang) * r, 0.1 + u * 0.04, Math.sin(ang) * r]);
    }
    tube(g, pts, 0.045, m);
    for (let j = 0; j < n; j++) {
      let u = 0.3 + (j / n) * 0.7,
        ang = u * TAU * 2.6,
        r = 0.015 + u * 0.29;
      tube(
        g,
        [
          [Math.cos(ang) * r, 0.16, Math.sin(ang) * r],
          [
            Math.cos(ang + 0.12) * (r + 0.05),
            0.13,
            Math.sin(ang + 0.12) * (r + 0.05),
          ],
        ],
        0.012,
        a,
      );
    }
    return;
  }
  if (t === 'tusk') {
    shell(g, i);
    return;
  }
  if (t === 'relic-necklace' || t === 'relic-crown') {
    jewelry(g, i);
    return;
  }
  if (t === 'astrolabe' || t === 'relic-lantern') {
    keepsake(g, i);
    return;
  }
  if (t === 'fossil-coral' || t === 'echinoid') {
    ocean(g, i);
    return;
  }
  if (t === 'wood-heart') {
    glass(g, i);
    for (let j = 0; j < 5; j++) {
      const o = ring(g, a, 0.04 + j * 0.035, 0.006, 0, 0.16);
      o.scale.z = 1.2;
    }
    return;
  }
  if (t === 'dragon-egg' || t === 'scarab') {
    orb(g, m, 0, 0.27, 0, 0.23, 0.31, 0.22);
    for (let j = 0; j < n; j++) {
      let angle = j * 2.4;
      const y = 0.06 + (j / n) * 0.45,
        r = 0.21 * Math.sin(((j / n) * 0.8 + 0.1) * Math.PI);
      const scale = orb(
        g,
        j % 4 ? a : gold,
        Math.sin(angle) * r,
        y,
        Math.cos(angle) * r,
        0.045,
        0.035,
        0.015,
      );
      scale.rotation.y = angle;
    }
    if (t === 'scarab') {
      tube(
        g,
        [
          [0, 0.05, 0.22],
          [0, 0.5, 0.22],
        ],
        0.012,
        gold,
      );
      for (const sign of [-1, 1])
        for (let k = 0; k < 3; k++)
          tube(
            g,
            [
              [sign * 0.15, 0.15 + k * 0.08, 0],
              [sign * 0.3, 0.08 + k * 0.08, 0.12],
            ],
            0.018,
            gold,
          );
    }
    return;
  }
  orb(g, m, 0, 0.07, 0, 0.34, 0.07, 0.42);
  if (t === 'crinoid') {
    const bloom = new T.Group();
    g.add(bloom);
    bloom.position.set(0, 0.15, -0.14);
    for (let j = 0; j < 5; j++) {
      const angle = (j * TAU) / 5;
      tube(
        bloom,
        [
          [0, 0, 0],
          [Math.sin(angle) * 0.08, 0.02, Math.cos(angle) * 0.08],
          [Math.sin(angle) * 0.17, 0.01, Math.cos(angle) * 0.17],
        ],
        0.014,
        a,
      );
    }
    for (let j = 0; j < 9; j++)
      orb(g, a, 0, 0.15, -0.02 + j * 0.038, 0.027, 0.012, 0.016);
  }
  if (t === 'fern') {
    tube(
      g,
      [
        [0, 0.15, -0.3],
        [0, 0.16, 0.3],
      ],
      0.014,
      a,
    );
    for (let k = 0; k < n; k++) {
      let z = -0.26 + (k * 0.52) / n,
        r = 0.16 * Math.sin(((k + 1) / (n + 1)) * Math.PI);
      for (const sign of [-1, 1])
        tube(
          g,
          [
            [0, 0.16, z],
            [sign * r * 0.6, 0.17, z - 0.035],
            [sign * r, 0.16, z - 0.06],
          ],
          0.016,
          a,
        );
    }
  }
  if (t === 'fish-fossil') {
    tube(
      g,
      [
        [-0.25, 0.15, 0],
        [0.23, 0.16, 0],
      ],
      0.016,
      a,
    );
    for (let k = 0; k < n; k++) {
      let x = -0.2 + (k * 0.4) / n,
        r = 0.13 * Math.sin(((k + 1) / (n + 1)) * Math.PI);
      tube(
        g,
        [
          [x - 0.04, 0.15, -r],
          [x, 0.17, 0],
          [x - 0.04, 0.15, r],
        ],
        0.012,
        a,
      );
    }
    orb(g, a, 0.23, 0.16, 0, 0.07, 0.015, 0.085);
  }
  if (t === 'trilobite') {
    for (let k = 0; k < n; k++) {
      const z = -0.25 + (k * 0.5) / n,
        w = 0.15 * Math.sin(((k + 1) / (n + 1)) * Math.PI);
      orb(g, a, 0, 0.16, z, w, 0.045, 0.03);
      orb(g, m, 0, 0.2, z, 0.035, 0.02, 0.03);
    }
  }
  if (t === 'tablet') {
    const o = star(g, a, 5, 0.18);
    o.rotation.x = -Math.PI / 2;
    o.position.y = 0.15;
  }
  if (t === 'amber') {
    orb(
      g,
      mat(i.color, 0.19, 0, {
        transparent: true,
        opacity: 0.72,
        transmission: 0.3,
      }),
      0,
      0.18,
      0,
      0.29,
      0.12,
      0.36,
    );
    tube(
      g,
      [
        [0, 0.19, -0.2],
        [0, 0.19, 0.2],
      ],
      0.013,
      gold,
    );
    for (const sign of [-1, 1])
      for (const z of [-0.07, 0.07]) {
        const wing = orb(g, a, sign * 0.12, 0.2, z, 0.14, 0.008, 0.04);
        wing.rotation.y = sign * z * 3;
      }
  }
}
export const ART_FAMILIES = {
  ...Object.fromEntries(
    [
      'abalone',
      'limpet',
      'wing',
      'auger',
      'nautilus',
      'cowrie',
      'murex',
      'topshell',
      'tusk',
      'mussel',
      'clam',
      'whelk',
      'razor',
      'olive',
      'slipper',
      'conch',
      'scallop',
      'shell',
    ].map((t) => [t, shell]),
  ),
  ...Object.fromEntries(
    [
      'glass-drop',
      'glass-heart',
      'glass-ring',
      'glass-honey',
      'marble',
      'cabochon',
      'glass-flower',
      'glass-sail',
      'agate',
      'glass-vial',
      'cut-gem',
    ].map((t) => [t, glass]),
  ),
  ...Object.fromEntries(
    [
      'bracelet',
      'braid',
      'bangle',
      'cuff',
      'ring',
      'signet',
      'twist-ring',
      'earrings',
      'brooch',
      'anchor',
      'wishbone',
      'butterfly',
      'locket',
      'necklace',
      'tiara',
      'comb',
      'bee',
      'bow',
      'charm',
    ].map((t) => [t, jewelry]),
  ),
  ...Object.fromEntries(
    [
      'coral',
      'fan',
      'sponge',
      'urchin',
      'seahorse',
      'nest',
      'angel',
      'anemone',
      'bunny',
      'turtle',
      'jelly',
      'octopus',
      'pearl-nest',
    ].map((t) => [t, ocean]),
  ),
  ...Object.fromEntries(
    [
      'musicbox',
      'case',
      'teacup',
      'thimble',
      'telescope',
      'compass',
      'scissors',
      'perfume',
      'lighthouse',
      'bottle',
      'bell',
      'stamp',
      'swan',
      'bird',
      'cameo',
      'key',
      'button',
    ].map((t) => [t, keepsake]),
  ),
  ...Object.fromEntries(
    [
      'geode',
      'cluster',
      'calcite',
      'fluorite',
      'needles',
      'crescent',
      'pyrite',
      'mineral-wing',
      'rosette',
      'starburst',
      'obelisk',
      'botryoidal',
      'tourmaline',
      'bismuth',
      'matrix',
      'heart-geode',
    ].map((t) => [t, mineral]),
  ),
  ...Object.fromEntries(
    [
      'fern',
      'trilobite',
      'ammonite',
      'fish-fossil',
      'crinoid',
      'fossil-coral',
      'amber',
      'wood-heart',
      'echinoid',
      'relic-necklace',
      'relic-lantern',
      'tablet',
      'relic-crown',
      'scarab',
      'dragon-egg',
      'astrolabe',
    ].map((t) => [t, fossil]),
  ),
};
export function buildArtwork(g, item) {
  if (item.type.startsWith('mp-')) {
    buildMoonpool(g, item, {
      mat,
      mesh,
      orb,
      tube,
      ring,
      star,
      heart,
      surface,
      flower,
      gemstone,
      chain,
      shell,
      mineral,
      ocean,
      keepsake,
    });
    return true;
  }
  const make = ART_FAMILIES[item.type];
  if (!make) return false;
  make(g, item);
  return true;
}
