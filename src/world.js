import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createTreasure} from './treasures.js';

const V = (x,y,z) => new THREE.Vector3(x,y,z);
const box = (w,h,d,material,x=0,y=0,z=0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m;
};
const ball = (r,material,x=0,y=0,z=0,detail=16) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r,detail,12),material);
  m.position.set(x,y,z); m.castShadow=true; return m;
};
const mat = (color,roughness=.75,metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const curve = (points, radius, material, closed=false) =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>V(...p)),closed), Math.max(12,points.length*4), radius, 6, closed),material);

function sign(text,color='#735a55',background='#fff4e9',w=2.8,h=.66) {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=background;ctx.beginPath();ctx.roundRect(8,8,496,112,22);ctx.fill();
  ctx.fillStyle=color;ctx.font='bold 43px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,67,474);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.FrontSide}));
  // Signs are mounted on negative-Z faces; turn them toward approaching players, not away.
  face.rotation.y=Math.PI;
  return face;
}

function sandTexture() {
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#efd8b0';g.fillRect(0,0,256,256);
  for(let i=0;i<3600;i++){
    const x=Math.random()*256,y=Math.random()*256;
    g.fillStyle=i%3===0?'rgba(255,255,242,.20)':'rgba(166,122,89,.10)';
    g.fillRect(x,y,Math.random()*2+0.3,Math.random()*2+0.3);
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(11,11);
  t.colorSpace=THREE.SRGBColorSpace;return t;
}

function flower(x,z,color='#f5a3b7') {
  const g=new THREE.Group();
  const stem=mat('#8eaa75'),petal=mat(color),yellow=mat('#f4cd68');
  const stemMesh=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.42,6),stem);
  stemMesh.position.y=.23;g.add(stemMesh);
  for(let k=0;k<5;k++){
    const a=k*Math.PI*2/5;
    g.add(ball(.10,petal,Math.sin(a)*.12,.5+Math.cos(a)*.12,.02,9));
  }
  g.add(ball(.077,yellow,0,.5,.035));g.position.set(x,0,z);return g;
}
function grasses(x,z) {
  const g=new THREE.Group(),green=mat('#88ab80');
  for(let i=0;i<6;i++){
    const blade=new THREE.Mesh(new THREE.ConeGeometry(.045,.38+Math.random()*.35,4),green);
    const a=i*2.4;blade.position.set(Math.cos(a)*.15,.25,Math.sin(a)*.15);
    blade.rotation.z=(Math.random()-.5)*.38;g.add(blade);
  }
  g.position.set(x,0,z);return g;
}

function makeCottage(scene) {
  const house=new THREE.Group(),paint=mat('#f3e5d7'),roof=mat('#b98891'),trim=mat('#fffaf0'),wood=mat('#9b7661'),glass=mat('#a8d7e4',.21);
  house.position.set(-7.5,0,13);
  house.add(box(7,4.1,6,paint,0,2.05,0));
  const a=box(4.5,.25,6.8,roof,-1.88,4.68,0);a.rotation.z=Math.PI/4;house.add(a);
  const b=box(4.5,.25,6.8,roof,1.88,4.68,0);b.rotation.z=-Math.PI/4;house.add(b);
  house.add(box(1.5,2.85,.15,wood,0,1.44,-3.07));
  house.add(ball(.085,mat('#e4c67d',.25,.6),.48,1.46,-3.2));
  for(const x of [-2.25,2.25]){
    house.add(box(1.45,1.65,.12,trim,x,2.35,-3.12));
    house.add(box(1.17,1.35,.14,glass,x,2.35,-3.20));
    house.add(box(.10,1.35,.13,trim,x,2.35,-3.28));
    house.add(box(1.17,.10,.13,trim,x,2.35,-3.29));
    house.add(box(1.7,.19,.56,trim,x,1.47,-3.2));
    const planter=box(1.5,.24,.48,mat('#d2a892'),x,1.29,-3.45);house.add(planter);
    for(let j=0;j<5;j++)house.add(flower(x-.55+j*.25,-3.45,j%2?'#eab0d6':'#fff7e5'));
  }
  const label=sign("TRIN'S COTTAGE",'#8f666d','#fff1e9',3.25,.76);label.position.set(0,3.58,-3.16);house.add(label);
  for(let i=0;i<8;i++){
    const stone=new THREE.Mesh(new THREE.CylinderGeometry(.36,.45,.07,9),mat('#c1b7aa'));
    stone.position.set(Math.sin(i*.7)*.6,.04,-3.9-i*.75);house.add(stone);
  }
  scene.add(house);return V(-7.5,0,7.9);
}

