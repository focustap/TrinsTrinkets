import * as THREE from 'three';
import './style.css';
import {CATALOG,ITEMS,SETS,UPGRADES,SHOP_COLORS,WOODS,pickRandom} from './catalog.js';
import {createBeachScene,createShelfScene} from './world.js';

const $ = id => document.getElementById(id);
const KEY = 'trins-trinkets-save-v1';
const clampDay = day=>Math.max(1,Math.min(99999,day));
const fresh = () => ({coins:0,bag:{},discovered:[],claimed:[],shovel:false,detector:false,shelf:[],wall:'cream',wood:'maple',lights:true,day:1,beachFinds:null});
function load(){
  try {
    const s=JSON.parse(localStorage.getItem(KEY)||'null');
    if(!s||typeof s!=='object')return fresh();
    const d=fresh();
    d.coins=Number.isFinite(s.coins)?Math.max(0,Math.floor(s.coins)):0;
    for(const item of CATALOG)if(Number.isFinite(s.bag?.[item.id]))
      d.bag[item.id]=Math.max(0,Math.min(100000,Math.floor(s.bag[item.id])));
    d.discovered=Array.isArray(s.discovered)?s.discovered.filter(id=>!!ITEMS[id]):[];
    d.claimed=Array.isArray(s.claimed)?s.claimed.filter(id=>SETS.includes(id)):[];
    d.shovel=!!s.shovel;d.detector=!!s.detector;
    d.day=Number.isSafeInteger(s.day)?clampDay(s.day):1;
    d.beachFinds=Array.isArray(s.beachFinds)?
      s.beachFinds.filter(f=>ITEMS[f?.itemId]&&['surface','shovel','detector'].includes(f.method)&&
        Number.isFinite(f.x)&&Number.isFinite(f.z)&&f.x>=-13.5&&f.x<=13.5&&f.z>=-13&&f.z<=6.5&&
        ITEMS[f.itemId].method===f.method&&typeof f.uid==='string')
        .slice(0,18).map(f=>({uid:f.uid,itemId:f.itemId,method:f.method,x:f.x,z:f.z})):null;
    d.wall=SHOP_COLORS[s.wall]?s.wall:'cream';d.wood=WOODS[s.wood]?s.wood:'maple';d.lights=s.lights!==false;
    d.shelf=Array.isArray(s.shelf)?s.shelf.filter(p=>ITEMS[p.itemId]&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z)&&Number.isFinite(p.uid)).slice(0,18).map(p=>({
      uid:p.uid,itemId:p.itemId,x:Math.max(-2.28,Math.min(2.28,p.x)),
      y:[1.18,2.13,3.07].reduce((a,b)=>Math.abs(b-p.y)<Math.abs(a-p.y)?b:a),
      z:Math.max(-2.94,Math.min(-2.42,p.z)),rotation:Number.isFinite(p.rotation)?p.rotation:0
    })):[];
    return d;
  }catch{return fresh();}
}
const state=load();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};
const beach=createBeachScene(),shelf=createShelfScene();
shelf.setWall(SHOP_COLORS[state.wall]);shelf.setWood(WOODS[state.wood]);shelf.setLights(state.lights);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;
$('game').appendChild(renderer.domElement);
renderer.domElement.tabIndex=0;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const clock=new THREE.Clock();
let mode='beach',started=false,activePanel='',tab='All',near=null,toastTimer=0,scanUntil=0,selectedUid=null,dragging=false,dragX=0,dragY=0,sleeping=false;
const keys=new Set();
const yAxis=new THREE.Vector3(0,1,0);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const count=id=>state.bag[id]||0;
const onShelf=id=>state.shelf.filter(p=>p.itemId===id).length;
const available=id=>Math.max(0,count(id)-onShelf(id));
const ownedCount=()=>CATALOG.reduce((n,i)=>n+count(i.id),0);
const uniqueCount=()=>new Set(state.discovered).size;
const money=n=>n.toLocaleString('en-US');
const iconFor=i=>({
 shell:'🐚',scallop:'🐚',conch:'🐚',pearl:'🦪',glass:'💎',bracelet:'📿',charm:'💗',ring:'💍',
 coin:'🪙',key:'🗝️',starfish:'⭐',fossil:'🌀',tooth:'🦈',bottle:'🍾'
})[i.type]||'✧';
function refreshHUD(){
  $('balance').textContent=money(state.coins);
  $('dayNumber').textContent=state.day;
  const u=uniqueCount();
  const remaining=state.beachFinds?.filter(f=>f.method==='surface' ||
    (f.method==='shovel'&&state.shovel)||(f.method==='detector'&&state.detector)).length||0;
  $('mission').textContent=remaining===0?'The beach is quiet now · sleep for a fresh tide 🌙':
    !u?'Find your first little treasure ✦':!state.shovel?
    'Find treasures, then buy a shovel ✿':!state.detector?
    'Look for small sand mounds · '+remaining+' finds left':
    'Scan with F · '+remaining+' finds left today ✦';
}
function toast(message){
  const el=$('toast');el.textContent=message;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);
}
// The tide is fixed for each day and persisted. Reloading cannot generate free new loot.
function spawnOne(method) {
  const item=pickRandom(method);
  let x,z,attempt=0;
  do {
    x=(Math.random()-.5)*25.5;z=-12.5+Math.random()*19;attempt++;
  }while(attempt<70&&(
    Math.hypot(x-7.5,z-8.2)<3.2||Math.hypot(x+7.5,z-7.9)<3.2||
    Math.hypot(x-beach.camera.position.x,z-beach.camera.position.z)<2||
    state.beachFinds.some(f=>Math.hypot(f.x-x,f.z-z)<1.55)
  ));
  const uid=state.day+'-'+state.beachFinds.length+'-'+Math.floor(Math.random()*1000000);
  const find={uid,itemId:item.id,method,x,z};
  state.beachFinds.push(find);
  beach.spawn(item,method,x,z,uid);
}
function newTide(){
  beach.clearFinds();
  state.beachFinds=[];
  // A handful of treasures per day keeps the cove inviting rather than cluttered.
  for(const [method,n] of [['surface',9],['shovel',5],['detector',4]])
    for(let i=0;i<n;i++)spawnOne(method);
  save();
  refreshHUD();
}
if(state.beachFinds===null)newTide();
else for(const f of state.beachFinds)beach.spawn(ITEMS[f.itemId],f.method,f.x,f.z,f.uid);
function collect(find){
  const {item,method}=find.userData.find;
  if(method==='shovel'&&!state.shovel)return toast('A little shovel would help here!');
  if(method==='detector'&&!state.detector)return;
  if(method==='detector'&&performance.now()>scanUntil)return toast('Press F to scan for buried treasures.');
  beach.remove(find);
  state.beachFinds=state.beachFinds.filter(f=>f.uid!==find.userData.find.uid);
  state.bag[item.id]=(state.bag[item.id]||0)+1;
  const first=!state.discovered.includes(item.id);
  if(first)state.discovered.push(item.id);
  const adjective=first?'✦ NEW FIND! ':'Added to backpack · ';
  toast(adjective+item.name+(item.rarity==='Legendary'?' ✨':''));
  if(first){
    const setItems=CATALOG.filter(i=>i.set===item.set);
    if(setItems.every(i=>state.discovered.includes(i.id))&&!state.claimed.includes(item.set)){
      state.claimed.push(item.set);state.coins+=75;
      setTimeout(()=>toast('✿ '+item.set+' collection complete! +75 sand dollars'),850);
    }
  }
  save();refreshHUD();
}
function nearTarget() {
  const pos=beach.camera.position,dxz=p=>Math.hypot(pos.x-p.x,pos.z-p.z);
  const exchange=dxz(beach.stations.exchange),cottage=dxz(beach.stations.cottage);
  if(exchange<3.5)return {kind:'exchange',distance:exchange,name:'Browse beach exchange'};
  if(cottage<3.5)return {kind:'cottage',distance:cottage,name:'Enter your cottage'};
  let chosen=null;
  for(const f of beach.finds){
    if(!f.visible)continue;
    if(f.userData.find.method==='shovel'&&!state.shovel)continue;
    const d=dxz(f.position);
    if(d>2.55)continue;
    const to=f.position.clone().sub(pos);to.y=0;to.normalize();
    const dir=new THREE.Vector3(0,0,-1).applyAxisAngle(yAxis,beach.camera.rotation.y);
    // Gentle aim preference without forcing pixel-perfect targeting.
    const facing=to.dot(dir);
    const score=d-(facing>.35?.65:0);
    if(!chosen||score<chosen.score)chosen={kind:'find',find:f,distance:d,score,name:f.userData.find.method==='surface'?
      'Pick up '+f.userData.find.item.name:'Dig in the sand'};
  }
  return chosen;
}
function setInteraction(t){
  const el=$('interaction');
  if(mode!=='beach'||!started||activePanel||!t){el.classList.remove('visible');return;}
  el.innerHTML='<kbd>E</kbd>'+t.name;
  el.classList.add('visible');
}
function interact(){
  if(!started||mode!=='beach'||activePanel)return;
  const target=nearTarget();if(!target)return;
  if(target.kind==='find')collect(target.find);
  if(target.kind==='exchange')exchange();
  if(target.kind==='cottage')enterShelf();
}
function scan() {
  if(!state.detector){toast('The metal detector is available at the exchange ✨');return;}
  if(mode!=='beach'||activePanel)return;
  scanUntil=performance.now()+10000;
  const hidden=beach.finds.filter(f=>f.userData.find.method==='detector');
  const d=Math.min(...hidden.map(f=>Math.hypot(f.position.x-beach.camera.position.x,f.position.z-beach.camera.position.z)),Infinity);
  toast(d<7?'BEEP! Something is buried nearby! ✨':'Detector scanning... look for golden rings in the sand');
  if(soundOn)chime(650,.17);
}
function panelShell(title,eyebrow,html) {
  activePanel=title.toLowerCase();
  $('panelTitle').textContent=title;$('panelEyebrow').textContent=eyebrow;
  $('panelContent').innerHTML=html;
  $('panelBackdrop').classList.remove('hidden');$('panel').classList.remove('hidden');
  if(document.pointerLockElement)document.exitPointerLock();
  setInteraction(null);
}
function closePanel(){
  activePanel='';$('panel').classList.add('hidden');$('panelBackdrop').classList.add('hidden');
}
function itemCard(item) {
  const known=state.discovered.includes(item.id);
  return '<div class="item-card '+(!known?'unknown':item.rarity==='Legendary'||item.rarity==='Rare'?'rare':'')+'">'+
    '<span class="item-emoji">'+(known?iconFor(item):'❔')+'</span>'+
    '<b>'+(known?item.name:'???')+'</b><small>'+(known?item.rarity+' · '+item.method:'Not discovered yet')+'</small>'+
    (known?'<span class="count">×'+count(item.id)+'</span>':'')+'</div>';
}
function journal(){
  const inSet=tab==='All'?CATALOG:CATALOG.filter(i=>i.set===tab);
  const done=inSet.filter(i=>state.discovered.includes(i.id)).length;
  let html='<p class="lead">Every little find has a story. Discover them all to finish your collection pages and earn a sweet reward. ♡</p>'+
    '<div class="pill-row">'+['All',...SETS].map(s=>'<button class="pill '+(tab===s?'active':'')+'" data-action="tab" data-id="'+s+'">'+s+'</button>').join('')+'</div>'+
    '<div class="progress-line"><span>'+done+' of '+inSet.length+' found</span><span>'+Math.round(done/inSet.length*100)+'%</span></div>'+
    '<div class="progress-track"><div class="progress-fill" style="width:'+(done/inSet.length*100)+'%"></div></div>';
  const shown=tab==='All'?SETS:[tab];
  for(const set of shown){
    const group=CATALOG.filter(i=>i.set===set),found=group.filter(i=>state.discovered.includes(i.id)).length;
    html+='<div class="set-header"><h3>'+set+(state.claimed.includes(set)?' ✿':'')+'</h3><span>'+found+'/'+group.length+'</span></div>'+
      '<div class="item-grid">'+group.map(itemCard).join('')+'</div>';
  }
  panelShell('Collections','your keepsake journal',html);
}
function backpack(){
  const owned=CATALOG.filter(i=>count(i.id)>0);
  let html='<p class="lead">All your little treasures, safe and sound. Take your favorites to the cottage or sell the extras at the exchange.</p>';
  if(!owned.length)html+='<div class="empty-state"><span>🧺</span>Your backpack is empty.<br/>Explore the shore and pick up a pretty shell!</div>';
  else{
    html+='<div class="notice">'+ownedCount()+' treasures in your bag · '+uniqueCount()+' different kinds discovered</div>';
    html+=owned.map(i=>'<div class="line-item"><div class="line-icon">'+iconFor(i)+'</div><div class="line-info"><b>'+i.name+' ×'+count(i.id)+'</b>'+
      '<small>'+i.rarity+' · '+onShelf(i.id)+' displayed · '+available(i.id)+' available</small></div>'+
      '<button data-action="place" data-id="'+i.id+'" '+(!available(i.id)||state.shelf.length>=18?'disabled':'')+'>Display</button></div>').join('');
  }
  panelShell('Backpack','your pocketful of treasures',html);
}
function exchange(){
  let html='<p class="lead">The little self-serve beach exchange. Leave your discoveries in the basket, collect sand dollars, and take home a new tool. No lines, no rush. ✿</p>';
  html+='<div class="notice">☀ You have <b>'+money(state.coins)+' sand dollars</b>. Displayed treasures are safe from selling.</div>';
  html+='<div class="set-header"><h3>Lovely upgrades</h3></div>';
  for(const u of UPGRADES){
    const owned=state[u.id];
    html+='<div class="line-item"><span class="line-icon">'+(u.id==='shovel'?'🪏':'📡')+'</span>'+
      '<div class="line-info"><b>'+u.name+'</b><small>'+u.detail+'</small></div>'+
      '<button data-action="buy" data-id="'+u.id+'" '+(owned||state.coins<u.cost?'disabled':'')+'>'+(owned?'Owned':'☀ '+u.cost)+'</button></div>';
  }
  html+='<div class="divider"></div><div class="set-header"><h3>Sell your finds</h3></div>';
  const canSell=CATALOG.filter(i=>available(i.id)>0);
  if(!canSell.length)html+='<div class="empty-state"><span>🐚</span>No treasures available to sell yet.<br/>Anything on a shelf will stay there safely!</div>';
  else html+=canSell.map(i=>'<div class="line-item"><div class="line-icon">'+iconFor(i)+'</div>'+
    '<div class="line-info"><b>'+i.name+' ×'+available(i.id)+'</b><small>'+i.rarity+' · '+i.set+'</small></div>'+
    '<button data-action="sell" data-id="'+i.id+'">+ ☀ '+i.value+'</button></div>').join('');
  panelShell('Beach Exchange','the little trading stand',html);
}
function shelfPicker(){
  const possible=CATALOG.filter(i=>available(i.id)>0);
  let html='<p class="lead">Choose something to put on your shelves. Once placed, you can drag it around and turn it to find the perfect spot.</p>';
  if(!possible.length)html+='<div class="empty-state"><span>🪞</span>Nothing left to display.<br/>Collect more treasures along the shore!</div>';
  else html+=possible.map(i=>'<div class="line-item"><div class="line-icon">'+iconFor(i)+'</div>'+
    '<div class="line-info"><b>'+i.name+'</b><small>'+available(i.id)+' available · '+i.set+'</small></div>'+
    '<button data-action="place" data-id="'+i.id+'">Place</button></div>').join('');
  if(state.shelf.length>=18)html='<div class="notice">All 18 spots are filled. Remove a treasure to make space.</div>';
  panelShell('Display a treasure','make it your own',html);
}
function help(){
  panelShell('How to play','a very little guide',
    '<p class="lead">There is no timer, no pressure, and no way to lose. Find treasures at your own pace, finish your journal pages, and decorate your cozy room.</p>'+
    '<div class="keys">'+
    '<kbd>W A S D</kbd><span>Walk along the beach</span>'+
    '<kbd>MOUSE</kbd><span>Look around (click the world to capture mouse)</span>'+
    '<kbd>E</kbd><span>Pick up a find, dig, or use the cottage / exchange</span>'+
    '<kbd>F</kbd><span>Scan the sand once you own a metal detector</span>'+
    '<kbd>B / J</kbd><span>Open backpack / collection journal</span>'+
    '<kbd>H</kbd><span>Visit your cottage shelves from anywhere and sleep until morning</span>'+
    '<kbd>ESC</kbd><span>Close menus or release mouse control</span>'+
    '<kbd>Q / R</kbd><span>Rotate a selected treasure on your shelves</span></div>'+
    '<p class="lead">The shovel reveals little digging spots. The detector highlights buried finds for ten seconds each time you scan. Sleep in your cottage to let the tide bring a fresh batch of treasures. Completed collections earn 75 sand dollars. Everything saves automatically in this browser.</p>');
}
function buy(id){
  const u=UPGRADES.find(i=>i.id===id);
  if(!u||state[id]||state.coins<u.cost)return;
  state.coins-=u.cost;state[id]=true;
  // Buried treasures for today's tide already exist; the new tool reveals them.
  save();refreshHUD();exchange();toast('✿ '+u.name+' unlocked!');
}
function sell(id){
  const item=ITEMS[id];if(!item||available(id)<1)return;
  state.bag[id]--;state.coins+=item.value;
  save();refreshHUD();exchange();toast('Sold '+item.name+' for ☀ '+item.value);
}
function syncShelf(){
  shelf.clearDisplay();for(const p of state.shelf)if(ITEMS[p.itemId])shelf.addDisplay(ITEMS[p.itemId],p);
  selectShelf(selectedUid);
}
function selectShelf(uid){
  selectedUid=uid;
  for(const m of shelf.displays.children)m.scale.setScalar(m.userData.placementUid===uid?1.11:.97);
  $('removeShelfButton').disabled=!state.shelf.some(p=>p.uid===uid);
}
function place(id){
  if(!ITEMS[id]||available(id)<1||state.shelf.length>=18)return;
  const slot=shelf.slotPositions[state.shelf.length];
  let uid=Date.now()*100+Math.floor(Math.random()*99);
  while(state.shelf.some(p=>p.uid===uid))uid++;
  state.shelf.push({uid,itemId:id,x:slot.x,y:slot.y,z:slot.z,rotation:0});
  save();syncShelf();
  if(mode==='shelf')shelfPicker();else backpack();
  toast(ITEMS[id].name+' added to your display ✿');
}
function removeSelected(){
  const i=state.shelf.findIndex(p=>p.uid===selectedUid);
  if(i<0)return;
  const name=ITEMS[state.shelf[i].itemId].name;
  state.shelf.splice(i,1);selectedUid=null;save();syncShelf();
  toast(name+' returned to your backpack');
}
function enterShelf(){
  closePanel();if(document.pointerLockElement)document.exitPointerLock();
  mode='shelf';document.body.classList.add('in-shelf');$('shelfControls').classList.remove('hidden');
  $('crosshair').classList.add('hidden');$('interaction').classList.remove('visible');
  syncShelf();refreshShelfUI();resize();
  toast('Welcome home! Make your shelves lovely ♡');
}
function leaveShelf(){
  closePanel();mode='beach';document.body.classList.remove('in-shelf');
  $('shelfControls').classList.add('hidden');$('crosshair').classList.remove('hidden');
  selectShelf(null);resize();toast('Back to the sunny shore ☼');
}
function sleepUntilMorning(){
  if(!started||mode!=='shelf'||activePanel||sleeping)return;
  sleeping=true;keys.clear();
  const overlay=$('sleepScreen');
  $('sleepMessage').textContent='The waves whisper goodnight...';
  $('sleepDay').textContent='Day '+state.day;
  overlay.classList.remove('hidden');
  requestAnimationFrame(()=>overlay.classList.add('active'));
  setTimeout(()=>{
    state.day=clampDay(state.day+1);
    newTide();
    beach.camera.position.set(0,1.7,2);
    beach.camera.rotation.set(0,0,0);
    scanUntil=0;
    leaveShelf();
    $('sleepMessage').textContent='The tide brought new treasures ✨';
    $('sleepDay').textContent='Day '+state.day;
    setTimeout(()=>{
      overlay.classList.remove('active');
      setTimeout(()=>{overlay.classList.add('hidden');sleeping=false;},650);
    },1150);
  },1100);
}
function refreshShelfUI(){
  const title=s=>s.charAt(0).toUpperCase()+s.slice(1);
  $('wallButton').textContent='🎨 Wall: '+title(state.wall);
  $('woodButton').textContent='🪵 Shelf: '+title(state.wood);
  $('lightButton').textContent='✨ Fairy lights: '+(state.lights?'On':'Off');
}
function cycleOption(key,values){
  const i=values.indexOf(state[key]);state[key]=values[(i+1)%values.length];
  if(key==='wall')shelf.setWall(SHOP_COLORS[state.wall]);
  else if(key==='wood')shelf.setWood(WOODS[state.wood]);
  else shelf.setLights(state.lights);
  save();refreshShelfUI();
}
function resize(){
  renderer.setSize(window.innerWidth,window.innerHeight);
  for(const cam of [beach.camera,shelf.camera]){cam.aspect=window.innerWidth/window.innerHeight;cam.updateProjectionMatrix();}
}
resize();window.addEventListener('resize',resize);
$('startButton').addEventListener('click',()=>{
  started=true;$('overlay').classList.add('hidden');refreshHUD();
  renderer.domElement.requestPointerLock?.();
  toast('The tide is lovely today. Go find something cute! 🐚');
});
$('sound').addEventListener('click',toggleSound);
$('bagButton').addEventListener('click',backpack);
$('journalButton').addEventListener('click',journal);
$('shelfButton').addEventListener('click',()=>mode==='shelf'?shelfPicker():enterShelf());
$('helpButton').addEventListener('click',help);
$('closePanel').addEventListener('click',closePanel);
$('panelBackdrop').addEventListener('click',closePanel);
$('beachButton').addEventListener('click',leaveShelf);
$('sleepButton').addEventListener('click',sleepUntilMorning);
$('addShelfButton').addEventListener('click',shelfPicker);
$('removeShelfButton').addEventListener('click',removeSelected);
$('wallButton').addEventListener('click',()=>cycleOption('wall',Object.keys(SHOP_COLORS)));
$('woodButton').addEventListener('click',()=>cycleOption('wood',Object.keys(WOODS)));
$('lightButton').addEventListener('click',()=>{
  state.lights=!state.lights;shelf.setLights(state.lights);save();refreshShelfUI();
});
$('panelContent').addEventListener('click',event=>{
  const b=event.target.closest('button[data-action]');if(!b)return;
  const id=b.dataset.id,action=b.dataset.action;
  if(action==='tab'){tab=id;journal();}
  if(action==='buy')buy(id);
  if(action==='sell')sell(id);
  if(action==='place')place(id);
});
renderer.domElement.addEventListener('click',()=>{
  if(started&&mode==='beach'&&!activePanel&&!document.pointerLockElement)
    renderer.domElement.requestPointerLock?.();
});
document.addEventListener('mousemove',e=>{
  if(mode!=='beach'||!started||activePanel||document.pointerLockElement!==renderer.domElement)return;
  beach.camera.rotation.y-=e.movementX*.00215;
  beach.camera.rotation.x=clamp(beach.camera.rotation.x-e.movementY*.00215,-1.24,1.24);
});
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  const key=e.key.toLowerCase();
  if(key==='escape'){if(activePanel)closePanel();else if(mode==='shelf')leaveShelf();return;}
  if(!started||e.repeat||sleeping)return;
  if(!activePanel){
    if(key==='b'){backpack();return;}if(key==='j'){journal();return;}
    if(key==='h'){mode==='shelf'?leaveShelf():enterShelf();return;}
    if(key==='?'||key==='/'){help();return;}
    if(mode==='beach'){
      if(key==='e'){interact();return;}
      if(key==='f'){scan();return;}
    }
    if(mode==='shelf'&&(key==='q'||key==='r')){
      const p=state.shelf.find(i=>i.uid===selectedUid);
      if(p){p.rotation+=(key==='r'?1:-1)*Math.PI/12;save();syncShelf();}
    }
  }
  keys.add(key);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
