import * as T from 'three';
import { createTreasure } from './treasures.js';
import { rewardEnabled } from './rewards.js';
export function createRewardDecor(s) {
  const group = new T.Group(),
    animated = [];
  group.name = 'milestone-decorations';
  const gold = new T.MeshStandardMaterial({
      color: '#d4b478',
      metalness: 0.6,
      roughness: 0.28,
    }),
    wood = new T.MeshStandardMaterial({ color: '#bf9d83', roughness: 0.7 }),
    pearl = new T.MeshPhysicalMaterial({
      color: '#fff0e2',
      iridescence: 1,
      roughness: 0.2,
    }),
    glow = new T.MeshStandardMaterial({
      color: '#c6e8db',
      emissive: '#92cfbe',
      emissiveIntensity: 0.45,
    });
  const add = (geo, m, x, y, z, parent = group) => {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const trinket = (id, type, color, parent, x, y, z, scale = 0.3) => {
    const o = createTreasure(
      {
        id: 'reward-' + id,
        type,
        color,
        name: id,
        visual: { variant: 9, motif: 'stars', accent: '#eed5bb', profile: 1 },
      },
      scale,
    );
    o.position.set(x, y, z);
    o.traverse((child) => {
      child.userData.sharedTreasureGeometry = true;
    });
    parent.add(o);
    return o;
  };
  if (rewardEnabled(s, 'shore-wreath')) {
    const q = new T.Group();
    q.position.set(3.85, 4.9, -3.35);
    group.add(q);
    add(new T.TorusGeometry(0.45, 0.035, 8, 48), gold, 0, 0, 0, q);
    for (let j = 0; j < 9; j++) {
      const a = (j * Math.PI * 2) / 9,
        o = trinket(
          'wreath-' + j,
          'scallop',
          j % 2 ? '#e9bfd0' : '#c4ded4',
          q,
          Math.sin(a) * 0.45,
          Math.cos(a) * 0.45,
          0,
          0.24,
        );
      o.rotation.x = Math.PI / 2;
      o.rotation.z = -a;
    }
  }
  if (rewardEnabled(s, 'pearl-lamp')) {
    const q = new T.Group();
    q.position.set(-3.9, 0, 0.55);
    group.add(q);
    add(new T.CylinderGeometry(0.45, 0.4, 0.1, 32), wood, 0, 0.65, 0, q);
    for (const x of [-0.3, 0.3])
      for (const z of [-0.25, 0.25])
        add(new T.CylinderGeometry(0.035, 0.05, 0.6, 10), wood, x, 0.3, z, q);
    trinket('lamp-base', 'anemone', '#d5b7c9', q, 0, 0.7, 0, 0.8);
    add(
      new T.SphereGeometry(0.2, 24, 16),
      new T.MeshStandardMaterial({
        color: '#fff1d7',
        emissive: '#f5dcb0',
        emissiveIntensity: 0.5,
      }),
      0,
      0.98,
      0,
      q,
    );
    const light = new T.PointLight('#f8dfba', 2.2, 4);
    light.position.set(0, 1.1, 0);
    q.add(light);
  }
  if (rewardEnabled(s, 'aurora-mobile')) {
    const q = new T.Group();
    q.position.set(3.5, 4.4, -0.5);
    group.add(q);
    const top = add(new T.TorusGeometry(0.5, 0.018, 8, 48), gold, 0, 0, 0, q);
    top.rotation.x = Math.PI / 2;
    for (let j = 0; j < 7; j++) {
      const a = (j * Math.PI * 2) / 7,
        x = Math.sin(a) * 0.46,
        z = Math.cos(a) * 0.46,
        h = 0.3 + (j % 3) * 0.13;
      add(new T.CylinderGeometry(0.005, 0.005, h, 5), gold, x, -h / 2, z, q);
      trinket(
        'mobile-' + j,
        j % 2 ? 'crescent' : 'glass-flower',
        j % 2 ? '#c4bbdf' : '#d6bdd6',
        q,
        x,
        -h - 0.14,
        z,
        0.3,
      );
    }
    animated.push((t) => (q.rotation.y = Math.sin(t * 0.12) * 0.12));
  }
  if (rewardEnabled(s, 'tide-fountain')) {
    const q = new T.Group();
    q.position.set(-3.5, 0, 2.1);
    group.add(q);
    for (let j = 0; j < 3; j++) {
      const y = 0.15 + j * 0.31,
        r = 0.55 - j * 0.15;
      add(new T.CylinderGeometry(r, r * 0.9, 0.12, 32), pearl, 0, y, 0, q);
      const w = add(
        new T.CircleGeometry(r * 0.88, 40),
        new T.MeshPhysicalMaterial({
          color: '#9cd9d2',
          roughness: 0.15,
          transparent: true,
          opacity: 0.7,
        }),
        0,
        y + 0.065,
        0,
        q,
      );
      w.rotation.x = -Math.PI / 2;
      animated.push(
        (t) => (w.material.opacity = 0.6 + Math.sin(t * 0.8 + j) * 0.12),
      );
    }
    add(new T.CylinderGeometry(0.055, 0.1, 0.9, 16), gold, 0, 0.46, 0, q);
    trinket('fountain-top', 'scallop', '#ddbdd3', q, 0, 0.95, 0, 0.6);
  }
  if (rewardEnabled(s, 'collector-constellation')) {
    const q = new T.Group();
    q.position.set(0, 7, -3.4);
    group.add(q);
    add(new T.TorusGeometry(0.75, 0.03, 10, 64), gold, 0, 0, 0, q);
    for (let j = 0; j < 16; j++) {
      const a = (j * Math.PI * 2) / 16;
      add(
        new T.OctahedronGeometry(0.045, 0),
        j % 2 ? gold : pearl,
        Math.sin(a) * 0.75,
        Math.cos(a) * 0.75,
        0,
        q,
      );
    }
    const center = trinket(
      'constellation-center',
      'astrolabe',
      '#c9bddc',
      q,
      0,
      -0.3,
      0.05,
      1.2,
    );
    center.rotation.x = Math.PI / 2;
  }
  if (rewardEnabled(s, 'moonpool-aquarium')) {
    const q = new T.Group();
    q.name = 'moonpool-aquarium';
    q.position.set(3.6, 0, 2.5);
    group.add(q);
    add(new T.CylinderGeometry(0.85, 0.7, 0.12, 48), wood, 0, 0.7, 0, q);
    for (const x of [-0.5, 0.5])
      for (const z of [-0.4, 0.4])
        add(new T.CylinderGeometry(0.05, 0.07, 0.65, 12), wood, x, 0.34, z, q);
    const glass = new T.MeshPhysicalMaterial({
      color: '#ddf2ed',
      roughness: 0.1,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: T.DoubleSide,
    });
    add(
      new T.CylinderGeometry(0.78, 0.78, 0.95, 64, 1, true),
      glass,
      0,
      1.23,
      0,
      q,
    );
    add(new T.CylinderGeometry(0.78, 0.78, 0.05, 64), gold, 0, 0.78, 0, q);
    const rim = add(
      new T.TorusGeometry(0.78, 0.022, 10, 64),
      gold,
      0,
      1.72,
      0,
      q,
    );
    rim.rotation.x = Math.PI / 2;
    add(
      new T.CylinderGeometry(0.72, 0.72, 0.06, 48),
      new T.MeshStandardMaterial({ color: '#e2dbc8' }),
      0,
      0.83,
      0,
      q,
    );
    const water = add(
      new T.CircleGeometry(0.75, 64),
      new T.MeshPhysicalMaterial({
        color: '#8cd6d0',
        transparent: true,
        opacity: 0.45,
        roughness: 0.13,
        side: T.DoubleSide,
      }),
      0,
      1.53,
      0,
      q,
    );
    water.rotation.x = -Math.PI / 2;
    for (let j = 0; j < 5; j++) {
      const a = (j * Math.PI * 2) / 5;
      trinket(
        'aquarium-' + j,
        j % 2 ? 'coral' : 'cluster',
        j % 2 ? '#e6b2cd' : '#b3d9cc',
        q,
        Math.sin(a) * 0.4,
        0.85,
        Math.cos(a) * 0.4,
        0.58,
      );
    }
    const core = add(new T.SphereGeometry(0.09, 16, 12), glow, 0, 1.15, 0, q);
    const light = new T.PointLight('#9addd1', 2.5, 4);
    light.position.set(0, 1.3, 0);
    q.add(light);
    for (let j = 0; j < 3; j++) {
      const fish = add(new T.OctahedronGeometry(0.045), glow, 0, 1.2, 0, q);
      fish.scale.z = 1.8;
      animated.push((t) => {
        fish.position.set(
          Math.sin(t * 0.25 + j * 2) * 0.54,
          1.2 + Math.sin(t * 0.4 + j) * 0.08,
          Math.cos(t * 0.25 + j * 2) * 0.54,
        );
        fish.rotation.y = t * 0.25 + j * 2;
      });
    }
    animated.push((t) => {
      water.position.y = 1.53 + Math.sin(t * 0.7) * 0.005;
      core.material.emissiveIntensity = 0.35 + Math.sin(t * 0.6) * 0.1;
    });
  }
  group.userData.update = (t) => animated.forEach((update) => update(t));
  return group;
}