function makeExchange(scene) {
  const s=new THREE.Group(),wood=mat('#ba8d73'),white=mat('#fff1e4'),accent=mat('#e7a8b0'),sea=mat('#9fcac7');
  s.position.set(7.5,0,12);
  s.add(box(5.3,.24,3.4,wood,0,1.48,0));
  for(const x of [-2.35,2.35])for(const z of [-1.35,1.35])s.add(box(.18,3.5,.18,wood,x,1.76,z));
  s.add(box(5.6,.27,3.8,white,0,3.48,0));
  for(let i=0;i<7;i++)s.add(box(.8,.42,.10,i%2?white:accent,-2.4+i*.8,3.18,-1.87));
  s.add(box(4.45,.20,.96,sea,0,1.68,-1.12));
  s.add(box(4.9,1.45,.28,wood,0,.74,1.36));
  const label=sign('BEACH EXCHANGE','#765f58','#fff9e8',3.95,.73);label.position.set(0,2.67,-1.61);s.add(label);
  const basket=box(1.4,.55,1.1,mat('#bb9a73'),-1.55,1.98,-.7);s.add(basket);
  for(let i=0;i<5;i++)s.add(ball(.17,mat(i%2?'#ffe3b3':'#f4b5ba'),-2.05+i*.23,2.31,-.67,10));
  const register=box(.9,.28,.65,white,1.50,1.96,-.65);s.add(register);
  const price=sign('SELL  •  SHOP','#8f7b68','#fff3e9',2.1,.43);price.position.set(1.2,1.04,-1.45);s.add(price);
  scene.add(s);return V(7.5,0,8.2);
}

