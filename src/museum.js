import * as T from 'three';
import { ITEMS } from './catalog.js';
import { createTreasure } from './treasures.js';
let renderer,
  views = [],
  last = 0;
const silhouette = new T.MeshStandardMaterial({
  color: '#a89caa',
  roughness: 1,
});
export function clearMuseum() {
  views = [];
  if (renderer) {
    renderer.setScissorTest(false);
    renderer.setClearColor(0, 0);
    renderer.clear();
    renderer.domElement.classList.add('hidden');
  }
}
export function mountMuseum(container) {
  clearMuseum();
  if (!renderer) {
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.className = 'museum-canvas';
    document.body.append(renderer.domElement);
  }
  renderer.domElement.classList.remove('hidden');
  views = [...container.querySelectorAll('[data-model]')].map((el) => {
    const view = { el, scene: null, model: null, rotation: 0.35, drag: false };
    if (el.classList.contains('inspection-model')) {
      let x;
      el.onpointerdown = (e) => {
        view.drag = true;
        x = e.clientX;
        el.setPointerCapture(e.pointerId);
      };
      el.onpointermove = (e) => {
        if (view.drag) {
          view.rotation += (e.clientX - x) * 0.012;
          x = e.clientX;
        }
      };
      el.onpointerup = el.onpointercancel = () => (view.drag = false);
    }
    return view;
  });
}
export function renderMuseum(time) {
  if (!renderer || !views.length || time - last < 1 / 30) return;
  last = time;
  if (
    renderer.domElement.width !==
      Math.round(innerWidth * renderer.getPixelRatio()) ||
    renderer.domElement.height !==
      Math.round(innerHeight * renderer.getPixelRatio())
  )
    renderer.setSize(innerWidth, innerHeight);
  renderer.setScissorTest(false);
  renderer.setClearColor(0, 0);
  renderer.clear();
  renderer.setScissorTest(true);
  const clip = document.getElementById('panelContent').getBoundingClientRect();
  for (const v of views) {
    const r = v.el.getBoundingClientRect(),
      top = Math.max(r.top, clip.top),
      bottom = Math.min(r.bottom, clip.bottom);
    if (bottom <= top || r.right < 0 || r.left > innerWidth) continue;
    if (!v.scene) {
      v.scene = new T.Scene();
      v.scene.add(new T.HemisphereLight('#fff4e6', '#9bafba', 2.3));
      const key = new T.DirectionalLight('#fff0dc', 3.2);
      key.position.set(-2, 4, 4);
      v.scene.add(key);
      const fill = new T.DirectionalLight('#d2dfef', 1.7);
      fill.position.set(3, 1, -2);
      v.scene.add(fill);
      v.model = createTreasure(ITEMS[v.el.dataset.model]);
      v.scene.add(v.model);
      if (v.el.dataset.unknown === 'true')
        v.scene.overrideMaterial = silhouette;
      const bounds = new T.Box3().setFromObject(v.model),
        center = bounds.getCenter(new T.Vector3()),
        size = bounds.getSize(new T.Vector3()),
        distance = Math.max(size.x, size.y, size.z) * 2.25;
      v.camera = new T.PerspectiveCamera(33, 1, 0.01, 15);
      v.camera.position
        .copy(center)
        .add(new T.Vector3(0.45, 0.6, 1).normalize().multiplyScalar(distance));
      v.camera.lookAt(center);
    }
    if (!v.drag) v.rotation += 0.008;
    v.model.rotation.y = v.rotation;
    v.camera.aspect = r.width / r.height;
    v.camera.updateProjectionMatrix();
    renderer.setViewport(r.left, innerHeight - r.bottom, r.width, r.height);
    renderer.setScissor(r.left, innerHeight - bottom, r.width, bottom - top);
    renderer.render(v.scene, v.camera);
  }
  renderer.setScissorTest(false);
}