const findMeshUid=obj=>{while(obj){if(obj.userData?.placementUid!=null)return obj.userData.placementUid;obj=obj.parent;}return null;};
function pointed(e){
  const rect=renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(mouse,shelf.camera);
  const hits=raycaster.intersectObjects(shelf.displays.children,true);
  return hits.length?findMeshUid(hits[0].object):null;
}
renderer.domElement.addEventListener('pointerdown',e=>{
  if(mode!=='shelf'||activePanel)return;
  const uid=pointed(e);selectShelf(uid);
  if(uid!=null){dragging=true;dragX=e.clientX;dragY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);}
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!dragging||mode!=='shelf')return;
  const p=state.shelf.find(v=>v.uid===selectedUid);if(!p)return;
  p.x=clamp(p.x+(e.clientX-dragX)*.008,-2.28,2.28);
  p.z=clamp(p.z+(e.clientY-dragY)*.005,-2.94,-2.42);
  dragX=e.clientX;dragY=e.clientY;
  const object=shelf.displays.children.find(v=>v.userData.placementUid===p.uid);
  if(object)object.position.set(p.x,p.y,p.z);
});
function stopDrag(){if(dragging){dragging=false;save();}}
renderer.domElement.addEventListener('pointerup',stopDrag);
renderer.domElement.addEventListener('pointercancel',stopDrag);
function move(dt){
  if(mode!=='beach'||activePanel||sleeping||document.pointerLockElement!==renderer.domElement)return;
  let forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
  let side=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
  if(!forward&&!side)return;
  const speed=(keys.has('shift')?7:4.5)*dt/Math.hypot(forward,side);
  forward*=speed;side*=speed;
  const a=beach.camera.rotation.y;
  const p=beach.camera.position;
  const nx=clamp(p.x-Math.sin(a)*forward+Math.cos(a)*side,-28,28);
  const nz=clamp(p.z-Math.cos(a)*forward-Math.sin(a)*side,-22,31);
  if(nx>-16&&nx<-8.2&&nz>20&&nz<29){return;}
  p.x=nx;p.z=nz;
}
let soundOn=false,audioCtx,oceanSound=null;
function toggleSound(){
  soundOn=!soundOn;
  $('sound').textContent=soundOn?'♫':'♪';
  $('sound').title=soundOn?'Mute ocean sounds':'Enable ocean sounds';
  if(soundOn)startOcean();
  else if(oceanSound){oceanSound.gain.setTargetAtTime(0,audioCtx.currentTime,.3);}
}
function startOcean(){
  try{
    audioCtx ||=new(window.AudioContext||window.webkitAudioContext)();
    audioCtx.resume();
    if(oceanSound){oceanSound.gain.setTargetAtTime(.028,audioCtx.currentTime,.3);return;}
    const size=audioCtx.sampleRate*3,buffer=audioCtx.createBuffer(1,size,audioCtx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<size;i++)data[i]=Math.random()*2-1;
    const source=audioCtx.createBufferSource();source.buffer=buffer;source.loop=true;
    const lowpass=audioCtx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=380;
    const volume=audioCtx.createGain();volume.gain.value=.028;
    const lfo=audioCtx.createOscillator();lfo.frequency.value=.11;
    const depth=audioCtx.createGain();depth.gain.value=.013;lfo.connect(depth);depth.connect(volume.gain);
    source.connect(lowpass);lowpass.connect(volume);volume.connect(audioCtx.destination);
    source.start();lfo.start();oceanSound=volume;
  }catch{soundOn=false;}
}
function chime(hz,length){
  if(!audioCtx)return;
  const oscillator=audioCtx.createOscillator(),volume=audioCtx.createGain();
  oscillator.type='sine';oscillator.frequency.value=hz;
  volume.gain.setValueAtTime(.0001,audioCtx.currentTime);
  volume.gain.exponentialRampToValueAtTime(.035,audioCtx.currentTime+.02);
  volume.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+length);
  oscillator.connect(volume);volume.connect(audioCtx.destination);oscillator.start();oscillator.stop(audioCtx.currentTime+length);
}
refreshHUD();refreshShelfUI();syncShelf();
let lastPrompt='';
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.06),t=clock.elapsedTime;
  if(started)move(dt);
  const scanning=state.detector&&performance.now()<scanUntil;
  beach.update(t,scanning);
  if(started&&mode==='beach'&&!sleeping){
    near=nearTarget();
    const prompt=near?.name||'';
    if(prompt!==lastPrompt){setInteraction(near);lastPrompt=prompt;}
  }
  renderer.render(mode==='beach'?beach.scene:shelf.scene,mode==='beach'?beach.camera:shelf.camera);
}
animate();