// One GPU model per item, cloned for beach finds and shelf placements.
const treasureTemplates=new Map();
function treasure(item,scale=1){
  if(!treasureTemplates.has(item.id))treasureTemplates.set(item.id,createTreasure(item,1));
  const model=treasureTemplates.get(item.id).clone(true);
  model.scale.setScalar(scale);
  model.userData.itemId=item.id;
  return model;
}
function rounded(w,h,d,r,material,x=0,y=0,z=0){
  const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,4,Math.min(r,w*.48,h*.48,d*.48)),material);
  m.position.set(x,y,z);
  m.castShadow=true;m.receiveShadow=true;
  return m;
}
export function createBeachScene() {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#a7dfe5');scene.fog=new THREE.FogExp2('#a7dfe5',.0075);
  const camera=new THREE.PerspectiveCamera(72,1,.1,220);camera.position.set(0,1.7,2);camera.rotation.order='YXZ';
  scene.add(new THREE.HemisphereLight('#ffeed4','#81bdb2',2.05));
  const sunlight=new THREE.DirectionalLight('#fff2cc',2.55);sunlight.position.set(-25,35,-35);
  sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-40;sunlight.shadow.camera.right=40;sunlight.shadow.camera.top=45;sunlight.shadow.camera.bottom=-40;scene.add(sunlight);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(39,38),new THREE.MeshStandardMaterial({map:sandTexture(),roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.set(0,-.08,3);ground.receiveShadow=true;scene.add(ground);
  const wet=new THREE.Mesh(new THREE.PlaneGeometry(39,2.4),new THREE.MeshStandardMaterial({color:'#d7d4ba',roughness:.55,transparent:true,opacity:.65}));
  wet.rotation.x=-Math.PI/2;wet.position.set(0,-.05,-14.9);scene.add(wet);
  const oceanGeo=new THREE.PlaneGeometry(95,120,64,35);oceanGeo.rotateX(-Math.PI/2);
  const base=new Float32Array(oceanGeo.attributes.position.array);
  const water=new THREE.Mesh(oceanGeo,new THREE.MeshPhysicalMaterial({color:'#69c8cc',roughness:.27,metalness:.12,transparent:true,opacity:.94,clearcoat:.7,side:THREE.DoubleSide}));
  water.position.set(0,-.2,-76);scene.add(water);
  const foam=[];
  for(let i=0;i<7;i++){
    const f=new THREE.Mesh(new THREE.PlaneGeometry(39,.15+i*.034),new THREE.MeshBasicMaterial({color:'#fbffea',transparent:true,opacity:.55,side:THREE.DoubleSide}));
    f.rotation.x=-Math.PI/2;f.position.set(0,.015,-16-i*.46);scene.add(f);foam.push(f);
  }
  const sun=ball(7,new THREE.MeshBasicMaterial({color:'#fff0cf'}),-27,27,-110,32);scene.add(sun);
  // A compact, sheltered cove replaces the original featureless open sand plain.
  // Curved rocky edges and dune grass make the playable area feel intentionally small.
  const rockMats=[mat('#c0aca0'),mat('#d2bca8'),mat('#aeb5a8')];
  const dune=mat('#e9d2aa'),grass=mat('#9aaf86');
  for(const side of [-1,1]){
    for(let i=0;i<25;i++){
      const z=-16+i*1.54+(Math.random()-.5)*.7;
      const x=side*(16+Math.sin(i*.47)*1.3+Math.random()*.5);
      const radius=1.45+Math.random()*1.4;
      const stone=ball(radius,rockMats[i%3],x,radius*.36,z,9);
      stone.scale.set(1.15,.6,1.0+Math.random()*.4);
      stone.rotation.y=Math.random()*3;scene.add(stone);
      if(i%2===0)scene.add(grasses(x-side*1.5,z));
    }
  }
  for(let i=0;i<23;i++){
    const x=-18+i*1.65,z=20+Math.sin(i*.5)*1.4;
    const hill=ball(2.2+Math.random()*1.4,i%3===0?rockMats[1]:dune,x,.7,z,11);
    hill.scale.set(1,.65,1.25);scene.add(hill);
  }
  for(let i=0;i<45;i++){
    const x=(Math.random()-.5)*29,z=Math.random()*30-12;
    if((x>-11.5&&x<-3.5&&z>7)||(x>4&&x<11&&z>7))continue;
    if(i%5===0)scene.add(flower(x,z,['#ffc3c5','#fff4e5','#cdbce5'][i%3]));
    else scene.add(grasses(x,z));
  }
  for(let i=0;i<34;i++){
    const x=(Math.random()-.5)*29,z=Math.random()*29-13;
    const stone=ball(.06+Math.random()*.15,rockMats[i%3],x,.05,z,8);
    stone.scale.set(1,.45,1.2);scene.add(stone);
  }
  for(let i=0;i<7;i++){
    const x=(Math.random()-.5)*26,z=Math.random()*27-12;
    const drift=box(.8+Math.random()*.8,.11,.16,mat('#b1a394'),x,.09,z);
    drift.rotation.y=Math.random()*Math.PI;scene.add(drift);
  }
  const cottage=makeCottage(scene),exchange=makeExchange(scene);
  const finds=[];
  function spawn(item,method,x,z,uid){
    const g=new THREE.Group();g.position.set(x,0,z);
    g.userData.find={item,method,uid};
    if(method==='surface'){
      const object=treasure(item,.88);object.position.y=.04;object.rotation.y=Math.random()*6.28;
      g.add(object);
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(.39,24),new THREE.MeshBasicMaterial({color:'#a99079',transparent:true,opacity:.11}));
      shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;g.add(shadow);
    }else{
      const mound=ball(.49,mat('#e9cda5'),0,.02,0,12);mound.scale.set(1,.21,.78);g.add(mound);
      if(method==='shovel'){
        const nub=treasure(item,.32);nub.position.set(0,.055,0);g.add(nub);
      }else{
        const ring=new THREE.Mesh(new THREE.RingGeometry(.30,.36,28),new THREE.MeshBasicMaterial({color:'#ffe29a',transparent:true,opacity:.85,side:THREE.DoubleSide}));
        ring.rotation.x=-Math.PI/2;ring.position.y=.07;g.add(ring);g.userData.signal=ring;
        g.visible=false;
      }
    }
    scene.add(g);finds.push(g);return g;
  }
  function remove(g){scene.remove(g);const i=finds.indexOf(g);if(i!==-1)finds.splice(i,1);}
  function clearFinds(){for(const g of [...finds])remove(g);}
  function update(t,scan){
    const pos=oceanGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=base[i*3],z=base[i*3+2];
      pos.setY(i,Math.sin(z*.22+t*1.4+x*.07)*.19+Math.sin(x*.12-t*.8)*.09);
    }
    pos.needsUpdate=true;
    foam.forEach((m,i)=>{
      m.material.opacity=.36+Math.sin(t*1.6+i*.5)*.16;
      m.position.z=-16-i*.46+Math.sin(t*.7+i)*.18;
    });
    for(const g of finds){
      if(g.userData.find.method==='detector')g.visible=scan;
      if(g.userData.signal)g.userData.signal.material.opacity=.5+.35*Math.sin(t*4+g.position.x);
      else if(g.children[0]&&g.userData.find.method==='surface')
        g.children[0].rotation.y+=.002;
    }
  }
  return {scene,camera,finds,spawn,remove,clearFinds,update,stations:{cottage,exchange}};
}

