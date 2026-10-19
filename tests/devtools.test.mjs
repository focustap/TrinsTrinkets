import test from 'node:test';
import assert from 'node:assert/strict';
import { fresh, migrateSave, writeSave, loadSave, SAVE_KEY } from '../src/save.js';
import { toggleUnlimitedMoney, resetProgress, grantAllCollectibles, devMenuHtml, DEV_SEQUENCE } from '../src/devtools.js';
import { CATALOG, SETS } from '../src/catalog.js';
import { DECOR_REWARDS } from '../src/rewards.js';
import { purchase, purchaseReason } from '../src/progression.js';

test('hidden developer controls preserve prices and normal balance', () => {
  const s = fresh();
  assert.equal(DEV_SEQUENCE, 'pearl');
  assert.equal(purchaseReason(s, { id:'shovel', cost:175, requires:[] }), 'Not enough sand dollars');
  assert.equal(toggleUnlimitedMoney(s), true);
  assert.equal(s.coins, 0);
  assert.equal(purchase(s, 'shovel'), true);
  assert.equal(s.coins, 0, 'dev purchases must not spend real coins');
  assert.equal(purchase(s, 'detector'), false, 'unlimited money must not bypass prerequisite equipment');
  assert.equal(toggleUnlimitedMoney(s), false);
  assert.equal(s.coins, 0);
  assert.equal(purchase(s, 'sifter'), false, 'normal shop prices return when disabled');
});

test('full reset returns all systems to Day 1 without developer privileges', () => {
  const s = fresh();
  Object.assign(s, {
    day: 47, coins: 9831, devInfiniteMoney:true,
    bag: { 'pink-scallop': 17 }, discovered:['pink-scallop'],
    claimed:['Shells'], equipment:['shovel','detector','caveAccess'],
    purchases:['secondShelf','paintingKit'], shovel:true, detector:true,
    shelf:[{uid:'x',itemId:'pink-scallop',x:0,y:1.18,z:-2.55}],
    artwork: Array.from({length:1024},()=> '#ff00aa'),
    wall:'rose', wood:'walnut', wallpaper:'stars', caveAccess:true,
    recent:['pink-scallop'], specialDeveloperJunk:true,
  });
  resetProgress(s,()=>.35);
  assert.equal(s.day,1);
  assert.equal(s.coins,0);
  assert.equal(s.devInfiniteMoney,false);
  assert.deepEqual(s.bag,{});
  assert.deepEqual(s.discovered,[]);
  assert.deepEqual(s.claimed,[]);
  assert.deepEqual(s.equipment,[]);
  assert.deepEqual(s.purchases,[]);
  assert.deepEqual(s.shelf,[]);
  assert.equal(s.artwork,null);
  assert.equal(s.wall,'cream');
  assert.equal(s.caveAccess,undefined);
  assert.equal(s.specialDeveloperJunk,undefined);
  assert.equal(s.beachFinds.length,18);
  assert.equal(s.caveFinds.length,12);
});

test('developer money setting survives save migration and can be disabled', () => {
  const old = migrateSave({version:1,coins:5,day:3});
  assert.equal(old.devInfiniteMoney,false);
  const store = new Map();
  const storage = {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  old.devInfiniteMoney = true;
  assert.equal(writeSave(storage,old).ok,true);
  let loaded = loadSave(storage).state;
  assert.equal(loaded.devInfiniteMoney,true);
  toggleUnlimitedMoney(loaded);
  assert.equal(writeSave(storage,loaded).ok,true);
  loaded=loadSave(storage).state;
  assert.equal(loaded.devInfiniteMoney,false);
  assert.equal(loaded.coins,5);
  assert.ok(store.has(SAVE_KEY));
});

test('grant-all unlocks the entire catalog, real milestone rewards and completed sets exactly once', () => {
  const s = fresh();
  s.coins = 105;
  const alreadyOwned = CATALOG[0].id;
  s.bag[alreadyOwned] = 4;
  s.discovered.push(alreadyOwned);
  const result = grantAllCollectibles(s);
  assert.equal(result.total, CATALOG.length);
  assert.equal(result.added, CATALOG.length - 1);
  assert.equal(result.discovered, CATALOG.length - 1);
  assert.equal(s.discovered.length, CATALOG.length);
  assert.equal(new Set(s.discovered).size, CATALOG.length);
  assert.equal(Object.keys(s.bag).length, CATALOG.length);
  assert.equal(s.bag[alreadyOwned], 4, 'existing copies are preserved');
  assert.ok(CATALOG.every(item => s.bag[item.id] >= 1));
  assert.deepEqual(new Set(s.claimed),new Set(SETS));
  assert.deepEqual(new Set(s.rewardDecor),new Set(DECOR_REWARDS.map(r=>r.id)));
  assert.equal(s.coins, 105 + (SETS.length - 1) * 500, 'real completed-set rewards are credited once');
  const snapshot = structuredClone(s);
  const again = grantAllCollectibles(s);
  assert.equal(again.added, 0);
  assert.equal(again.discovered, 0);
  assert.deepEqual(again.sets, []);
  assert.deepEqual(again.rewards, []);
  assert.deepEqual(s, snapshot, 'repeated grant must not change the save');
  const html = devMenuHtml(s);
  assert.ok(html.includes('dev-add-all'));
  assert.ok(html.includes('dev-open-journal'));
  assert.ok(html.includes('dev-view-cottage'));
  assert.ok(html.includes('Moonpool Aquarium') || html.includes('Moonpool aquarium'));
});

test('granted collectibles and rewards persist after refresh and reset can clear everything', () => {
  const storage = new Map();
  const adapter={getItem:key=>storage.get(key)??null,setItem:(key,val)=>storage.set(key,val)};
  const s = fresh();
  grantAllCollectibles(s);
  assert.equal(writeSave(adapter,s).ok,true);
  const after = loadSave(adapter).state;
  assert.equal(after.discovered.length, CATALOG.length);
  assert.equal(after.rewardDecor.length,DECOR_REWARDS.length);
  assert.equal(after.claimed.length,SETS.length);
  assert.ok(after.bag[CATALOG.at(-1).id]>=1);
  resetProgress(after,()=>0.2);
  assert.equal(after.day,1);
  assert.equal(after.coins,0);
  assert.deepEqual(after.bag,{});
  assert.deepEqual(after.discovered,[]);
  assert.deepEqual(after.rewardDecor,[]);
  assert.deepEqual(after.claimed,[]);
});
