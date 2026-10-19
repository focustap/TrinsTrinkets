import * as T from 'three';
import { createTreasure } from './treasures.js';
import { createRockPassage } from './passage.js';
import {
  GROUND,
  createSurface,
  restOnSurface,
  addContactShadow,
  disposeContactShadow,
} from './surfaces.js';
import { grainTexture } from './visuals.js';
const V = (x, y, z) => new T.Vector3(x, y, z);
export function createCaveScene() {
  const scene = new T.Scene();
  scene.background = new T.Color('#1d333e');
  scene.userData.exposure = 1.09;
  scene.userData.environmentIntensity = 0.16;
  scene.fog = new T.FogExp2('#283c46', 0.028);
  const camera = new T.PerspectiveCamera(72, 1, 0.1, 90);
  camera.position.set(0, 1.7, 2);
  camera.rotation.order = 'YXZ';
  scene.add(new T.HemisphereLight('#bbd7d5', '#66546e', 1.25));
  const rock = new T.MeshStandardMaterial({
    color: '#697980',
    roughness: 0.94,
    map: grainTexture(),
    side: T.DoubleSide,
  });
  // A warped continuous vault, with a narrower entrance and rippled mineral strata.
  const vertices = [],
    indices = [],
    rows = 64,
    cols = 64;
  for (let j = 0; j <= rows; j++)
    for (let k = 0; k <= cols; k++) {
      const z = 5 - (j / rows) * 31,
        a = (k / cols) * Math.PI * 2,
        breath = 1 + 0.08 * Math.sin(z * 0.57) + 0.04 * Math.cos(a * 7 + z),
        width = 8 * breath * (z > 1 ? 0.75 : 1);
      vertices.push(Math.cos(a) * width, 1 + Math.sin(a) * 4.5 * breath, z);
      if (j < rows && k < cols) {
        const p = j * (cols + 1) + k,
          q = p + cols + 1;
        indices.push(p, q, p + 1, q, q + 1, p + 1);
      }
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const vault = new T.Mesh(geo, rock);
  scene.add(vault);
  const uv = [];
  for (let j = 0; j <= rows; j++)
    for (let k = 0; k <= cols; k++) uv.push((k / cols) * 3, (j / rows) * 2);
  geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  const ground = new T.Mesh(
    new T.PlaneGeometry(17, 32, 12, 24),
    new T.MeshStandardMaterial({
      color: '#71827f',
      roughness: 0.93,
      map: grainTexture(),
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, GROUND.cave, -10);
  ground.name = 'cave-ground';
  ground.receiveShadow = true;
  scene.add(ground);
  const surface = createSurface(GROUND.cave, [ground]);
  const glow = new T.MeshStandardMaterial({
    color: '#8fbba3',
    emissive: '#548b71',
    emissiveIntensity: 0.28,
    roughness: 0.9,
  });
  const mossTufts = new T.InstancedMesh(
      new T.SphereGeometry(1, 7, 5),
      glow,
      540,
    ),
    dummy = new T.Object3D();
  scene.add(mossTufts);
  const glows = [];
  for (let j = 0; j < 30; j++) {
    const side = j % 2 ? 1 : -1,
      z = 3 - j * 0.9,
      x = side * (6.6 + Math.sin(j) * 0.35);
    for (let k = 0; k < 18; k++) {
      const angle = k * 2.399,
        r = 0.65 * Math.sqrt(k / 18);
      dummy.position.set(
        x + Math.sin(angle) * r,
        GROUND.cave + 0.035,
        z + Math.cos(angle) * r * 0.6,
      );
      dummy.scale.set(
        0.12 + (k % 3) * 0.035,
        0.065 + (k % 4) * 0.012,
        0.1 + (k % 3) * 0.025,
      );
      dummy.rotation.y = angle;
      dummy.updateMatrix();
      mossTufts.setMatrixAt(j * 18 + k, dummy.matrix);
    }
    if (j % 4 === 0) {
      const crystal = createTreasure(
        {
          id: 'cave-scenery-' + j,
          type: j % 8 ? 'cluster' : 'starburst',
          color: j % 8 ? '#a4b8d0' : '#b8a3c9',
          visual: {
            variant: 9,
            motif: 'points',
            accent: '#c9e6d9',
            profile: 1,
          },
        },
        1.8,
      );
      crystal.position.set(x, 0, z);
      restOnSurface(crystal, surface, 0.012);
      scene.add(crystal);
      addContactShadow(scene, crystal, surface, 0.2);
      const light = new T.PointLight(j % 8 ? '#a4dcd3' : '#bfa9d6', 5, 7, 2);
      light.position.set(x, 1, z);
      scene.add(light);
      glows.push(light);
    }
    const stalactite = new T.Mesh(
      new T.LatheGeometry(
        [
          [0.24, 0],
          [0.21, 0.2],
          [0.13, 0.5],
          [0.11, 0.65],
          [0.06, 0.9],
          [0, 1.25],
        ].map((p) => new T.Vector2(...p)),
        12,
      ),
      rock,
    );
    stalactite.scale.setScalar(0.7 + (j % 4) * 0.2);
    stalactite.rotation.z = Math.PI;
    stalactite.position.set(Math.sin(j * 2.4) * 5, 4.1, z);
    const ceilingRay = new T.Raycaster(
      V(stalactite.position.x, 12, z),
      V(0, -1, 0),
    );
    vault.updateMatrixWorld(true);
    const ceiling = ceilingRay.intersectObject(vault)[0];
    if (ceiling) {
      stalactite.updateMatrixWorld(true);
      const top = new T.Box3().setFromObject(stalactite).max.y;
      stalactite.position.y += ceiling.point.y - top + 0.05;
    }
    scene.add(stalactite);
    if (j % 3 === 0) {
      const stone = new T.Mesh(new T.SphereGeometry(0.65, 16, 12), rock);
      stone.position.set(side * 6.2, 0.2, z);
      stone.scale.set(1.3, 0.6, 1);
      scene.add(stone);
    }
  }
  mossTufts.instanceMatrix.needsUpdate = true;
  for (let j = 0; j < 8; j++) {
    if (Math.abs(-7 + j * 2) < 3.2) continue;
    const boulder = new T.Mesh(new T.SphereGeometry(2, 16, 12), rock);
    boulder.position.set(-7 + j * 2, Math.sin(j) * 0.3, -25);
    boulder.scale.set(1.2, 1.3, 1);
    scene.add(boulder);
  }
  const waters = [];
  const moonpoolPassage = createRockPassage({ glowing: true });
  moonpoolPassage.group.position.set(0, 0, -23.5);
  scene.add(moonpoolPassage.group);
  for (const sign of [-1, 1]) {
    const bloom = createTreasure(
      {
        id: 'moonpool-passage-hint-' + sign,
        type: 'coral',
        color: sign < 0 ? '#dfb0d4' : '#9edbcc',
        visual: {
          variant: 7,
          motif: 'branches',
          accent: '#cbd9ed',
          profile: 1,
        },
      },
      1.7,
    );
    bloom.position.set(sign * 2.5, 0, -24.3);
    restOnSurface(bloom, surface, 0.01);
    scene.add(bloom);
  }
  for (const [x, z, r] of [
    [-4, -7, 1.6],
    [4, -16, 2],
    [-3, -22, 1.4],
  ]) {
    const water = new T.Mesh(
      new T.CircleGeometry(r, 48),
      new T.MeshPhysicalMaterial({
        color: '#6fa7ab',
        roughness: 0.16,
        metalness: 0.15,
        transparent: true,
        opacity: 0.8,
        clearcoat: 1,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, GROUND.cave + 0.023, z);
    water.scale.y = 1.45;
    scene.add(water);
    waters.push(water);
  }
  const lantern = new T.PointLight('#f1d7ae', 7, 11, 2);
  scene.add(lantern);
  const finds = [];
  function spawn(item, method, x, z, uid) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.userData.find = { item, method, uid };
    const o = createTreasure(item, 0.86);
    g.add(o);
    o.name = 'discovery-model';
    restOnSurface(o, surface, 0.003);
    const fleck = new T.Mesh(new T.OctahedronGeometry(0.035), glow);
    fleck.position.set(0.2, GROUND.cave + 0.025, 0.1);
    g.add(fleck);
    scene.add(g);
    g.userData.shadow = addContactShadow(scene, o, surface, 0.22);
    finds.push(g);
    return g;
  }
  function remove(g) {
    disposeContactShadow(g.userData.shadow);
    scene.remove(g);
    const j = finds.indexOf(g);
    if (j >= 0) finds.splice(j, 1);
  }
  function clearFinds() {
    for (const g of [...finds]) remove(g);
  }
  function update(t, hasLantern, dt = 0.016) {
    moonpoolPassage.update(dt);
    lantern.position.copy(camera.position);
    lantern.intensity = hasLantern ? 10 : 3;
    for (let j = 0; j < glows.length; j++)
      glows[j].intensity = 4.5 + Math.sin(t * 0.7 + j) * 0.7;
    for (const w of waters)
      w.material.opacity = 0.72 + Math.sin(t * 0.6) * 0.05;
  }
  return {
    scene,
    camera,
    finds,
    spawn,
    remove,
    clearFinds,
    update,
    moonpoolPassage,
    surface,
    stations: { exit: V(0, 0, 3), moonpool: V(0, 0, -21.8) },
  };
}
