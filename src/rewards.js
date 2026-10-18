import { CATALOG } from './catalog.js';
export const DECOR_REWARDS = [
  {
    id: 'shore-wreath',
    count: 50,
    name: 'Seaside Keepsake Wreath',
    detail: 'A pearly shell wreath for your cottage wall.',
  },
  {
    id: 'pearl-lamp',
    count: 100,
    name: 'Pearl Blossom Lamp',
    detail: 'A warm pearl lamp on a carved little side table.',
  },
  {
    id: 'aurora-mobile',
    count: 150,
    name: 'Aurora Moon Mobile',
    detail: 'A suspended constellation of stars, pearls and crescents.',
  },
  {
    id: 'tide-fountain',
    count: 200,
    name: 'Little Tide Fountain',
    detail: 'A tiered shell fountain with gently shimmering water.',
  },
  {
    id: 'collector-constellation',
    count: 230,
    name: 'Keeper of Every Tide',
    detail: 'A golden celestial wall sculpture celebrating all 230 treasures.',
  },
  {
    id: 'moonpool-aquarium',
    set: 'Moonpool Wonders',
    name: 'Glowing Moonpool Aquarium',
    detail:
      'A living little Moonpool of coral, luminous plants and pearly lights.',
  },
];
export function rewardProgress(s, r) {
  const group = CATALOG.filter((i) => !r.set || i.set === r.set),
    known = new Set(s.discovered);
  return {
    found: group.filter((i) => known.has(i.id)).length,
    total: r.count || group.length,
  };
}
export function claimDecorRewards(s) {
  s.rewardDecor ??= [];
  s.disabledRewards ??= [];
  const gained = [];
  for (const r of DECOR_REWARDS) {
    const { found, total } = rewardProgress(s, r);
    if (found >= total && !s.rewardDecor.includes(r.id)) {
      s.rewardDecor.push(r.id);
      gained.push(r);
    }
  }
  return gained;
}
export const rewardEnabled = (s, id) =>
  s.rewardDecor?.includes(id) && !s.disabledRewards?.includes(id);
export function toggleReward(s, id) {
  if (!s.rewardDecor.includes(id)) return false;
  const at = s.disabledRewards.indexOf(id);
  if (at < 0) s.disabledRewards.push(id);
  else s.disabledRewards.splice(at, 1);
  return true;
}
export function rewardsHtml(s, controls = false) {
  return (
    '<div class="set-header"><h3>Little collection celebrations</h3></div><p class="tiny">These decorations are earned by collecting, and are yours forever.</p>' +
    DECOR_REWARDS.map((r) => {
      const unlocked = s.rewardDecor.includes(r.id),
        p = rewardProgress(s, r);
      return `<div class="line-item"><span class="line-icon">${unlocked ? '✿' : '☾'}</span><div class="line-info"><b>${r.name}</b><small>${r.detail}<br>${r.set ? r.set : r.count + ' unique treasures'} · ${Math.min(p.found, p.total)}/${p.total}${unlocked ? ' · Earned' : ''}</small></div>${controls && unlocked ? `<button data-action="reward-toggle" data-id="${r.id}">${rewardEnabled(s, r.id) ? 'Put away' : 'Display'}</button>` : '<span>' + (unlocked ? '♡' : '…') + '</span>'}</div>`;
    }).join('')
  );
}