export function createShelfScene() {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#f9e9e1');
  const camera=new THREE.PerspectiveCamera(51,1,.1,100);
  camera.position.set(0,2.45,7.3);camera.lookAt(0,2.2,-2.48);

  scene.add(new THREE.HemisphereLight('#fff6ea','#c4b1ab',1.8));
  const sun=new THREE.DirectionalLight('#fff0db',2.2);
  sun.position.set(-3.8,7,5);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-8;sun.shadow.camera.right=8;
  sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;
  sun.shadow.bias=-.0003;scene.add(sun);
  const fill=new THREE.PointLight('#ffd8bd',16,13,2);
  fill.position.set(2.5,4.3,3.7);scene.add(fill);
  const wallMat=mat('#fff0df'),floorMat=mat('#e6c8ad'),woodMat=mat('#cda579');
  const trim=mat('#fbf0e3'),molding=mat('#efdbc8'),bronze=mat('#c99e72',.42,.16);
  const back=box(11,7,.22,wallMat,0,3.25,-3.85);back.receiveShadow=true;scene.add(back);
  const side=box(.22,7,11,wallMat,-5.15,3.25,0);side.receiveShadow=true;scene.add(side);
  const floor=box(11,.3,11,floorMat,0,-.08,0);scene.add(floor);
  // Cottage wainscoting and trim give structure without overwhelming the displayed finds.
  scene.add(rounded(10.8,.15,.2,.05,trim,0,.67,-3.7));
  scene.add(rounded(10.8,.13,.2,.05,trim,0,.16,-3.7));
  for(let x=-4.6;x<=4.6;x+=.85){
    scene.add(rounded(.055,.4,.055,.02,molding,x,.40,-3.67));
  }
  scene.add(rounded(10.6,.11,.22,.045,trim,0,4.8,-3.69));
  const rug=new THREE.Mesh(new THREE.CircleGeometry(2,48),mat('#e8b9c6'));
  rug.rotation.x=-Math.PI/2;rug.scale.set(1.65,1.02,1);
  rug.position.set(0,.083,2.25);scene.add(rug);
  const innerRug=new THREE.Mesh(new THREE.CircleGeometry(1.71,48),mat('#f2d8d8'));
  innerRug.rotation.x=-Math.PI/2;innerRug.scale.set(1.60,1,1);
  innerRug.position.set(0,.085,2.25);scene.add(innerRug);

  // A rounded, upholstered daybed anchors the side of the display room.
  const bed=new THREE.Group();bed.position.set(3.83,0,.3);scene.add(bed);
  bed.add(rounded(1.95,.31,2.55,.13,mat('#af8476'),0,.37,0));
  bed.add(rounded(1.81,.26,2.40,.13,mat('#fff2e7'),0,.56,0));
  bed.add(rounded(1.81,.19,1.36,.09,mat('#deb0bd'),0,.75,.48));
  bed.add(rounded(1.92,.87,.20,.08,mat('#d4a9a2'),0,.76,-1.19));
  for(const x of [-.43,.43]){
    const pillow=rounded(.71,.19,.61,.09,mat('#fffaf0'),x,.77,-.74);
    pillow.rotation.z=x*.13;bed.add(pillow);
  }
  for(const x of [-.83,.83])for(const z of [-1.05,1.05])bed.add(rounded(.12,.40,.14,.045,mat('#b28876'),x,.16,z));
  const displayFrame=new THREE.Group();scene.add(displayFrame);

  // Curved edges, plinth, backboard, arched top and satin inset colors.
  const cream=mat('#fff6e9'),edge=mat('#f1dbc8');
  displayFrame.add(rounded(5.7,3.67,.31,.13,cream,0,2.19,-3.27));
  displayFrame.add(rounded(5.45,3.39,.055,.1,mat('#f6e8dc'),0,2.18,-3.08));
  displayFrame.add(rounded(5.83,.27,1.10,.09,woodMat,0,.86,-2.75));
  for(const x of [-2.74,2.74]){
    displayFrame.add(rounded(.19,3.71,.89,.075,woodMat,x,2.35,-2.74));
    displayFrame.add(rounded(.29,.16,1.01,.05,cream,x,4.21,-2.74));
    displayFrame.add(rounded(.29,.20,1.02,.055,woodMat,x,.58,-2.74));
  }
  const heights=[1.18,2.13,3.07];
  for(const y of heights){
    const shelf=rounded(5.58,.17,1.12,.068,woodMat,0,y-.095,-2.70);
    displayFrame.add(shelf);
    displayFrame.add(rounded(5.52,.052,.085,.026,edge,0,y-.056,-2.115));
    for(const x of [-2.44,2.44]){
      const bracket=rounded(.16,.18,.45,.055,edge,x,y-.22,-2.56);
      displayFrame.add(bracket);
    }
  }
  const crown=rounded(5.9,.26,1.1,.09,woodMat,0,3.9,-2.73);
  displayFrame.add(crown);
  displayFrame.add(rounded(5.65,.095,.10,.032,edge,0,3.95,-2.12));
  for(const x of [-2.65,2.65]){
    displayFrame.add(ball(.08,bronze,x,3.97,-2.04));
  }
  // Delicate fairy lights suspend clear of every shelf surface (top y < 4.05).
  // Both wire and bulbs are in front of the wooden crown, never inside it.
  const garland=[],wirePoints=[],bulbMat=new THREE.MeshStandardMaterial({
    color:'#fff4cf',emissive:'#ffd89b',emissiveIntensity:1.6,roughness:.22
  });
  const glowMat=new THREE.SpriteMaterial({color:'#fff4c3',transparent:true,opacity:.34,depthWrite:false});
  for(let i=0;i<=16;i++){
    const t=i/16,x=-2.53+t*5.06,y=4.20-.075*Math.sin(t*Math.PI*3);
    const z=-2.01;
    wirePoints.push([x,y,z]);
    if(i%2===0){
      const bulb=new THREE.Group();bulb.position.set(x,y-.058,z);displayFrame.add(bulb);
      bulb.add(ball(.053,bulbMat,0,0,0));
      const glow=new THREE.Sprite(glowMat);glow.scale.set(.28,.28,1);bulb.add(glow);
      garland.push(bulb);
    }
  }
  curve(displayFrame,wirePoints,.011,mat('#a08a7b'));
  // Whimsical wall frames, foliage, and tiny seaside props.
  const flowerFrame=rounded(1.2,1.23,.12,.075,mat('#cfaa91'),-3.89,3.06,-3.56);
  scene.add(flowerFrame);
  scene.add(rounded(1,.99,.045,.045,mat('#eef0df'),-3.89,3.06,-3.48));
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const petal=ball(.14,mat('#eab4be'),-3.89+Math.sin(a)*.19,3.06+Math.cos(a)*.19,-3.43);petal.scale.set(1,.95,.4);scene.add(petal);
  }
  const center=ball(.075,mat('#e6c676'),-3.89,3.06,-3.39);center.scale.z=.55;scene.add(center);
  scene.add(rounded(1.08,1.3,.11,.07,mat('#d9b89e'),3.9,2.88,-3.59));
  scene.add(rounded(.87,1.10,.06,.05,mat('#d0e7df'),3.9,2.88,-3.48));
  const wallSun=ball(.28,mat('#f0d5a9'),3.9,3.06,-3.43);wallSun.scale.z=.25;scene.add(wallSun);
  const pot=rounded(.55,.55,.5,.13,mat('#e7a7a9'),3.9,.43,-2.70);scene.add(pot);
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;
    const leaves=[[3.9,.72,-2.7],[3.9+Math.cos(a)*.13,1.1,-2.7+Math.sin(a)*.13],
      [3.9+Math.cos(a)*.4,1.39,-2.7+Math.sin(a)*.24]];
    curve(scene,leaves,.028,mat('#83a78c'));
    const l=ball(.13,mat('#9bbb9a'),leaves[2][0],leaves[2][1],leaves[2][2]);l.scale.set(1,.42,.77);
    scene.add(l);
  }
  scene.add(rounded(1.1,.46,.7,.12,mat('#b99b7f'),-3.91,.39,-2.78));
  for(let i=0;i<3;i++){
    const p=rounded(.12,.31,.13,.045,mat('#f9e8d9'),-4.23+i*.33,.79,-2.67);
    p.rotation.z=.08*(i-1);scene.add(p);
  }

  // The shelf remains interactive; all original saved coordinates still fit.
  const displays=new THREE.Group();scene.add(displays);
  const slotPositions=[];
  for(let row=0;row<3;row++)for(let col=0;col<6;col++)
    slotPositions.push({x:-2.1+col*.84,y:heights[row],z:-2.55,row});
  function setWall(hex){wallMat.color.set(hex);scene.background=new THREE.Color(hex).lerp(new THREE.Color('#ffffff'),.11);}
  function setWood(hex){woodMat.color.set(hex);}
  function setLights(on){for(const b of garland)b.visible=on;}
  function addDisplay(item,placement){
    const model=treasure(item,.97);model.position.set(placement.x,placement.y,placement.z);
    model.rotation.y=placement.rotation||0;model.userData.placementUid=placement.uid;
    model.traverse(m=>{m.userData.placementUid=placement.uid;});displays.add(model);
    return model;
  }
  function clearDisplay(){displays.clear();}
  return {scene,camera,displays,slotPositions,addDisplay,clearDisplay,setWall,setWood,setLights,heights};
}
