import * as T from 'three';
import { grainTexture } from './visuals.js';
// A carved arch with one explicit moving obstruction. Geometry and traversal
// use the same animation state; existing unlocks snap open on load.
export function createRockPassage({ glowing = false } = {}) {
  const group = new T.Group(),
    shape = new T.Shape();
  shape.moveTo(-3, 0);
  shape.lineTo(-3, 1);
  shape.quadraticCurveTo(-3, 4.3, 0, 4.3);
  shape.quadraticCurveTo(3, 4.3, 3, 1);
  shape.lineTo(3, 0);
  shape.lineTo(1.9, 0);
  shape.lineTo(1.9, 1);
  shape.quadraticCurveTo(1.9, 3.2, 0, 3.35);
  shape.quadraticCurveTo(-1.9, 3.2, -1.9, 1);
  shape.lineTo(-1.9, 0);
  shape.closePath();
  const rock = new T.MeshStandardMaterial({
    color: glowing ? '#758895' : '#a2ac9b',
    roughness: 0.88,
    map: grainTexture(),
  });
  const arch = new T.Mesh(
    new T.ExtrudeGeometry(shape, {
      depth: 2.8,
      bevelEnabled: true,
      bevelSize: 0.16,
      bevelThickness: 0.16,
      bevelSegments: 4,
      curveSegments: 32,
    }),
    rock,
  );
  arch.geometry.translate(0, 0, -2.8);
  arch.name = 'carved-arch';
  group.add(arch);
  const blocker = new T.Group();
  blocker.name = 'passage-blocker';
  group.add(blocker);
  const stone = new T.Mesh(
    new T.IcosahedronGeometry(1, 3),
    new T.MeshPhysicalMaterial({
      color: glowing ? '#adc5ce' : '#a9ae9f',
      roughness: 0.65,
      map: grainTexture(),
      iridescence: glowing ? 0.55 : 0,
    }),
  );
  stone.scale.set(2.18, 1.95, 0.7);
  stone.position.set(0, 1.6, 0.12);
  blocker.add(stone);
  const seamMat = new T.MeshStandardMaterial({
    color: glowing ? '#bbdfdc' : '#d3d8bd',
    emissive: glowing ? '#8cd1c2' : '#647763',
    emissiveIntensity: glowing ? 0.7 : 0.15,
  });
  for (let j = 0; j < 7; j++) {
    const pts = Array.from(
      { length: 12 },
      (_, k) =>
        new T.Vector3(
          Math.sin(k * 0.6 + j) * 0.12 + (j - 3) * 0.46,
          0.3 + k * 0.25,
          0.77,
        ),
    );
    const seam = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.015, 5, false),
      seamMat,
    );
    blocker.add(seam);
  }
  const floor = new T.Mesh(
    new T.PlaneGeometry(4, 5),
    new T.MeshStandardMaterial({
      color: glowing ? '#a4b9b5' : '#d5ccb6',
      roughness: 0.8,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.035, -1);
  group.add(floor);
  // The destination lies beyond the scene transition. A recessed backdrop gives
  // the opening depth instead of showing sky through the cliff.
  const depth = new T.Mesh(
    new T.PlaneGeometry(4.5, 4.5),
    new T.MeshBasicMaterial({ color: glowing ? '#659fa8' : '#243d43' }),
  );
  depth.position.set(0, 2, -5.2);
  group.add(depth);
  for (const x of [-1.7, 1.7]) {
    const mineral = new T.Mesh(
      new T.ConeGeometry(0.17, 0.85, 6),
      new T.MeshStandardMaterial({
        color: glowing ? '#d3addd' : '#85b7ac',
        emissive: glowing ? '#8e729e' : '#476d65',
        emissiveIntensity: 0.3,
        roughness: 0.35,
      }),
    );
    mineral.position.set(x, 0.42, -3.5);
    mineral.rotation.z = x * 0.13;
    group.add(mineral);
  }
  const hint = new T.PointLight(
    glowing ? '#8fe5d3' : '#99c4b1',
    glowing ? 10 : 5,
    9,
    2,
  );
  hint.position.set(0, 2, -2);
  group.add(hint);
  let progress = 0,
    target = 0,
    lastUpdate = performance.now();
  function apply() {
    const q = progress * progress * (3 - 2 * progress);
    blocker.position.set(q * 4.8, -q * 0.4, 0);
    blocker.rotation.z = -q * 0.18;
    blocker.visible = progress < 0.999;
  }
  function setOpen(open, animate = false) {
    target = open ? 1 : 0;
    lastUpdate = performance.now();
    if (!animate) progress = target;
    apply();
  }
  function update(dt) {
    const now = performance.now();
    const elapsed = Math.max(dt, (now - lastUpdate) / 1000);
    lastUpdate = now;
    progress = T.MathUtils.clamp(
      progress +
        Math.sign(target - progress) *
          Math.min(Math.abs(target - progress), elapsed / 1.25),
      0,
      1,
    );
    apply();
  }
  const canTraverse = () => {
    update(0);
    return target === 1 && progress >= 0.97;
  };
  return {
    group,
    blocker,
    arch,
    setOpen,
    update,
    canTraverse,
    get progress() {
      return progress;
    },
  };
}
