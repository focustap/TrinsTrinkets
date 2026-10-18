import { fresh } from './save.js';
import { ensureTides } from './tide.js';

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
