import * as THREE from 'three';

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

export function createTreasure(item,scale=1) {
  const g=new THREE.Group(),color=mat(item.color,.38,item.type==='ring'||item.type==='key'||item.type==='coin'?.42:0);
  const ivory=mat('#ffedda'),gold=mat('#d7af66',.28,.58);
  if(item.type==='scallop'||item.type==='shell'){
    const shell=ball(.37,color,0,.24,0,24);shell.scale.set(1.08,.43,.84);g.add(shell);
    for(let i=-5;i<=5;i++){
      const x=i*.068;
      g.add(curve([[x*.15,.35,-.23],[x*.6,.44,-.08],[x,.45,0.18],[x*1.15,.32,.30]],.011,ivory));
    }
    const bottom=box(.54,.06,.20,ivory,0,.12,.20);bottom.rotation.z=.02;g.add(bottom);
  } else if(item.type==='conch'||item.type==='fossil'){
    g.add(ball(.28,color,-.07,.26,0));
    for(let i=0;i<5;i++){
      const t=new THREE.Mesh(new THREE.TorusGeometry(.055+i*.046,.017,6,48),ivory);
      t.position.set(-.1,.36,.28);g.add(t);
    }
    const spire=new THREE.Mesh(new THREE.ConeGeometry(.17,.62,12),color);
    spire.position.set(.22,.24,.03);spire.rotation.z=Math.PI/2.7;g.add(spire);
  } else if(item.type==='glass'){
    const m=new THREE.MeshPhysicalMaterial({color:item.color,roughness:.24,metalness:0,transparent:true,opacity:.88,transmission:.14,thickness:.75,clearcoat:1});
    const gem=new THREE.Mesh(new THREE.DodecahedronGeometry(.3,1),m);
    gem.position.y=.31;gem.scale.set(.95,.55,.83);gem.rotation.y=.4;gem.castShadow=true;g.add(gem);
    g.add(ball(.09,ivory,-.05,.48,.05,10));
  } else if(item.type==='bracelet'||item.type==='ring'){
    const m=item.type==='ring'?gold:color;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.3,item.type==='ring'?.07:.045,10,30),m);
    ring.rotation.x=-Math.PI/2;ring.position.y=.22;g.add(ring);
    if(item.type==='bracelet')for(let i=0;i<12;i++){
      const a=i*Math.PI*2/12;
      g.add(ball(.068,i%3===0?ivory:color,Math.cos(a)*.3,.27,Math.sin(a)*.3,10));
    }else g.add(ball(.13,mat('#e7f2e9',.14),0,.32,-.3,12));
  } else if(item.type==='coin'){
    const disk=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.07,32),color);
    disk.rotation.x=Math.PI/2;disk.position.y=.29;g.add(disk);
    const inset=new THREE.Mesh(new THREE.TorusGeometry(.23,.018,6,32),gold);
    inset.position.set(0,.29,.042);g.add(inset);
    g.add(ball(.084,gold,0,.29,.05,12));
  } else if(item.type==='key'){
    const loop=new THREE.Mesh(new THREE.TorusGeometry(.15,.045,8,20),gold);
    loop.position.set(-.17,.37,0);g.add(loop);
    const shaft=box(.47,.07,.07,gold,.15,.37,0);g.add(shaft);
    g.add(box(.07,.17,.08,gold,.3,.28,0));g.add(box(.07,.13,.08,gold,.48,.30,0));
  } else if(item.type==='starfish'||item.type==='charm'){
    const arms= item.type==='starfish'?5:5;
    for(let i=0;i<arms;i++){
      const a=i*Math.PI*2/arms;
      const cone=new THREE.Mesh(new THREE.ConeGeometry(item.type==='starfish'?.13:.12,.40,8),color);
      cone.position.set(Math.sin(a)*.18,.22,Math.cos(a)*.18);
      cone.rotation.x=Math.PI/2-a;cone.rotation.z=Math.sin(a)*.4;
      g.add(cone);
    }
    g.add(ball(.18,color,0,.24,0));
    if(item.type==='charm')g.add(new THREE.Mesh(new THREE.TorusGeometry(.08,.026,8,14),gold));
  } else if(item.type==='pearl'){
    const oyster=ball(.38,color,0,.18,0);oyster.scale.set(1,.23,.8);g.add(oyster);
    const pearl=ball(.17,new THREE.MeshPhysicalMaterial({color:'#fff0e6',roughness:.1,clearcoat:1,metalness:.03}),0,.35,0,24);g.add(pearl);
  } else if(item.type==='tooth'){
    const tooth=new THREE.Mesh(new THREE.ConeGeometry(.23,.64,3),color);
    tooth.rotation.z=Math.PI;tooth.position.y=.36;g.add(tooth);
  } else if(item.type==='bottle'){
    const bottle=ball(.22,new THREE.MeshPhysicalMaterial({color:'#a8dcd5',transparent:true,opacity:.6,roughness:.15,transmission:.3,thickness:.7}),0,.29,0);
    bottle.scale.set(.75,1.45,.75);g.add(bottle);
    g.add(box(.12,.17,.12,ivory,0,.56,0));
    g.add(box(.17,.10,.17,mat('#bca17c'),0,.7,0));
  }
  g.scale.setScalar(scale);g.userData.itemId=item.id;
  return g;
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
      const object=createTreasure(item,.88);object.position.y=.04;object.rotation.y=Math.random()*6.28;
      g.add(object);
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(.39,24),new THREE.MeshBasicMaterial({color:'#a99079',transparent:true,opacity:.11}));
      shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;g.add(shadow);
    }else{
      const mound=ball(.49,mat('#e9cda5'),0,.02,0,12);mound.scale.set(1,.21,.78);g.add(mound);
      if(method==='shovel'){
        const nub=createTreasure(item,.32);nub.position.set(0,.055,0);g.add(nub);
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
  const camera=new THREE.PerspectiveCamera(53,1,.1,100);camera.position.set(0,2.35,7.1);camera.lookAt(0,2.0,-2.35);
  scene.add(new THREE.HemisphereLight('#fff5eb','#b5a9ab',2.15));
  const lamp=new THREE.DirectionalLight('#ffe8bb',2.1);lamp.position.set(-4,6,5);lamp.castShadow=true;lamp.shadow.mapSize.set(2048,2048);lamp.shadow.camera.left=-7;lamp.shadow.camera.right=7;lamp.shadow.camera.top=7;lamp.shadow.camera.bottom=-7;scene.add(lamp);
  const wallMat=mat('#fff0df'),floorMat=mat('#e0bfa0'),woodMat=mat('#cda579');
  const back=box(11,7,.22,wallMat,0,3.25,-3.85);back.receiveShadow=true;scene.add(back);
  scene.add(box(11,.3,11,floorMat,0,-.08,0));
  const side=box(.22,7,11,wallMat,-5.15,3.25,0);scene.add(side);
  for(let i=0;i<16;i++){
    const stripe=box(.014,6.5,.016,mat('#ffffff'),-5+i*.67,3.2,-3.71);
    stripe.material.transparent=true;stripe.material.opacity=.17;scene.add(stripe);
  }
  scene.add(box(11,.19,.3,mat('#faf5ee'),0,.19,-3.6));
  const rug=new THREE.Mesh(new THREE.CircleGeometry(2,48),mat('#f1cbd1'));rug.rotation.x=-Math.PI/2;rug.scale.set(1.6,.85,1);rug.position.set(0,.085,2.4);scene.add(rug);
  // A small soft bed gives the cottage a place to end the day.
  const bed=new THREE.Group();bed.position.set(3.8,0,.5);
  bed.add(box(1.8,.24,2.4,mat('#b98f82'),0,.33,0));
  bed.add(box(1.68,.21,2.26,mat('#faf1e5'),0,.52,0));
  bed.add(box(1.73,.12,1.33,mat('#e5aeb7'),0,.68,.42));
  bed.add(box(1.9,.86,.17,mat('#cba494'),0,.72,-1.15));
  for(const x of [-.44,.44])bed.add(box(.68,.17,.54,mat('#fff8ef'),x,.69,-.69));
  for(const x of [-.76,.76])for(const z of [-1,1])bed.add(box(.12,.4,.13,mat('#b98f82'),x,.16,z));
  scene.add(bed);
  const group=new THREE.Group();scene.add(group);
  const upright=mat('#faf0dc');for(const x of [-2.5,2.5])group.add(box(.18,3.7,.65,upright,x,2.25,-2.7));
  const heights=[1.18,2.13,3.07];
  const planks=[];
  for(const y of heights){const m=box(5.4,.17,.9,woodMat,0,y-.09,-2.72);group.add(m);planks.push(m);}
  group.add(box(5.6,.22,.95,woodMat,0,3.7,-2.73));
  group.add(box(5.32,3.45,.16,mat('#fcf1e4'),0,2.0,-3.27));
  // Back panels are behind the objects and slightly ahead of the room wall.
  const pictureFrame=box(1.2,1.2,.1,mat('#cfaa7c'),-3.85,3.05,-3.65);scene.add(pictureFrame);
  const picture=box(.98,.98,.02,mat('#e3eef0'),-3.85,3.05,-3.58);scene.add(picture);
  const flowerArt=ball(.24,mat('#f5adad'),-3.85,3.02,-3.55);flowerArt.scale.z=.15;scene.add(flowerArt);
  const secondFrame=box(1.05,1.25,.10,mat('#ceb29b'),3.75,2.85,-3.64);scene.add(secondFrame);
  secondFrame.add(box(.85,1.06,.06,mat('#c0dbcf'),0,0,.07));
  const pot=box(.5,.55,.48,mat('#e9b2aa'),3.85,.45,-2.7);scene.add(pot);
  for(let i=0;i<6;i++)scene.add(curve([[3.86,.72,-2.7],[3.73+i*.042,1.12,-2.7],[3.55+i*.12,1.42,-2.65]],.03,mat('#88a98c')));
  const basket=box(1.06,.5,.7,mat('#ba9474'),-3.9,.4,-2.8);scene.add(basket);
  const garland=[];const lightMat=new THREE.MeshBasicMaterial({color:'#ffe2a0'});
  for(let i=0;i<13;i++){
    const x=-2.55+i*.42;
    const y=3.89-.28*Math.sin(i/12*Math.PI);
    const bead=ball(.075,lightMat,x,y,-2.37);group.add(bead);garland.push(bead);
  }
  group.add(curve(Array.from({length:13},(_,i)=>[-2.55+i*.42,3.89-.28*Math.sin(i/12*Math.PI),-2.39]),.014,mat('#a7ad82')));
  const displays=new THREE.Group();scene.add(displays);
  const slotPositions=[];
  for(let row=0;row<3;row++)for(let col=0;col<6;col++)
    slotPositions.push({x:-2.1+col*.84,y:heights[row],z:-2.55,row});
  function setWall(hex){wallMat.color.set(hex);scene.background=new THREE.Color(hex).lerp(new THREE.Color('#ffffff'),.11);}
  function setWood(hex){woodMat.color.set(hex);}
  function setLights(on){for(const light of garland)light.visible=on;}
  function addDisplay(item,placement){
    const model=createTreasure(item,.97);model.position.set(placement.x,placement.y,placement.z);
    model.rotation.y=placement.rotation||0;model.userData.placementUid=placement.uid;
    model.traverse(m=>{m.userData.placementUid=placement.uid;});displays.add(model);
    return model;
  }
  function clearDisplay(){displays.clear();}
  return {scene,camera,displays,slotPositions,addDisplay,clearDisplay,setWall,setWood,setLights,heights};
}
