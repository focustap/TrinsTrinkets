import { fresh } from './save.js';
import { ensureTides } from './tide.js';
import { CATALOG } from './catalog.js';
import { owns } from './progression.js';
import { claimCompletedSets } from './inventory.js';
import { claimDecorRewards, rewardsHtml } from './rewards.js';
export function grantBiomeAccess(s) {
  for (const id of [
    'shovel',
    'trowel',
    'caveAccess',
    'lantern',
    'pick',
    'moonpoolAccess',
  ]) {
    if (!s.equipment.includes(id)) s.equipment.push(id);
    s[id] = true;
  }
  for (const item of CATALOG.filter((i) => i.environment === 'cave').slice(
    0,
    15,
  ))
    if (!s.discovered.includes(item.id)) s.discovered.push(item.id);
  ensureTides(s);
}

// Unlock the catalog without duplicating owned items or awarding the same reward twice.
export function grantAllCollectibles(state) {
  const known = new Set(state.discovered);
  let added = 0;
  let discovered = 0;
  for (const item of CATALOG) {
    if (!known.has(item.id)) {
      state.discovered.push(item.id);
      known.add(item.id);
      discovered++;
    }
    if ((state.bag[item.id] || 0) < 1) {
      state.bag[item.id] = 1;
      added++;
    }
  }
  state.recent = [...CATALOG.slice(-12).map((item) => item.id).reverse()];
  const sets = claimCompletedSets(state);
  const rewards = claimDecorRewards(state);
  return { added, discovered, sets, rewards, total: CATALOG.length };
}

// Local developer conveniences. These are not an access-control or cheat-protection system.
export const DEV_SEQUENCE = 'pearl';

export function toggleUnlimitedMoney(state) {
  state.devInfiniteMoney = !state.devInfiniteMoney;
  return state.devInfiniteMoney;
}

export function resetProgress(state, rng = Math.random) {
  const clean = fresh();
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, clean);
  ensureTides(state, rng);
  return state;
}

export function devMenuHtml(state) {
  return `<p class="lead">Private testing controls for this browser. These don't appear in the normal game menus.</p>
    <div class="dev-stat"><span>Current save</span><strong>Day ${state.day} · ${state.coins.toLocaleString('en-US')} sand dollars</strong></div>
    <div class="dev-stat"><span>Testing funds</span><strong>${state.devInfiniteMoney ? '∞ Unlimited ON' : 'Normal earnings'}</strong></div>
    <div class="dev-row">
      <button class="button-soft" data-action="dev-toggle-money">${state.devInfiniteMoney ? 'Disable' : 'Enable'} infinite money</button>
      <button class="button-soft" data-action="export">Export current save</button>
    </div>
    <p class="tiny">Infinite money ignores shop prices but keeps collection and equipment unlock requirements. Turning it off returns to your actual saved balance.</p>
    <div class="divider"></div><h3>Collections & rewards</h3>
    <p class="lead">Add one of all ${CATALOG.length} treasures to your backpack, including Mythics and biome-exclusive finds. Mark them discovered, complete every collection, and unlock the real collection rewards. Safe to press again: existing quantities and claimed rewards won't be duplicated.</p>
    <div class="dev-stat"><span>Discovered</span><strong>${CATALOG.filter((i) => state.discovered.includes(i.id)).length} / ${CATALOG.length}</strong></div>
    <div class="dev-row"><button class="button-soft" data-action="dev-add-all">✦ Add all ${CATALOG.length} collectibles + rewards</button>
    <button class="button-soft" data-action="dev-open-journal">Open collection journal</button>
    <button class="button-soft" data-action="dev-view-cottage">View rewards in cottage</button></div>
    <p class="tiny">This changes your saved progress. Export your save first if you want to return to your original collection.</p>
    ${rewardsHtml(state, true)}
    <div class="divider"></div><h3>Biome playtesting</h3>
    <p class="tiny">Granting access changes this save: tools, cave access, 15 cave discoveries and Moonpool access. Travel preserves every daily find.</p>
    <button class="button-soft" data-action="dev-grant-biomes">Grant cave & Moonpool access</button>
    <div class="dev-row">${['beach', 'gate', 'cave', 'passage', 'moonpool'].map((id) => `<button class="button-soft" data-action="dev-travel" data-id="${id}" ${id !== 'beach' && id !== 'gate' && !owns(state, id === 'moonpool' ? 'moonpoolAccess' : 'caveAccess') ? 'disabled' : ''}>${{ beach: 'Beach', gate: 'Beach entrance', cave: 'Cave', passage: 'Moonpool passage', moonpool: 'Moonpool' }[id]}</button>`).join('')}</div>
    <p class="tiny">Unsaved visual fixtures (your real save is untouched):</p><div class="dev-row">${['entrance-locked', 'entrance-open', 'passage-locked', 'passage-ready', 'moonpool', 'milestones'].map((id) => `<button class="button-soft" data-action="dev-preview" data-id="${id}">${id}</button>`).join('')}<button class="button-soft" data-action="dev-exit-preview">Return to saved game</button></div>
    <div class="divider"></div>
    <h3>Fresh start</h3>
    <p class="lead">Reset everything to Day 1 with zero money: discoveries, inventory, equipment, cave, house upgrades, shelf displays, paintings, and the daily tide. Infinite money turns off too.</p>
    <button class="dev-reset-button" data-action="dev-reset-prompt">Reset all progress…</button>
    <p class="tiny">This replaces the current browser save. Export first if you want a permanent copy.</p>`;
}

export function resetConfirmHtml() {
  return `<p class="lead"><strong>This will erase this browser's current game progress.</strong> Type <strong>RESET</strong> to confirm. The game will restart on Day 1 with no money.</p>
    <label class="dev-confirm-label">Confirmation <input id="devResetInput" autocomplete="off" spellcheck="false" placeholder="Type RESET" /></label>
    <div class="dev-row">
      <button class="button-soft" data-action="dev-reset-cancel">Cancel</button>
      <button class="dev-reset-button" data-action="dev-reset-confirm" disabled>Reset to Day 1</button>
    </div>`;
}
