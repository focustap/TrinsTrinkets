import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import {
  CATALOG,
  ITEMS,
  SETS,
  COLLECTION_NAMES,
  UPGRADES,
  SHOP_COLORS,
  WOODS,
} from './catalog.js';
import { RARITIES } from './rarity.js';
import {
  DECOR,
  owns,
  purchase,
  purchaseReason,
  canDiscover,
} from './progression.js';
import { loadSave, writeSave } from './save.js';
import { ensureTides, advanceDay, takeFind } from './tide.js';
import { shelfSlots, nearestSlot, slotFree } from './shelves.js';
import { createBeachScene, createShelfScene } from './world.js';
import { createCaveScene } from './cave.js';
import { mountMuseum, clearMuseum, renderMuseum } from './museum.js';
import { openPainting } from './painting.js';
import { previewState } from './preview.js';
import { DEV_SEQUENCE, toggleUnlimitedMoney, resetProgress, devMenuHtml, resetConfirmHtml } from './devtools.js';
import { sellTreasure, sellExtras, claimCompletedSets } from './inventory.js';

const $ = (id) => document.getElementById(id),
  clamp = (x, a, b) => Math.max(a, Math.min(b, x));
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem() {
      throw Error('Browser storage is disabled');
    },
  };
}
const preview = new URLSearchParams(location.search).get('preview');
const loaded = ['cottage', 'cave', 'legacy'].includes(preview)
    ? {
        state: previewState(preview),
        error: null,
        original: null,
        preview: true,
      }
    : loadSave(storage),
  state = loaded.state;
let toastTimer,
  paintingCleanup = null;
function save() {
  if (loaded.preview) {
    $('saveStatus').textContent = 'developer preview · unsaved';
    return true;
  }
  const result = writeSave(storage, state, {
    blocked: !!loaded.error,
    original: loaded.original,
  });
  $('saveStatus').textContent = result.ok
    ? '✓ saved locally'
    : '⚠ export to keep progress';
  $('saveStatus').dataset.error = String(!result.ok);
  $('saveStatus').title =
    result.error || 'Your collection saves automatically in this browser';
  return result.ok;
}
const beach = createBeachScene(),
  shelf = createShelfScene();
let cave;
const getCave = () => cave || (cave = createCaveScene());
shelf.customize(state);
beach.setGate(owns(state, 'caveAccess'));
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.24;
$('game').append(renderer.domElement);
renderer.domElement.tabIndex = 0;
const cottageControls = new OrbitControls(shelf.camera, renderer.domElement);
cottageControls.enabled = false;
cottageControls.enableRotate = false;
cottageControls.minDistance = 2;
cottageControls.maxDistance = 35;
cottageControls.zoomToCursor = true;
cottageControls.mouseButtons = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN,
};
const clock = new THREE.Clock(),
  keys = new Set(),
  raycaster = new THREE.Raycaster(),
  mouse = new THREE.Vector2(),
  yAxis = new THREE.Vector3(0, 1, 0);
let mode = 'beach',
  started = false,
  activePanel = '',
  tab = 'All',
  rarityFilter = 'All',
  knownFilter = 'All',
  selectedUid = null,
  sleeping = false,
  scanUntil = 0,
  dragging = false,
  dragStart = null,
  lastPrompt = '';
const currentWorld = () => (mode === 'cave' ? getCave() : beach);
const count = (id) => state.bag[id] || 0,
  onShelf = (id) => state.shelf.filter((p) => p.itemId === id).length,
  available = (id) => Math.max(0, count(id) - onShelf(id));
const uniqueCount = () =>
  CATALOG.filter((i) => state.discovered.includes(i.id)).length;
const money = (n) => n.toLocaleString('en-US');
const iconFor = (i) =>
  ({
    Shells: '🐚',
    'Sea Glass': '💎',
    Jewelry: '📿',
    'Ocean Wonders': '🪸',
    'Lost Treasures': '🗝️',
    'Cave Crystals': '✧',
    'Cave Relics': '🌀',
  })[i.set] || '✧';
