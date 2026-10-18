import * as T from 'three';
const TAU = Math.PI * 2;
export function buildMoonpool(g, i, S) {
  const {
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
  } = S;
  const n = i.visual.variant,
    pearl = mat('#fff0e8', 0.17, 0.05, { iridescence: 1 }),
    gold = mat('#d7b778', 0.24, 0.7),
    silver = mat('#c2d9e2', 0.23, 0.65),
    tint = mat(i.color, 0.22, 0.08, { iridescence: 1, clearcoat: 1 }),
    accent = mat(i.visual.accent, 0.28, 0.12, { iridescence: 0.8 });
  const group = (x = 0, y = 0, z = 0) => {
    const q = new T.Group();
    g.add(q);
    q.position.set(x, y, z);
    return q;
  };
  const base = (type, parent = g, over = {}) =>
    S[
      type === 'conch'
        ? 'shell'
        : ['cluster', 'heart-geode', 'starburst', 'rosette'].includes(type)
          ? 'mineral'
          : ['coral', 'seahorse', 'fan', 'nest'].includes(type)
            ? 'ocean'
            : 'shell'
    ](parent, { ...i, type, ...over });
  function leaf(parent, a, r, y, len = 0.19, m = tint) {
    return surface(
      parent,
      (u, w) => {
        const v = (w - 0.5) * Math.PI,
          rad = r + u * len;
        return [
          Math.sin(a) * rad +
            Math.cos(a) * Math.sin(v) * Math.sin(u * Math.PI) * len * 0.4,
          y + Math.sin(u * Math.PI) * len * 0.45 + 0.02 * Math.cos(v),
          Math.cos(a) * rad -
            Math.sin(a) * Math.sin(v) * Math.sin(u * Math.PI) * len * 0.4,
        ];
      },
      m,
      14,
      14,
    );
  }
  function lotus(parent, layers = 2) {
    for (let l = 0; l < layers; l++)
      for (let k = 0; k < 7 + l * 2; k++)
        leaf(
          parent,
          (k * TAU) / (7 + l * 2) + l * 0.3,
          0.04 + l * 0.045,
          0.04 + l * 0.025,
          0.19 + l * 0.03,
          l % 2 ? accent : tint,
        );
  }
  function pearlSpray(parent, count = 7, r = 0.24, y = 0.1) {
    for (let k = 0; k < count; k++) {
      const a = (k * TAU) / count;
      orb(
        parent,
        pearl,
        Math.sin(a) * r,
        y + (k % 2) * 0.03,
        Math.cos(a) * r,
        0.025 + (k % 3) * 0.005,
      );
    }
  }
  function crescent(parent, r = 0.18, y = 0.2, z = 0, m = silver) {
    const pts = Array.from({ length: 49 }, (_, k) => {
      const a = ((k / 48) * 0.83 + 0.08) * TAU;
      return [Math.cos(a) * r, y + Math.sin(a) * r, z];
    });
    tube(parent, pts, 0.023, m);
  }
  function vines(parent, count = 5) {
    for (let k = 0; k < count; k++) {
      const a = (k * TAU) / count;
      tube(
        parent,
        [
          [Math.sin(a) * 0.25, 0.03, Math.cos(a) * 0.25],
          [Math.sin(a + 0.35) * 0.24, 0.2, Math.cos(a + 0.35) * 0.24],
          [Math.sin(a + 0.8) * 0.1, 0.35, Math.cos(a + 0.8) * 0.1],
        ],
        0.013,
        gold,
      );
    }
  }
  switch (i.id) {
    case 'moonpetal-conch': {
      base('conch');
      const q = group(0.24, 0.15, 0.1);
      for (let k = 0; k < 7; k++)
        leaf(q, (k * TAU) / 7, 0.05, 0.02, 0.2, pearl);
      pearlSpray(q, 7, 0.2, 0.07);
      break;
    }
    case 'aurora-cowrie': {
      base('cowrie');
      for (let j = 0; j < 5; j++)
        tube(
          g,
          Array.from({ length: 18 }, (_, k) => {
            const a = (k / 17) * Math.PI;
            return [
              Math.cos(a) * (0.2 - j * 0.012),
              0.1 + Math.sin(a) * 0.24,
              -0.2 + j * 0.1,
            ];
          }),
          0.009,
          j % 2 ? accent : pearl,
        );
      break;
    }
    case 'starlight-pearl': {
      const q = group();
      lotus(q, 1);
      orb(g, pearl, 0, 0.27, 0, 0.16);
      for (let k = 0; k < 6; k++) {
        const a = (k * TAU) / 6;
        const s = star(g, gold, 5, 0.045);
        s.position.set(Math.sin(a) * 0.26, 0.14, Math.cos(a) * 0.26);
        s.rotation.x = -Math.PI / 2;
      }
      vines(g, 3);
      pearlSpray(g, 12, 0.29, 0.07);
      break;
    }
    case 'twin-moon-oyster': {
      base('scallop');
      const lid = group(0, 0.15, -0.17);
      shell(lid, { ...i, type: 'scallop', color: i.visual.accent });
      lid.rotation.x = -0.9;
      orb(g, pearl, -0.1, 0.17, 0.08, 0.085);
      orb(g, tint, 0.1, 0.16, 0.09, 0.07);
      pearlSpray(g, 7, 0.24, 0.12);
      break;
    }
    case 'lunar-angel-wing': {
      for (const sign of [-1, 1]) {
        const q = group(sign * 0.09, 0.02, 0);
        shell(q, {
          ...i,
          type: 'wing',
          color: sign < 0 ? i.color : i.visual.accent,
        });
        q.rotation.y = sign * 0.45;
        q.scale.set(0.75, 1, 1.1);
      }
      tube(
        g,
        [
          [0, 0.03, -0.25],
          [0, 0.1, 0.15],
        ],
        0.025,
        silver,
      );
      break;
    }
    case 'pearl-lily-cup': {
      ring(g, gold, 0.11, 0.018, 0, 0.025);
      tube(
        g,
        [
          [0, 0.02, 0],
          [0.03, 0.2, 0],
          [0, 0.36, 0],
        ],
        0.019,
        silver,
      );
      const q = group(0, 0.34, 0);
      lotus(q, 1);
      orb(q, pearl, 0, 0.1, 0, 0.08);
      for (const sign of [-1, 1]) leaf(g, sign * 1.1, 0.03, 0.06, 0.18, accent);
      break;
    }
    case 'crescent-nautilus': {
      base('nautilus');
      const q = group(0.05, 0.1, 0.03);
      crescent(q, 0.19, 0.2);
      for (let k = 0; k < 5; k++)
        orb(g, pearl, -0.2 + k * 0.08, 0.12, 0.19, 0.024);
      break;
    }
    case 'moonlace-murex': {
      base('murex');
      for (let k = 0; k < 6; k++) {
        const a = (k * TAU) / 6;
        tube(
          g,
          [
            [Math.sin(a) * 0.23, 0.12, Math.cos(a) * 0.23],
            [Math.sin(a + 0.5) * 0.34, 0.28, Math.cos(a + 0.5) * 0.34],
            [Math.sin(a + 1) * 0.2, 0.43, Math.cos(a + 1) * 0.2],
          ],
          0.009,
          pearl,
        );
      }
      break;
    }
    case 'tidal-pearl-spiral': {
      const pts = [];
      for (let k = 0; k < 25; k++) {
        const u = k / 24,
          a = u * TAU * 2.7,
          r = 0.27 * (1 - u) + 0.025;
        const p = [Math.sin(a) * r, 0.06 + u * 0.49, Math.cos(a) * r];
        pts.push(p);
        orb(g, k % 3 ? pearl : tint, ...p, 0.048 - u * 0.025);
      }
      tube(g, pts, 0.009, silver);
      ring(g, accent, 0.25, 0.018, 0, 0.025);
      break;
    }
    case 'sleeping-shell-cradle': {
      base('slipper');
      for (const sign of [-1, 1])
        tube(
          g,
          [
            [sign * 0.23, 0.06, -0.15],
            [sign * 0.24, 0.34, -0.09],
            [0, 0.43, 0],
          ],
          0.027,
          accent,
        );
      orb(g, pearl, 0, 0.16, 0.06, 0.12, 0.095, 0.14);
      const s = star(g, gold, 5, 0.045);
      s.position.set(0, 0.4, 0.05);
      break;
    }
    case 'rainbow-coral-crown': {
      ring(g, gold, 0.27, 0.018, 0, 0.06);
      for (let k = 0; k < 7; k++) {
        const a = (k * TAU) / 7,
          q = group(Math.sin(a) * 0.23, 0.06, Math.cos(a) * 0.23);
        ocean(q, {
          ...i,
          type: 'coral',
          visual: { ...i.visual, variant: 4 },
          color: k % 2 ? i.color : i.visual.accent,
        });
        q.scale.setScalar(0.5);
        gemstone(q, pearl, 5, 0, 0.37, 0, 0.04, 0.08);
      }
      break;
    }
    case 'opal-tideblossom': {
      lotus(g, 3);
      const q = group(0, 0.11, 0);
      mineral(q, {
        ...i,
        type: 'cluster',
        visual: { ...i.visual, variant: 11 },
      });
      q.scale.setScalar(0.6);
      pearlSpray(g, 9, 0.31, 0.09);
      break;
    }
    case 'prismatic-sea-fan': {
      base('fan');
      for (let j = 0; j < 3; j++) {
        const pts = [];
        for (let k = 0; k < 20; k++) {
          const a = (k / 19 - 0.5) * 2;
          pts.push([
            Math.sin(a) * (0.16 + j * 0.09),
            0.2 + Math.cos(a) * (0.12 + j * 0.07),
            0.016,
          ]);
        }
        tube(g, pts, 0.008, j % 2 ? gold : accent);
      }
      break;
    }
    case 'moonstone-waterfall': {
      for (let k = 0; k < 5; k++) {
        const y = 0.07 + k * 0.1;
        const m = mesh(
          g,
          new T.CylinderGeometry(0.22 - k * 0.025, 0.25 - k * 0.025, 0.09, 7),
          k % 2 ? tint : accent,
          0,
          y,
          -0.07 * k,
        );
        m.rotation.y = k * 0.2;
        for (const x of [-0.09, 0, 0.09])
          tube(
            g,
            [
              [x, y + 0.04, -0.07 * k],
              [x, y - 0.04, -0.07 * k + 0.18],
              [x, y - 0.08, -0.07 * k + 0.2],
            ],
            0.012,
            pearl,
          );
      }
      break;
    }
    case 'iridescent-lantern-crystal': {
      ring(g, gold, 0.23, 0.025, 0, 0.05);
      ring(g, gold, 0.18, 0.02, 0, 0.49);
      for (let k = 0; k < 6; k++) {
        const a = (k * TAU) / 6;
        tube(
          g,
          [
            [Math.sin(a) * 0.23, 0.05, Math.cos(a) * 0.23],
            [Math.sin(a) * 0.16, 0.5, Math.cos(a) * 0.16],
            [0, 0.65, 0],
          ],
          0.023,
          tint,
        );
      }
      orb(g, pearl, 0, 0.28, 0, 0.11, 0.17, 0.11);
      crescent(g, 0.07, 0.68);
      break;
    }
    case 'aurora-stone-bridge': {
      tube(
        g,
        Array.from({ length: 30 }, (_, k) => {
          const a = (k / 29) * Math.PI;
          return [Math.cos(a) * 0.34, 0.06 + Math.sin(a) * 0.4, 0];
        }),
        0.06,
        tint,
      );
      for (let k = 0; k < 5; k++) {
        let x = -0.2 + k * 0.1,
          h = 0.2 + Math.sqrt(1 - (x * x) / 0.12) * 0.16;
        tube(
          g,
          [
            [x, h, 0],
            [x, h - 0.13, 0],
          ],
          0.008,
          gold,
        );
        gemstone(g, accent, 5, x, h - 0.16, 0, 0.035, 0.1);
      }
      break;
    }
    case 'pastel-coral-harp': {
      tube(
        g,
        [
          [-0.26, 0.03, 0],
          [-0.2, 0.35, 0],
          [0, 0.64, 0],
          [0.25, 0.52, 0],
          [0.2, 0.06, 0],
          [-0.26, 0.03, 0],
        ],
        0.038,
        tint,
      );
      for (let k = 0; k < 7; k++) {
        const x = -0.17 + k * 0.055;
        tube(
          g,
          [
            [x, 0.07, 0],
            [x, 0.43 + Math.sin((k / 6) * Math.PI) * 0.09, 0],
          ],
          0.007,
          silver,
        );
        orb(g, pearl, x, 0.07, 0, 0.019);
      }
      break;
    }
    case 'moonpool-druzy-heart': {
      base('heart-geode');
      for (let k = 0; k < 5; k++) {
        const s = star(g, gold, 5, 0.025);
        s.position.set(-0.12 + k * 0.06, 0.34 + Math.sin(k) * 0.08, 0.24);
      }
      break;
    }
    case 'opal-seahorse-charm': {
      base('seahorse');
      gemstone(g, tint, 8, 0.03, 0.31, 0.055, 0.075, 0.1);
      ring(g, gold, 0.046, 0.012, 0, 0.64).rotation.x = 0;
      for (let k = 0; k < 6; k++)
        orb(g, pearl, 0.09, 0.15 + k * 0.046, 0.035, 0.012);
      break;
    }
    case 'mermaids-teardrop': {
      chain(g, 0.3, 0.055, 36);
      const q = group(0, 0.08, 0.32);
      surface(
        q,
        (u, w) => {
          const a = w * TAU,
            r = Math.sin(u * Math.PI) * (0.08 + 0.06 * u);
          return [Math.cos(a) * r, 0.04 + u * 0.36, Math.sin(a) * r * 0.5];
        },
        tint,
        24,
        24,
      );
      tube(
        q,
        [
          [0, 0.39, 0],
          [-0.14, 0.15, 0],
          [0, 0.01, 0],
          [0.14, 0.15, 0],
          [0, 0.39, 0],
        ],
        0.015,
        gold,
      );
      pearlSpray(q, 8, 0.16, 0.06);
      break;
    }
    case 'celestial-shell-locket': {
      chain(g, 0.28, 0.05, 32);
      const q = group(0, 0.08, 0.32);
      shell(q, { ...i, type: 'scallop' });
      q.scale.setScalar(0.55);
      const lid = new T.Group();
      q.add(lid);
      lid.position.set(0, 0.1, -0.17);
      shell(lid, { ...i, type: 'scallop', color: i.visual.accent });
      lid.rotation.x = -1.1;
      const s = star(q, gold, 5, 0.13);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.12, 0.03);
      break;
    }
    case 'moonwater-pendant': {
      chain(g, 0.29, 0.05, 28);
      const q = group(0, 0.1, 0.31);
      crescent(q, 0.2, 0.24);
      q.rotation.z = 0.2;
      const inner = group(0, 0.09, 0.31);
      crescent(inner, 0.12, 0.24, 0, gold);
      orb(inner, tint, 0, 0.2, 0, 0.07, 0.12, 0.04);
      gemstone(inner, pearl, 6, 0, 0.29, 0, 0.034, 0.055);
      break;
    }
    case 'pearl-orbit-bracelet': {
      for (let j = 0; j < 3; j++) {
        const q = group();
        const o = ring(q, j % 2 ? silver : gold, 0.27, 0.013, 0, 0.11);
        o.rotation.z = (j - 1) * 0.2;
      }
      for (let k = 0; k < 18; k++) {
        const a = (k * TAU) / 18;
        orb(
          g,
          k % 3 ? pearl : tint,
          Math.sin(a) * 0.27,
          0.13 + Math.sin(a * 3) * 0.04,
          Math.cos(a) * 0.27,
          0.036,
        );
      }
      const q = group(0, 0.07, 0.38);
      crescent(q, 0.07, 0.06);
      break;
    }
    case 'lotus-moon-comb': {
      for (let k = 0; k < 7; k++) {
        const x = -0.24 + k * 0.08;
        tube(
          g,
          [
            [x, 0.06, 0.28],
            [x, 0.08, -0.12],
            [x, 0.16, -0.24],
          ],
          0.018,
          silver,
        );
      }
      const q = group(0, 0.13, -0.12);
      lotus(q, 2);
      pearlSpray(q, 7, 0.16, 0.14);
      orb(q, tint, 0, 0.18, 0, 0.07);
      break;
    }
    case 'ancient-tide-astrolabe': {
      lotus(g, 2);
      const q = group(0, 0.1, 0);
      keepsake(q, { ...i, type: 'astrolabe' });
      q.scale.setScalar(0.83);
      crescent(g, 0.1, 0.62);
      break;
    }
    case 'sleeping-moon-dragon': {
      tube(
        g,
        Array.from({ length: 45 }, (_, k) => {
          const a = (k / 44) * TAU * 1.15,
            r = 0.25 - (k / 44) * 0.1;
          return [
            Math.sin(a) * r,
            0.12 + Math.sin((k / 44) * Math.PI) * 0.06,
            Math.cos(a) * r,
          ];
        }),
        0.075,
        tint,
      );
      orb(g, tint, -0.14, 0.19, 0.09, 0.14, 0.1, 0.12);
      for (const x of [-0.19, -0.09]) {
        tube(
          g,
          [
            [x, 0.24, 0.04],
            [x, 0.35, 0.01],
            [x + 0.025, 0.4, -0.02],
          ],
          0.018,
          gold,
        );
        tube(
          g,
          [
            [x - 0.02, 0.2, 0.2],
            [x + 0.02, 0.19, 0.2],
          ],
          0.009,
          silver,
        );
      }
      for (const sign of [-1, 1]) {
        const q = group(sign * 0.12, 0.2, -0.12);
        surface(
          q,
          (u, w) => [
            sign * u * 0.19,
            0.02 + Math.sin(w * Math.PI) * u * 0.08,
            -u * 0.17 + w * u * 0.22,
          ],
          accent,
          12,
          18,
        );
        tube(
          q,
          [
            [0, 0, 0],
            [sign * 0.2, 0.04, -0.13],
          ],
          0.012,
          gold,
        );
      }
      for (let k = 0; k < 9; k++)
        orb(
          g,
          pearl,
          Math.sin(k * 0.5) * 0.24,
          0.22,
          Math.cos(k * 0.5) * 0.24,
          0.018,
        );
      break;
    }
    case 'mermaid-music-shell': {
      base('conch');
      const lid = group(-0.06, 0.25, 0.12);
      shell(lid, { ...i, type: 'scallop', color: i.visual.accent });
      lid.scale.setScalar(0.65);
      lid.rotation.x = -0.7;
      const roller = mesh(
        g,
        new T.CylinderGeometry(0.05, 0.05, 0.26, 16),
        gold,
        0.09,
        0.15,
        0.22,
      );
      roller.rotation.z = Math.PI / 2;
      for (let k = 0; k < 7; k++)
        tube(
          g,
          [
            [k * 0.03 - 0.05, 0.13, 0.2],
            [k * 0.03 - 0.05, 0.14, 0.29],
          ],
          0.006,
          silver,
        );
      break;
    }
    case 'opal-memory-tablet': {
      const shape = new T.Shape();
      shape.moveTo(-0.22, 0);
      shape.lineTo(-0.22, 0.43);
      shape.quadraticCurveTo(0, 0.72, 0.22, 0.43);
      shape.lineTo(0.22, 0);
      shape.closePath();
      mesh(
        g,
        new T.ExtrudeGeometry(shape, {
          depth: 0.07,
          bevelEnabled: true,
          bevelSize: 0.025,
          bevelThickness: 0.02,
          bevelSegments: 3,
        }),
        tint,
      );
      crescent(g, 0.12, 0.42, 0.1, gold);
      for (let k = 0; k < 5; k++) {
        const x = -0.14 + k * 0.07;
        tube(
          g,
          [
            [x, 0.1, 0.1],
            [x + 0.02, 0.18, 0.1],
            [x - 0.02, 0.23, 0.1],
          ],
          0.009,
          pearl,
        );
      }
      break;
    }
    case 'moonmoth-reliquary': {
      mesh(g, new T.CylinderGeometry(0.28, 0.3, 0.08, 36), gold, 0, 0.045);
      const glass = mat(i.color, 0.16, 0, {
        transparent: true,
        opacity: 0.18,
        transmission: 0.12,
        depthWrite: false,
      });
      surface(
        g,
        (u, w) => {
          const a = w * TAU,
            r = 0.25 * Math.sin((u * Math.PI) / 2);
          return [
            Math.cos(a) * r,
            0.1 + 0.44 * Math.cos((u * Math.PI) / 2),
            Math.sin(a) * r,
          ];
        },
        glass,
        24,
        36,
      );
      for (const sign of [-1, 1])
        for (const z of [-0.06, 0.07]) {
          const wing = orb(g, accent, sign * 0.11, 0.28, z, 0.12, 0.025, 0.08);
          wing.rotation.y = sign * 0.45;
          orb(g, tint, sign * 0.13, 0.31, z, 0.038, 0.012, 0.035);
        }
      tube(
        g,
        [
          [0, 0.27, -0.17],
          [0, 0.29, 0.17],
        ],
        0.017,
        silver,
      );
      ring(g, gold, 0.05, 0.012, 0, 0.6).rotation.x = 0;
      break;
    }
    case 'heart-of-the-moonpool': {
      lotus(g, 3);
      orb(g, pearl, 0, 0.32, 0, 0.12);
      vines(g, 7);
      const q = group(0, 0.2, 0);
      crescent(q, 0.25, 0.26, 0, gold);
      for (let k = 0; k < 9; k++) {
        const a = (k * TAU) / 9,
          s = star(g, k % 2 ? silver : gold, 5, 0.032);
        s.position.set(
          Math.sin(a) * 0.31,
          0.21 + Math.cos(a) * 0.2,
          Math.cos(a) * 0.13,
        );
        s.rotation.y = a;
      }
      pearlSpray(g, 13, 0.3, 0.11);
      break;
    }
    default:
      throw new Error('Missing Moonpool sculpture: ' + i.id);
  }
}