const badge = (i) =>
  `<span class="rarity-badge" style="--rarity:${RARITIES[i.rarity].color}">${i.rarity}</span>`;
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3800);
}
function refreshHUD() {
  $('balance').textContent = state.devInfiniteMoney ? '∞' : money(state.coins);
  $('dayNumber').textContent = state.day;
  const pool = mode === 'cave' ? state.caveFinds : state.beachFinds,
    remaining = pool?.filter((f) => canDiscover(state, f.method)).length || 0;
  $('mission').textContent =
    `${mode === 'cave' ? 'Mossglass Cave' : 'The little cove'} · ${remaining} reachable finds · ${uniqueCount()}/200 treasures`;
}
function spawnTides() {
  beach.clearFinds();
  for (const f of state.beachFinds)
    if (ITEMS[f.itemId])
      beach.spawn(ITEMS[f.itemId], f.method, f.x, f.z, f.uid);
  if (cave) {
    cave.clearFinds();
    for (const f of state.caveFinds)
      if (ITEMS[f.itemId])
        cave.spawn(ITEMS[f.itemId], f.method, f.x, f.z, f.uid);
  }
}
ensureTides(state);
spawnTides();
save();
function collect(find) {
  const { item, method, uid } = find.userData.find;
  if (!canDiscover(state, method))
    return toast(
      'This find needs ' +
        (UPGRADES.find((u) => u.id === method)?.name || 'another tool') +
        '.',
    );
  if (
    ['detector', 'coil', 'professional'].includes(method) &&
    performance.now() > scanUntil
  )
    return toast('Press F to scan first.');
  const first = !state.discovered.includes(item.id),
    found = takeFind(state, uid, mode);
  if (!found) return;
  currentWorld().remove(find);
  toast((first ? '✦ First discovery · ' : 'Safely tucked away · ') + item.name);
  if (soundOn) chime(first ? 660 : 480, 0.35);
  if (['Legendary', 'Mythic'].includes(item.rarity)) celebrate(item);
  for (const set of claimCompletedSets(state))
    setTimeout(
      () =>
        toast(set + ' complete! A pressed-flower seal & 500 sand dollars ♡'),
      1200,
    );
  save();
  refreshHUD();
}
function celebrate(item) {
  const el = $('discovery');
  el.style.setProperty('--rarity', RARITIES[item.rarity].color);
  el.innerHTML = `<small>${item.rarity} discovery</small><strong>${item.name}</strong><span>A little wonder, just for you.</span>`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
  if (soundOn)
    [523, 659, 784, 1046].forEach((hz, j) =>
      setTimeout(() => chime(hz, 0.9), j * 160),
    );
}
function nearTarget() {
  const w = currentWorld(),
    pos = w.camera.position,
    dist = (p) => Math.hypot(pos.x - p.x, pos.z - p.z);
  if (mode === 'cave' && dist(w.stations.exit) < 2.4)
    return { kind: 'exit', name: 'Return to the sunny cove' };
  if (mode === 'beach') {
    if (dist(beach.stations.cave) < 3)
      return {
        kind: 'cave',
        name: owns(state, 'caveAccess')
          ? 'Enter Mossglass Cave'
          : 'Cave gate · see unlock requirements',
      };
    if (dist(beach.stations.exchange) < 3.5)
      return { kind: 'exchange', name: 'Browse beach exchange' };
    if (dist(beach.stations.cottage) < 3.5)
      return { kind: 'cottage', name: 'Enter your cottage' };
  }
  let target = null;
  for (const f of w.finds) {
    if (!f.visible) continue;
    const d = dist(f.position);
    if (d > 2.55) continue;
    const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(
        yAxis,
        w.camera.rotation.y,
      ),
      to = f.position.clone().sub(pos);
    to.y = 0;
    const score = d - (to.normalize().dot(dir) > 0.35 ? 0.65 : 0);
    if (!target || score < target.score) {
      const m = f.userData.find.method;
      target = {
        kind: 'find',
        find: f,
        score,
        name: canDiscover(state, m)
          ? m === 'surface' || m === 'cave'
            ? 'Pick up ' + f.userData.find.item.name
            : 'Reveal with ' + (UPGRADES.find((u) => u.id === m)?.name || m)
          : 'Needs ' + (UPGRADES.find((u) => u.id === m)?.name || m),
      };
    }
  }
  return target;
}
function interact() {
  if (!started || mode === 'shelf' || activePanel) return;
  const t = nearTarget();
  if (!t) return;
  if (t.kind === 'find') collect(t.find);
  if (t.kind === 'exchange') exchange();
  if (t.kind === 'cottage') enterShelf();
  if (t.kind === 'cave') {
    if (owns(state, 'caveAccess')) enterCave();
    else exchange('equipment');
  }
  if (t.kind === 'exit') leaveCave();
}
function enterCave() {
  if (!owns(state, 'caveAccess')) return;
  const w = getCave();
  w.camera.position.set(0, 1.7, 1);
  w.camera.rotation.set(0, 0, 0);
  spawnTides();
  mode = 'cave';
  refreshHUD();
  resize();
  changeAmbience();
  toast('Mossglass Cave · the cliffs are keeping little secrets.');
}
function leaveCave() {
  mode = 'beach';
  beach.camera.position.set(12.5, 1.7, 1);
  refreshHUD();
  resize();
  changeAmbience();
}
function scan() {
  if (!owns(state, 'detector'))
    return toast('Work toward a detector at the beach exchange.');
  if (mode !== 'beach' || activePanel) return;
  scanUntil =
    performance.now() +
    (owns(state, 'professional') ? 24000 : owns(state, 'coil') ? 17000 : 10000);
  toast('A gentle chime… look for warm glints in the sand.');
  if (soundOn) chime(650, 0.2);
}
function panelShell(title, eyebrow, html) {
  clearMuseum();
  paintingCleanup?.();
  paintingCleanup = null;
  keys.clear();
  activePanel = title.toLowerCase();
  $('panelTitle').textContent = title;
  $('panelEyebrow').textContent = eyebrow;
  $('panelContent').innerHTML = html;
  $('panelBackdrop').classList.remove('hidden');
  $('panel').classList.remove('hidden');
  $('panel').classList.toggle('wide', title === 'Model Gallery');
  $('panelContent').scrollTop = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  $('interaction').classList.remove('visible');
  mountMuseum($('panelContent'));
  $('closePanel').focus();
}
function closePanel() {
  clearMuseum();
  paintingCleanup?.();
  paintingCleanup = null;
  activePanel = '';
  $('panel').classList.add('hidden');
  $('panelBackdrop').classList.add('hidden');
  lastPrompt = '';
  renderer.domElement.focus();
}
function itemCard(i, developer = false) {
  const known = state.discovered.includes(i.id) || developer;
  return `<button class="item-card ${known ? '' : 'unknown'}" data-action="inspect" data-id="${i.id}"><div class="model-thumbnail" data-model="${i.id}" data-unknown="${!known}" aria-hidden="true"></div><b>${known ? i.name : 'Undiscovered keepsake'}</b>${badge(i)}<small>${known ? `${count(i.id)} owned · ${i.environment}` : 'A little secret waiting to be found'}</small></button>`;
}
function filterBar() {
  return `<div class="pill-row">${['All', ...SETS].map((s) => `<button class="pill ${tab === s ? 'active' : ''}" data-action="tab" data-id="${s}">${s}</button>`).join('')}</div><div class="journal-filters"><label>Rarity <select id="rarityFilter">${['All', ...Object.keys(RARITIES)].map((r) => `<option ${rarityFilter === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label><label>Discovery <select id="knownFilter">${['All', 'Discovered', 'Undiscovered'].map((r) => `<option ${knownFilter === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label></div>`;
}
function journal(gallery = false) {
  const inSet = CATALOG.filter((i) => tab === 'All' || i.set === tab),
    done = inSet.filter((i) => state.discovered.includes(i.id)).length;
  let html = `<p class="lead">${gallery ? 'Developer gallery · every authored model, including undiscovered treasures. Select one to inspect.' : 'Every little find has a story. Keep the ones that make your heart happy. ♡'}</p>${filterBar()}<div class="progress-line"><span>${done} / ${inSet.length} found · ${uniqueCount()}/200 overall</span><span>${Math.round((done / inSet.length) * 100)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${(done / inSet.length) * 100}%"></div></div>`;
  if (!gallery && tab === 'All' && state.recent.length) {
    html +=
      '<h3>Recently found</h3><div class="recent-row">' +
      state.recent
        .slice(0, 4)
        .filter((id) => ITEMS[id])
        .map(
          (id) =>
            `<button data-action="inspect" data-id="${id}">${ITEMS[id].name}</button>`,
        )
        .join('') +
      '</div>';
  }
  for (const set of tab === 'All' ? SETS : [tab]) {
    const group = CATALOG.filter((i) => i.set === set),
      shown = group.filter(
        (i) =>
          (rarityFilter === 'All' || i.rarity === rarityFilter) &&
          (knownFilter === 'All' ||
            state.discovered.includes(i.id) === (knownFilter === 'Discovered')),
      );
    html += `<div class="set-header"><h3>${COLLECTION_NAMES[SETS.indexOf(set)]}</h3><span>${group.filter((i) => state.discovered.includes(i.id)).length}/${group.length}</span></div><p class="tiny">${state.claimed.includes(set) ? '✿ Completed · pressed-flower seal earned' : 'Complete this set for 500 sand dollars & a journal seal.'}</p><div class="item-grid">${shown.map((i) => itemCard(i, gallery)).join('')}</div>`;
  }
  panelShell(
    gallery ? 'Model Gallery' : 'Collections',
    gallery ? '200 little sculptures' : 'your keepsake journal',
    html,
  );
  $('rarityFilter').onchange = (e) => {
    rarityFilter = e.target.value;
    journal(gallery);
  };
  $('knownFilter').onchange = (e) => {
    knownFilter = e.target.value;
    journal(gallery);
  };
}
let inspectionReturn = false;
function inspect(id) {
  const i = ITEMS[id];
  if (!i) return;
  const developer =
      activePanel === 'model gallery' ||
      (inspectionReturn && new URLSearchParams(location.search).has('gallery')),
    known = state.discovered.includes(id) || developer;
  inspectionReturn = developer;
  panelShell(
    known ? i.name : 'A hidden little wonder',
    i.set,
    `<div class="inspection-model" data-model="${id}" data-unknown="${!known}" aria-label="Drag to rotate collectible"></div><p class="tiny centered">Drag to turn · slowly rotates on its own</p>${badge(i)}<p class="inspection-story">${known ? i.description : 'A silhouette in your journal, waiting for the day you meet.'}</p><div class="notice">${state.discovered.includes(id) ? 'Discovered' : 'Undiscovered'} · ${count(id)} copies owned · ${onShelf(id)} displayed<br>${i.environment === 'cave' ? 'Mossglass Cave' : 'The little seaside cove'} · ${i.method === 'surface' ? 'shoreline' : UPGRADES.find((u) => u.id === i.method)?.name || 'cave floor'}${known ? `<br>Sale value: ${i.value} sand dollars` : ''}</div><div class="custom-row"><button data-action="journal-back">← Back to ${developer ? 'gallery' : 'journal'}</button>${available(id) ? `<button data-action="place" data-id="${id}">Display in cottage</button>` : ''}</div>`,
  );
}
function backpack() {
  let html =
    '<p class="lead">A pocketful of lovely things. Displayed treasures are protected from selling.</p>';
  const owned = CATALOG.filter((i) => count(i.id));
  html += owned.length
    ? owned
        .map(
          (i) =>
            `<div class="line-item"><button class="line-icon" data-action="inspect" data-id="${i.id}" aria-label="Inspect ${i.name}">${iconFor(i)}</button><div class="line-info"><b>${i.name} ×${count(i.id)}</b>${badge(i)}<small>${onShelf(i.id)} displayed · ${available(i.id)} available</small></div><button data-action="place" data-id="${i.id}" ${!available(i.id) || state.shelf.length >= shelfSlots(state).length ? 'disabled' : ''}>Display</button></div>`,
        )
        .join('')
    : '<div class="empty-state">🧺<br>Your backpack is ready for its first little treasure.</div>';
  if (owns(state, 'pouch'))
    html +=
      '<button class="button-soft" data-action="sell-extras">Sell spare copies · keep one of each</button>';
  panelShell('Backpack', 'safe and sound', html);
}
let shopTab = 'equipment';
function exchange(which = shopTab) {
  shopTab = which;
  let html = `<p class="lead">New tools reveal new kinds of treasure. Take your time; the tide always comes back.</p><div class="notice">${state.devInfiniteMoney ? '∞' : money(state.coins)} sand dollars · ${uniqueCount()} unique discoveries</div><div class="pill-row">${['equipment', 'cottage', 'sell'].map((t) => `<button class="pill ${which === t ? 'active' : ''}" data-action="shop-tab" data-id="${t}">${t}</button>`).join('')}</div>`;
  if (which === 'sell') {
    const list = CATALOG.filter((i) => available(i.id));
    html +=
      list
        .map(
          (i) =>
            `<div class="line-item"><button class="line-icon" data-action="inspect" data-id="${i.id}">${iconFor(i)}</button><div class="line-info"><b>${i.name} ×${available(i.id)}</b>${badge(i)}</div><button data-action="sell" data-id="${i.id}">+ ${i.value}</button></div>`,
        )
        .join('') ||
      '<p class="lead">Nothing available to sell. Your displayed pieces stay safe.</p>';
  } else
    for (const u of which === 'cottage' ? DECOR : UPGRADES) {
      const reason = purchaseReason(state, u),
        owned = owns(state, u.id);
      html += `<div class="line-item"><span class="line-icon">${which === 'cottage' ? '✿' : '✧'}</span><div class="line-info"><b>${u.name}</b><small>${u.detail || 'A permanent finish for your cozy room.'}${reason && !owned ? '<br>' + reason : ''}</small></div><button data-action="${owned && u.kind ? 'apply-decor' : 'buy'}" data-id="${u.id}" ${reason && !(owned && u.kind) ? 'disabled' : ''}>${owned ? (u.kind ? 'Apply' : 'Owned') : money(u.cost)}</button></div>`;
    }
  if (which === 'cottage')
    html +=
      '<button class="button-soft" data-action="plain-wall">Plain walls</button> <button class="button-soft" data-action="painting">Open painting studio</button>';
  panelShell('Beach Exchange', 'the little trading stand', html);
}
function buy(id) {
  const u = [...UPGRADES, ...DECOR].find((u) => u.id === id);
  if (!purchase(state, id)) return;
  save();
  shelf.customize(state);
  beach.setGate(owns(state, 'caveAccess'));
  refreshHUD();
  refreshShelfUI();
  exchange();
  toast(
    u.name +
      ' is yours. ' +
      (UPGRADES.includes(u)
        ? 'New discovery pools arrive with the next tide.'
        : 'Find it in your cottage.'),
  );
}
function sell(id) {
  if (!sellTreasure(state, id)) return;
  save();
  refreshHUD();
  exchange('sell');
}
function shelfPicker() {
  const entries = CATALOG.filter((i) => available(i.id));
  panelShell(
    'Display a treasure',
    'make it your own',
    `<p class="lead">${state.shelf.length}/${shelfSlots(state).length} spaces occupied. Drag a treasure between shelf spaces; Q / R turns it.</p>` +
      (state.shelf.length >= shelfSlots(state).length
        ? '<div class="notice">Your shelves are full. More shelves are available at the exchange.</div>'
        : entries
            .map(
              (i) =>
                `<div class="line-item"><button class="line-icon" data-action="inspect" data-id="${i.id}">${iconFor(i)}</button><div class="line-info"><b>${i.name}</b><small>${available(i.id)} available</small></div><button data-action="place" data-id="${i.id}">Place</button></div>`,
            )
            .join('') ||
          '<p class="lead">Your next favorite is somewhere along the shore.</p>'),
  );
}
function selectShelf(uid) {
  selectedUid = uid;
  $('removeShelfButton').disabled = !state.shelf.some((p) => p.uid === uid);
  for (const o of shelf.displays.children) {
    const selected = o.userData.placementUid === uid;
    const marker = o.getObjectByName('selection');
    if (marker) marker.visible = selected;
  }
}
function syncShelf() {
  shelf.clearDisplay();
  for (const p of state.shelf)
    if (ITEMS[p.itemId]) {
      const o = shelf.addDisplay(ITEMS[p.itemId], p);
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(0.36, 0.385, 32),
        new THREE.MeshBasicMaterial({
          color: '#dba1b1',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        }),
      );
      marker.name = 'selection';
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = 0.01;
      marker.visible = false;
      o.add(marker);
    }
  selectShelf(selectedUid);
}
function place(id) {
  if (!ITEMS[id] || available(id) < 1) return;
  const targets = {
    main: [0, 1.18, -2.55],
    left: [-4.6, 1.18, -2.55],
    right: [4.6, 1.18, -2.55],
    cabinet: [0, 0.95, 0.25],
    sunroom: [8.6, 1.18, -2.55],
    upper: [-7.1, 5.65, -2.55],
  };
  const target = targets[$('shelfView').value] || targets.main;
  const slot = nearestSlot(state, { x: target[0], y: target[1], z: target[2] });
  if (!slot)
    return toast(
      'Your shelves are full. Visit the cottage shop for more room.',
    );
  const uid = Date.now() + Math.random();
  state.shelf.push({ ...slot, uid, itemId: id, rotation: 0 });
  selectedUid = uid;
  save();
  enterShelf();
  toast(ITEMS[id].name + ' has a place to call home ♡');
}
function removeSelected() {
  const j = state.shelf.findIndex((p) => p.uid === selectedUid);
  if (j < 0) return;
  state.shelf.splice(j, 1);
  selectedUid = null;
  save();
  syncShelf();
  toast('Returned safely to your backpack.');
}
let returnMode = 'beach';
function setShelfView(which = 'main') {
  const views = {
    main: [0, 2.7, 8, 0, 2.2, -2.48],
    left: [-4.6, 2.8, 4, -4.6, 2.2, -2.55],
    right: [4.6, 2.8, 4, 4.6, 2.2, -2.55],
    cabinet: [0, 2.6, 6, 0, 1.8, 0.25],
    sunroom: [8.6, 2.8, 5, 8.6, 2.2, -2.55],
    upper: [-7.1, 7.1, 7, -7.1, 6.6, -2.55],
    overview: [0, 5, 24, 0, 3.9, -2.48],
  };
  const p = views[which] || views.main;
  shelf.camera.position.set(...p.slice(0, 3));
  cottageControls.target.set(...p.slice(3));
  cottageControls.update();
}
function enterShelf() {
  if (mode !== 'shelf') returnMode = mode;
  closePanel();
  if (document.pointerLockElement) document.exitPointerLock();
  mode = 'shelf';
  document.body.classList.add('in-shelf');
  $('shelfControls').classList.remove('hidden');
  $('crosshair').classList.add('hidden');
  shelf.customize(state);
  setShelfView($('shelfView').value);
  syncShelf();
  refreshShelfUI();
  resize();
  changeAmbience();
}
function leaveShelf() {
  closePanel();
  mode = returnMode;
  document.body.classList.remove('in-shelf');
  $('shelfControls').classList.add('hidden');
  $('crosshair').classList.remove('hidden');
  selectShelf(null);
  resize();
  refreshHUD();
  changeAmbience();
}
function sleepUntilMorning() {
  if (!started || mode !== 'shelf' || activePanel || sleeping) return;
  sleeping = true;
  keys.clear();
  $('sleepMessage').textContent = 'The waves whisper goodnight…';
  $('sleepDay').textContent = 'Day ' + state.day;
  $('sleepScreen').classList.remove('hidden');
  requestAnimationFrame(() => $('sleepScreen').classList.add('active'));
  setTimeout(() => {
    advanceDay(state);
    spawnTides();
    save();
    beach.camera.position.set(0, 1.7, 2);
    beach.camera.rotation.set(0, 0, 0);
    scanUntil = 0;
    returnMode = 'beach';
    leaveShelf();
    $('sleepMessage').textContent = 'A fresh tide, a little possibility ♡';
    $('sleepDay').textContent = 'Day ' + state.day;
    setTimeout(() => {
      $('sleepScreen').classList.remove('active');
      setTimeout(() => {
        $('sleepScreen').classList.add('hidden');
        sleeping = false;
      }, 650);
    }, 1000);
  }, 1100);
}
function refreshShelfUI() {
  $('wallButton').textContent = '🎨 Walls: ' + state.wall;
  $('woodButton').textContent = '🪵 Shelves: ' + state.wood;
  $('lightButton').textContent = '✨ Lights: ' + (state.lights ? 'On' : 'Off');
  for (const o of $('shelfView').options) {
    const requirement = {
      left: 'secondShelf',
      right: 'secondShelf',
      cabinet: 'cabinet',
      sunroom: 'roomExpansion',
      upper: 'deluxeGallery',
    }[o.value];
    o.disabled = !!requirement && !owns(state, requirement);
  }
}
function painting() {
  if (!owns(state, 'paintingKit')) {
    exchange('cottage');
    toast('The painting kit is waiting in the cottage shop.');
    return;
  }
  panelShell('Painting Studio', 'a little piece of you', '');
  paintingCleanup = openPainting($('panelContent'), state.artwork, (pixels) => {
    state.artwork = pixels;
    shelf.setArtwork(pixels);
    const ok = save();
    return ok;
  });
}
function cycleOption(key, values) {
  state[key] = values[(values.indexOf(state[key]) + 1) % values.length];
  shelf.customize(state);
  save();
  refreshShelfUI();
}
function exportSave() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = `trins-trinkets-day-${state.day}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function openDeveloperMenu() {
  if (!started || sleeping) return;
  panelShell('Developer Tools', 'private playtesting ✦', devMenuHtml(state));
}
function resetDeveloperSave() {
  if (loaded.preview || loaded.error) {
    toast('Developer reset is unavailable in preview mode or while saving is blocked.');
    return openDeveloperMenu();
  }
  // Take a separate local backup before touching the active collection.
  const snapshot = JSON.stringify(state);
  try {
    storage.setItem('trins-trinkets-pre-dev-reset', snapshot);
  } catch {
    toast('Could not create a backup. Export your save before resetting.');
    return openDeveloperMenu();
  }
  resetProgress(state);
  if (!save()) {
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, JSON.parse(snapshot));
    toast('Reset did not save; your previous progress was kept.');
    return openDeveloperMenu();
  }
  closePanel();
  mode = 'beach';
  returnMode = 'beach';
  dragging = false;
  sleeping = false;
  scanUntil = 0;
  selectedUid = null;
  keys.clear();
  beach.camera.position.set(0, 1.7, 2);
  beach.camera.rotation.set(0, 0, 0);
  beach.setGate(false);
  spawnTides();
  shelf.customize(state);
  shelf.clearDisplay();
  $('shelfView').value = 'main';
  setShelfView('main');
  document.body.classList.remove('in-shelf');
  $('shelfControls').classList.add('hidden');
  $('crosshair').classList.remove('hidden');
  $('sleepScreen').classList.remove('active');
  $('sleepScreen').classList.add('hidden');
  refreshHUD();
  refreshShelfUI();
  resize();
  changeAmbience();
  toast('Fresh start! Day 1, zero sand dollars, and a brand-new tide. ♡');
}
function help() {
  panelShell(
    'How to play',
    'a very little guide',
    '<p class="lead">Explore → collect → keep or sell → decorate → sleep → a new tide. No timer, no pressure.</p><div class="keys"><kbd>WASD</kbd><span>Wander · Shift to walk faster</span><kbd>Mouse</kbd><span>Click the world to look around</span><kbd>E</kbd><span>Collect, visit the exchange, or enter the cave</span><kbd>F</kbd><span>Scan with your detector</span><kbd>B / J / H</kbd><span>Backpack / journal / cottage</span><kbd>Q / R</kbd><span>Turn the selected shelf treasure</span><kbd>Esc</kbd><span>Close a menu or leave your cottage</span></div><p class="lead">Only sleep refreshes discoveries. New tools open pools on the next tide. Complete each collection for 500 sand dollars. The cave gate needs 30 unique finds, the reinforced trowel and 8,000 sand dollars.</p><div class="custom-row"><button data-action="export">Export save</button><button data-action="gallery">Developer model gallery</button></div><p class="tiny">Saves live in this browser, on this site. Export a copy before changing browsers or clearing storage.</p>',
  );
}
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  for (const w of [beach, shelf, cave].filter(Boolean)) {
    w.camera.aspect = innerWidth / innerHeight;
    w.camera.updateProjectionMatrix();
  }
}
resize();
window.addEventListener('resize', resize);
$('startButton').onclick = () => {
  started = true;
  $('overlay').classList.add('hidden');
  refreshHUD();
  renderer.domElement.requestPointerLock?.();
  toast(
    loaded.error ||
      'The tide is lovely today. Find something you want to keep ♡',
  );
};
$('sound').onclick = toggleSound;
$('bagButton').onclick = backpack;
$('journalButton').onclick = () => {
  inspectionReturn = false;
  journal();
};
$('shelfButton').onclick = () =>
  mode === 'shelf' ? shelfPicker() : enterShelf();
$('helpButton').onclick = help;
$('exchangeButton').onclick = () => exchange();
$('closePanel').onclick = $('panelBackdrop').onclick = closePanel;
$('beachButton').onclick = leaveShelf;
$('sleepButton').onclick = sleepUntilMorning;
$('addShelfButton').onclick = shelfPicker;
$('removeShelfButton').onclick = removeSelected;
$('decorateButton').onclick = () => exchange('cottage');
$('paintingButton').onclick = painting;
$('wallButton').onclick = () =>
  cycleOption(
    'wall',
    Object.keys(SHOP_COLORS).filter(
      (c) =>
        ['cream', 'blush', 'blue', 'sage', 'lavender'].includes(c) ||
        owns(state, 'paint-' + c),
    ),
  );
$('woodButton').onclick = () =>
  cycleOption(
    'wood',
    Object.keys(WOODS).filter(
      (c) =>
        ['maple', 'white', 'walnut'].includes(c) || owns(state, 'wood-' + c),
    ),
  );
$('lightButton').onclick = () => {
  state.lights = !state.lights;
  shelf.setLights(state.lights);
  save();
  refreshShelfUI();
};
$('shelfView').onchange = (e) => setShelfView(e.target.value);
$('panelContent').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-action]');
  if (!b || b.disabled) return;
  const id = b.dataset.id,
    a = b.dataset.action;
  if (a === 'dev-toggle-money') {
    if (loaded.preview || loaded.error) {
      toast('Developer changes cannot be saved in preview or recovery mode.');
      return;
    }
    toggleUnlimitedMoney(state);
    if (!save()) {
      toggleUnlimitedMoney(state);
      toast('Saving unavailable; developer money was not changed.');
      return;
    }
    refreshHUD();
    openDeveloperMenu();
    toast(state.devInfiniteMoney ? 'Infinite testing money enabled ∞' : 'Normal money restored.');
    return;
  }
  if (a === 'dev-reset-prompt') {
    if (loaded.preview || loaded.error) {
      toast('Reset unavailable while saving is blocked or in preview mode.');
      return;
    }
    panelShell('Confirm Reset', 'destructive action', resetConfirmHtml());
    $('devResetInput')?.focus();
    return;
  }
  if (a === 'dev-reset-cancel') return openDeveloperMenu();
  if (a === 'dev-reset-confirm') {
    if ($('devResetInput')?.value.trim().toUpperCase() !== 'RESET') return;
    resetDeveloperSave();
    return;
  }
  if (a === 'tab') {
    tab = id;
    journal(activePanel === 'model gallery');
  }
  if (a === 'inspect') inspect(id);
  if (a === 'journal-back') journal(inspectionReturn);
  if (a === 'shop-tab') exchange(id);
  if (a === 'buy') buy(id);
  if (a === 'sell') sell(id);
  if (a === 'place') place(id);
  if (a === 'painting') painting();
  if (a === 'export') exportSave();
  if (a === 'gallery') {
    inspectionReturn = true;
    journal(true);
  }
  if (a === 'apply-decor') {
    const u = DECOR.find((u) => u.id === id);
    if (owns(state, id)) {
      state[u.kind] = u.option;
      shelf.customize(state);
      refreshShelfUI();
      save();
      toast(u.name + ' applied.');
    }
  }
  if (a === 'plain-wall') {
    state.wallpaper = 'none';
    shelf.customize(state);
    save();
    toast('Plain painted walls.');
  }
  if (a === 'sell-extras') {
    sellExtras(state);
    save();
    refreshHUD();
    backpack();
  }
});
$('panelContent').addEventListener('input', (e) => {
  if (e.target.id !== 'devResetInput') return;
  const btn = $('panelContent').querySelector('[data-action="dev-reset-confirm"]');
  if (btn) btn.disabled = e.target.value.trim().toUpperCase() !== 'RESET';
});
// Secret typed sequence; no visible access button in the ordinary game UI.
let devSequenceProgress = 0;
let devSequenceTime = 0;
function devSequenceKey(e) {
  if (!started || sleeping || e.repeat || e.ctrlKey || e.altKey || e.metaKey ||
      e.target.matches('input,select,textarea,[contenteditable="true"]')) return false;
  const key = e.key.toLowerCase();
  if (key.length !== 1 || !/^[a-z]$/.test(key)) {
    devSequenceProgress = 0;
    return false;
  }
  const now = performance.now();
  if (now - devSequenceTime > 3500) devSequenceProgress = 0;
  if (key === DEV_SEQUENCE[devSequenceProgress]) {
    devSequenceTime = now;
    devSequenceProgress++;
    e.preventDefault();
    if (devSequenceProgress === DEV_SEQUENCE.length) {
      devSequenceProgress = 0;
      openDeveloperMenu();
    }
    return true;
  }
  devSequenceProgress = key === DEV_SEQUENCE[0] ? 1 : 0;
  if (devSequenceProgress) {
    devSequenceTime = now;
    e.preventDefault();
    return true;
  }
  return false;
}
renderer.domElement.onclick = () => {
  if (
    started &&
    mode !== 'shelf' &&
    !activePanel &&
    !document.pointerLockElement
  )
    renderer.domElement.requestPointerLock?.();
};
document.addEventListener('mousemove', (e) => {
  if (
    mode === 'shelf' ||
    !started ||
    activePanel ||
    document.pointerLockElement !== renderer.domElement
  )
    return;
  const camera = currentWorld().camera;
  camera.rotation.y -= e.movementX * 0.00215;
  camera.rotation.x = clamp(
    camera.rotation.x - e.movementY * 0.00215,
    -1.24,
    1.24,
  );
});
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (e.target.matches('input,select,textarea')) return;
  if (devSequenceKey(e)) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key))
    e.preventDefault();
  if (k === 'escape') {
    if (activePanel) closePanel();
    else if (mode === 'shelf') leaveShelf();
    return;
  }
  if (!started || sleeping) return;
  if (e.repeat) {
    keys.add(k);
    return;
  }
  if (!activePanel) {
    if (k === 'b') return backpack();
    if (k === 'j') return journal();
    if (k === 'h') return mode === 'shelf' ? leaveShelf() : enterShelf();
    if (k === '?' || k === '/') return help();
    if (mode !== 'shelf') {
      if (k === 'e') return interact();
      if (k === 'f') return scan();
    } else if (k === 'q' || k === 'r') {
      const p = state.shelf.find((p) => p.uid === selectedUid);
      if (p) {
        p.rotation += ((k === 'r' ? 1 : -1) * Math.PI) / 12;
        save();
        syncShelf();
      }
    }
  }
  keys.add(k);
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) keys.clear();
});
function pointerRay(e) {
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  );
  raycaster.setFromCamera(mouse, shelf.camera);
}
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (mode !== 'shelf' || activePanel) return;
  pointerRay(e);
  const hit = raycaster
    .intersectObjects(shelf.displays.children, true)
    .find((h) => h.object.name !== 'selection');
  let obj = hit?.object;
  while (obj && obj.userData.placementUid == null) obj = obj.parent;
  selectShelf(obj?.userData.placementUid ?? null);
  if (selectedUid != null) {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    renderer.domElement.setPointerCapture(e.pointerId);
  }
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragging || mode !== 'shelf') return;
  const p = state.shelf.find((p) => p.uid === selectedUid);
  if (!p) return;
  pointerRay(e);
  const point = new THREE.Vector3();
  const screenDistance = (slot) => {
    point.set(slot.x, slot.y + 0.15, slot.z).project(shelf.camera);
    return (
      ((point.x - mouse.x) * innerWidth) ** 2 +
      ((point.y - mouse.y) * innerHeight) ** 2
    );
  };
  const target = shelfSlots(state)
    .filter((slot) => slotFree(slot, state.shelf, p.uid))
    .sort((a, b) => screenDistance(a) - screenDistance(b))[0];
  if (target) {
    const object = shelf.displays.children.find(
      (o) => o.userData.placementUid === p.uid,
    );
    if (object) object.position.set(target.x, target.y, target.z);
    dragStart.target = target;
  }
});
function stopDrag() {
  if (!dragging) return;
  dragging = false;
  const p = state.shelf.find((p) => p.uid === selectedUid);
  if (p && dragStart?.target) Object.assign(p, dragStart.target);
  save();
  syncShelf();
}
renderer.domElement.addEventListener('pointerup', stopDrag);
renderer.domElement.addEventListener('pointercancel', stopDrag);
function move(dt) {
  if (
    mode === 'shelf' ||
    activePanel ||
    sleeping ||
    document.pointerLockElement !== renderer.domElement
  )
    return;
  let f =
      Number(keys.has('w') || keys.has('arrowup')) -
      Number(keys.has('s') || keys.has('arrowdown')),
    s =
      Number(keys.has('d') || keys.has('arrowright')) -
      Number(keys.has('a') || keys.has('arrowleft'));
  if (!f && !s) return;
  const speed = ((keys.has('shift') ? 7 : 4.5) * dt) / Math.hypot(f, s),
    camera = currentWorld().camera,
    a = camera.rotation.y,
    p = camera.position;
  const nx = p.x - Math.sin(a) * f * speed + Math.cos(a) * s * speed,
    nz = p.z - Math.cos(a) * f * speed - Math.sin(a) * s * speed;
  if (mode === 'cave') {
    p.x = clamp(nx, -6.2, 6.2);
    p.z = clamp(nz, -23, 4);
    return;
  }
  if (nx > 14.5 && Math.abs(nz - 1) < 2) {
    if (owns(state, 'caveAccess')) enterCave();
    return;
  }
  if (nx > 14.5 || nx < -14.5 || nz < -14 || nz > 18) return;
  if (
    (nx > -11.2 && nx < -3.8 && nz > 9.5) ||
    (nx > 4.7 && nx < 10.3 && nz > 10)
  )
    return;
  p.x = nx;
  p.z = nz;
}
let soundOn = false,
  audioCtx,
  oceanSound,
  ambientFilter;
function toggleSound() {
  soundOn = !soundOn;
  $('sound').textContent = soundOn ? '♫' : '♪';
  $('sound').title = soundOn ? 'Mute ambient sounds' : 'Enable ambient sounds';
  if (soundOn) startOcean();
  else oceanSound?.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
}
function changeAmbience() {
  if (!audioCtx || !ambientFilter) return;
  ambientFilter.frequency.setTargetAtTime(
    mode === 'cave' ? 155 : mode === 'shelf' ? 230 : 380,
    audioCtx.currentTime,
    0.5,
  );
}
function startOcean() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();
    if (oceanSound) {
      oceanSound.gain.setTargetAtTime(0.028, audioCtx.currentTime, 0.3);
      changeAmbience();
      return;
    }
    const size = audioCtx.sampleRate * 3,
      buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    ambientFilter = audioCtx.createBiquadFilter();
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.value = 380;
    const volume = audioCtx.createGain();
    volume.gain.value = 0.028;
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.11;
    const depth = audioCtx.createGain();
    depth.gain.value = 0.013;
    lfo.connect(depth);
    depth.connect(volume.gain);
    source.connect(ambientFilter);
    ambientFilter.connect(volume);
    volume.connect(audioCtx.destination);
    source.start();
    lfo.start();
    oceanSound = volume;
    changeAmbience();
  } catch {
    soundOn = false;
  }
}
function chime(hz, length) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(),
    v = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = hz;
  v.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  v.gain.exponentialRampToValueAtTime(0.035, audioCtx.currentTime + 0.02);
  v.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + length);
  o.connect(v);
  v.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + length);
}
let nextDrip = 0;
function caveDrip() {
  if (!audioCtx || !soundOn) return;
  const oscillator = audioCtx.createOscillator(),
    volume = audioCtx.createGain();
  const echo = audioCtx.createDelay(1),
    feedback = audioCtx.createGain();
  oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    480,
    audioCtx.currentTime + 0.12,
  );
  volume.gain.setValueAtTime(0.009, audioCtx.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.28);
  echo.delayTime.value = 0.24;
  feedback.gain.value = 0.26;
  oscillator.connect(volume);
  volume.connect(audioCtx.destination);
  volume.connect(echo);
  echo.connect(feedback);
  feedback.connect(echo);
  feedback.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.3);
  setTimeout(() => {
    volume.disconnect();
    echo.disconnect();
    feedback.disconnect();
  }, 1600);
}
refreshHUD();
refreshShelfUI();
syncShelf();
if (new URLSearchParams(location.search).has('gallery')) {
  started = true;
  $('overlay').classList.add('hidden');
  journal(true);
}
if (loaded.preview) {
  started = true;
  $('overlay').classList.add('hidden');
  if (preview === 'cave') enterCave();
  else enterShelf();
}
if (loaded.error) setTimeout(() => toast(loaded.error), 200);
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.06),
    t = clock.elapsedTime;
  cottageControls.enabled = mode === 'shelf' && !activePanel;
  if (cottageControls.enabled) cottageControls.update();
  if (started) move(dt);
  if (mode === 'beach')
    beach.update(
      t,
      owns(state, 'detector') && performance.now() < scanUntil,
      owns(state, 'professional') ? 30 : owns(state, 'coil') ? 20 : 12,
    );
  if (mode === 'cave') {
    cave.update(t, owns(state, 'lantern'));
    if (soundOn && t > nextDrip) {
      caveDrip();
      nextDrip = t + 4 + Math.random() * 5;
    }
  }
  if (started && mode !== 'shelf' && !sleeping && !activePanel) {
    const target = nearTarget(),
      prompt = target?.name || '';
    if (prompt !== lastPrompt) {
      $('interaction').textContent = target ? 'E · ' + prompt : '';
      $('interaction').classList.toggle('visible', !!target);
      lastPrompt = prompt;
    }
  }
  const w = mode === 'shelf' ? shelf : currentWorld();
  renderer.render(w.scene, w.camera);
  renderMuseum(t);
}
animate();
