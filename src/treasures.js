import * as THREE from 'three';

// Hand-built, softly sculpted 3D keepsakes. No external models or downloads.
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const shade=(color,roughness=.48,metalness=0,extra={})=>new THREE.MeshPhysicalMaterial({
  color,roughness,metalness,clearcoat:.3,clearcoatRoughness:.26,...extra
});
const ivory=shade('#fff2e3',.4), pink=shade('#ffe1dc',.42);
const gold=shade('#eac477',.27,.67),silver=shade('#cad5dc',.24,.73);
const add=(group,geometry,material,x=0,y=0,z=0)=>{
  const m=new THREE.Mesh(geometry,material);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
};
const sphere=(g,r,material,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{
  const o=add(g,new THREE.SphereGeometry(r,24,16),material,x,y,z);
  o.scale.set(sx,sy,sz);return o;
};
const tube=(g,points,radius,material,closed=false)=>{
  const path=new THREE.CatmullRomCurve3(points.map(p=>v(...p)),closed,'centripetal');
  return add(g,new THREE.TubeGeometry(path,Math.max(24,points.length*6),radius,8,closed),material);
};
function rim(g,points,radius,material,closed=false){return tube(g,points,radius,material,closed);}
function surface(g,rows,cols,point,material){
  const vertices=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const p=point(j/rows,i/cols);vertices.push(p[0],p[1],p[2]);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const a=j*(cols+1)+i,b=a+cols+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  return add(g,geo,material);
}
function heartShape(size=.23) {
  const s=new THREE.Shape();
  s.moveTo(0,-size*.88);
  s.bezierCurveTo(-size*.29,-size*.54,-size*.96,-size*.24,-size*.96,size*.31);
  s.bezierCurveTo(-size*.96,size*.97,-size*.18,size*1.13,0,size*.61);
  s.bezierCurveTo(size*.18,size*1.13,size*.96,size*.97,size*.96,size*.31);
  s.bezierCurveTo(size*.96,-size*.24,size*.29,-size*.54,0,-size*.88);
  return s;
}
function starShape(n=5,outer=.32,inner=.13){
  const s=new THREE.Shape();
  for(let i=0;i<n*2;i++){
    const a=-Math.PI/2+i*Math.PI/n,r=i%2?inner:outer;
    if(i===0)s.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    else s.lineTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  s.closePath();return s;
}
function pendant(g,shape,material,x=0,y=.36,z=.06,depth=.065){
  const geo=new THREE.ExtrudeGeometry(shape,{
    steps:1,depth,bevelEnabled:true,bevelThickness:.03,bevelSize:.025,bevelSegments:3,curveSegments:16
  });
  const m=add(g,geo,material,x,y,z);m.rotation.x=-.22;return m;
}
function scallop(g,item,half=.43){
  const main=shade(item.color,.46,0,{clearcoat:.55,side:THREE.DoubleSide});
  const under=shade(new THREE.Color(item.color).lerp(new THREE.Color('#fff5e9'),.42),.65,0,{side:THREE.DoubleSide});
  const point=(t,u,lower=false)=>{
    const a=(u-.5)*2.36;
    const r=.035+half*t*(1+.028*Math.cos(a*13));
    const x=Math.sin(a)*r;
    const z=-.16+Math.cos(a)*r*.76;
    const crest=.19+.10*Math.sin(Math.PI*t)+.06*Math.sin(Math.PI*u*12)*Math.pow(t,1.3);
    return [x,lower?crest-.095:crest,z];
  };
  surface(g,18,60,(t,u)=>point(t,u),main);
  surface(g,18,60,(t,u)=>point(t,u,true),under);
  const edge=[],hinge=[];
  for(let i=0;i<=40;i++){
    const u=i/40;edge.push(point(1,u));hinge.push(point(.01,u));
  }
  rim(g,edge,.021,shade('#fff4e7',.35),false);
  for(let i=0;i<13;i++){
    const u=.05+i/12*.9,trace=[];
    for(let j=0;j<=9;j++){
      const p=point(.12+j*.097,u);
      trace.push([p[0],p[1]+.013,p[2]]);
    }
    tube(g,trace,.008,i%3===0?ivory:shade(new THREE.Color(item.color).lerp(new THREE.Color('#fff5e7'),.35),.42));
  }
  sphere(g,.115,main,0,.18,-.17,1,.43,.7);
}
function sandDollar(g,item){
  const base=shade(item.color,.67,0,{clearcoat:.15});
  sphere(g,.38,base,0,.205,0,1,.19,.96);
  const flower=shade('#e2d0b6',.8);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const petal=sphere(g,.115,flower,Math.sin(a)*.145,.278,Math.cos(a)*.145,.53,.07,1.2);
    petal.rotation.y=a;
  }
  sphere(g,.038,flower,0,.28,0,1,.15,1);
  for(let i=0;i<29;i++){
    const a=i*Math.PI*2/29;
    sphere(g,.013,ivory,Math.cos(a)*.31,.266,Math.sin(a)*.30,1,.35,1);
  }
}
function moonShell(g,item){
  scallop(g,item,.42);
  const line=[];
  for(let i=0;i<=75;i++){
    const t=i/75,a=t*Math.PI*5.4,r=.015+t*.16;
    line.push([Math.cos(a)*r,.3+Math.sin(a)*.006,.07+Math.sin(a)*r*.8]);
  }
  tube(g,line,.017,ivory);
}
function conch(g,item){
  const base=shade(item.color,.38,0,{clearcoat:.65});
  const cream=shade('#fff1d9',.42);
  // Sweeping taper with a genuine spiral rather than stacked rings and a cone.
  const segments=115,sides=12,pts=[],idx=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,a=t*Math.PI*5.25,coil=.23*(1-t)+.015;
    const cx=(t-.45)*.45,cy=.37+Math.cos(a)*coil*.57,cz=Math.sin(a)*coil*.72;
    const tubeRadius=.152*Math.pow(1-t,.82)+.013;
    for(let j=0;j<=sides;j++){
      const u=j/sides*Math.PI*2;
      pts.push(cx+Math.cos(u)*tubeRadius*.62,
        cy+Math.sin(u)*tubeRadius*.73,
        cz+Math.cos(u)*tubeRadius*.83);
      if(i<segments&&j<sides){
        const p=i*(sides+1)+j,q=p+sides+1;
        idx.push(p,q,p+1,q,q+1,p+1);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  geo.setIndex(idx);geo.computeVertexNormals();add(g,geo,base);
  // A rolled open lip, with the warm inner shell showing inside.
  const lip=[],inner=[];
  for(let k=0;k<=32;k++){
    const a=k/32*Math.PI*2;
    lip.push([-.2+.086*Math.cos(a),.37+.127*Math.sin(a),.11+.125*Math.cos(a)]);
    inner.push([-.2+.067*Math.cos(a),.37+.09*Math.sin(a),.117+.103*Math.cos(a)]);
  }
  rim(g,lip,.034,cream,true);
  rim(g,inner,.014,shade('#e7c6ac'),true);
  for(let i=0;i<19;i++){
    const t=.09+i*.043,a=t*Math.PI*5.25,coil=.23*(1-t)+.015;
    sphere(g,.019,cream,(t-.45)*.45+.07,.37+Math.cos(a)*coil*.57,Math.sin(a)*coil*.72,1,.8,1);
  }
}
function glass(g,item){
  const seed=item.id.length%11;
  const geo=new THREE.IcosahedronGeometry(.34,2),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const irregular=1+.085*Math.sin(14*x+seed)+.045*Math.cos(17*z+seed);
    pos.setXYZ(i,x*irregular,y*.54*irregular+.26,z*.91*irregular);
  }
  geo.computeVertexNormals();
  const m=shade(item.color,.26,0,{transparent:true,opacity:.87,transmission:.09,thickness:.4,clearcoat:1,clearcoatRoughness:.12,flatShading:false});
  add(g,geo,m);
  sphere(g,.065,shade('#ffffff',.1,0,{transparent:true,opacity:.64}),-.08,.39,.12,1,.2,.62);
}
function jewel(g,item){
  const tint=shade(item.color,.28,0,{clearcoat:1});
  const chain=item.id.includes('silver')||item.id.includes('moon')?silver:gold;
  if(item.type==='ring'){
    const band=add(g,new THREE.TorusGeometry(.23,.055,14,46),chain,0,.255,0);
    band.rotation.x=-Math.PI/2;
    const setting=add(g,new THREE.CylinderGeometry(.125,.145,.065,12),chain,0,.31,-.21);
    const gem=add(g,new THREE.OctahedronGeometry(.13,1),tint,0,.385,-.21);gem.scale.set(1,.48,1);
    for(const x of [-.085,.085])sphere(g,.023,ivory,x,.41,-.215);
    return;
  }
  if(item.type==='bracelet'){
    const string=add(g,new THREE.TorusGeometry(.285,.018,8,48),chain,0,.25,0);
    string.rotation.x=-Math.PI/2;
    for(let i=0;i<15;i++){
      const a=i*2*Math.PI/15;
      const beadColor=item.id.includes('pearl')?ivory:i%4===0?ivory:i%4===1?pink:tint;
      sphere(g,.075,beadColor,Math.cos(a)*.285,.29,Math.sin(a)*.285);
      if(i%3===0)sphere(g,.026,gold,Math.cos(a)*.285,.366,Math.sin(a)*.285);
    }
    if(item.id.includes('shell')){
      const charm=scallopCharm(g);charm.position.set(0,.28,-.37);
    } else if(item.id.includes('beaded')){
      const heart=pendant(g,heartShape(.1),gold,.02,.2,-.38,.03);
      heart.scale.setScalar(.72);
    }
    return;
  }
  // Pendants and charms all have their own meaningful silhouette.
  if(item.id.includes('moon')){
    const disk=add(g,new THREE.TorusGeometry(.21,.10,20,60),chain,0,.36,0);
    disk.rotation.x=-.23;
    sphere(g,.23,shade('#f4e8e6'),.13,.46,.06,1,1,.46);
    sphere(g,.045,ivory,-.12,.48,.14);
  } else if(item.id.includes('star')){
    pendant(g,starShape(5,.30,.14),chain,0,.39,0,.05);
    sphere(g,.055,ivory,0,.39,.12);
  } else {
    pendant(g,heartShape(.27),chain,0,.38,.02,.058);
    const inlay=pendant(g,heartShape(.18),tint,0,.38,.14,.03);
    inlay.scale.setScalar(.91);
  }
  const loop=add(g,new THREE.TorusGeometry(.068,.021,8,20),chain,0,.69,0);
  loop.rotation.x=-.16;
  if(item.id.includes('necklace')||item.id.includes('pendant')){
    const points=[];
    for(let i=0;i<=28;i++){
      const t=i/28,a=Math.PI*t;
      points.push([Math.cos(a)*.36,.68+Math.sin(a)*.13,-.04]);
    }
    rim(g,points,.012,chain);
  }
}
function scallopCharm(g){
  const c=new THREE.Group();g.add(c);
  for(let i=-3;i<=3;i++){
    const a=i/3*.63;
    tube(c,[[0,0,0],[a*.12,.06,.09],[a*.17,.11,.2]],.024,ivory);
  }
  return c;
}
function embossedCoin(g,item){
  const base=shade(item.color,.37,.28),edge=shade('#efcf92',.28,.65);
  const disk=add(g,new THREE.CylinderGeometry(.29,.29,.068,44),base,0,.29,0);
  disk.rotation.x=Math.PI/2;disk.rotation.y=.15;
  rim(g,Array.from({length:49},(_,i)=>{
    const a=i/48*Math.PI*2;return [Math.cos(a)*.265,.29+Math.sin(a)*.265,.045];
  }),.016,edge,true);
  const pattern=item.id==='blue-button'?
    new THREE.TorusGeometry(.12,.025,10,32):new THREE.OctahedronGeometry(.15,0);
  const motif=add(g,pattern,edge,0,.29,.062);
  if(item.id!=='blue-button')motif.scale.set(1,.95,.2);
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8;
    sphere(g,.013,edge,Math.cos(a)*.22,.29+Math.sin(a)*.22,.08);
  }
}
function antiqueKey(g,item){
  const bronze=shade(item.color,.3,.62);
  const bow=add(g,new THREE.TorusGeometry(.144,.04,12,32),bronze,-.24,.42,0);
  bow.rotation.z=.12;
  tube(g,[[-.11,.4,0],[.07,.39,0],[.26,.37,0],[.45,.37,0]],.048,bronze);
  for(const x of [.27,.41]){
    tube(g,[[x,.38,0],[x,.26,0],[x+.047,.26,0]],.035,bronze);
  }
  sphere(g,.05,ivory,-.24,.42,0,1,.4,1);
}
function starfish(g,item){
  const s=starShape(5,.4,.18),material=shade(item.color,.64,0,{clearcoat:.26});
  const shape=new THREE.ExtrudeGeometry(s,{depth:.10,bevelEnabled:true,bevelSegments:4,bevelThickness:.035,bevelSize:.06,curveSegments:12});
  const o=add(g,shape,material,0,.25,0);
  o.rotation.x=-Math.PI/2;
  for(let i=0;i<5;i++){
    const a=-Math.PI/2+i*Math.PI*2/5;
    for(let k=1;k<=3;k++){
      const d=.12+k*.055;
      sphere(g,.021,ivory,Math.cos(a)*d,.38,Math.sin(a)*d,1,.43,1);
    }
  }
  sphere(g,.07,shade('#ffd6b7'),0,.39,0,1,.55,1);
}
function oyster(g,item){
  const base=shade(item.color,.5),inside=shade('#fff8ee',.2,0,{clearcoat:1});
  scallop(g,item,.42);
  const inner=sphere(g,.23,inside,0,.275,.04,1,.25,.72);
  sphere(g,.17,shade('#fff8ed',.12,0,{clearcoat:1}),0,.41,.075);
  for(let i=0;i<6;i++){
    const a=i*Math.PI*2/6;
    sphere(g,.019,ivory,Math.cos(a)*.1,.54,Math.sin(a)*.09+.075,1,.65,1);
  }
}
function fossil(g,item){
  const stone=shade(item.color,.68),light=shade('#f4e9d3',.55);
  const coil=[];
  for(let i=0;i<=90;i++){
    const t=i/90,a=t*Math.PI*6.9,r=.015+t*.33;
    coil.push([Math.cos(a)*r,.23+.048*t,Math.sin(a)*r]);
  }
  rim(g,coil,.041,stone);
  rim(g,coil.map(([x,y,z])=>[x,y+.032,z]),.012,light);
  for(let i=0;i<11;i++){
    const a=i*Math.PI*2/11;
    sphere(g,.035,stone,Math.cos(a)*.3,.25,Math.sin(a)*.29,.7,.35,1);
  }
}
function sharkTooth(g,item){
  const tooth=new THREE.Shape();
  tooth.moveTo(-.24,.2);tooth.quadraticCurveTo(-.17,.4,-.09,.34);
  tooth.quadraticCurveTo(0,.49,.09,.34);tooth.quadraticCurveTo(.17,.4,.25,.2);
  tooth.quadraticCurveTo(.13,.21,0,-.35);tooth.quadraticCurveTo(-.1,.05,-.24,.2);
  const o=pendant(g,tooth,shade(item.color,.42),0,.41,.01,.06);
  o.rotation.x=-Math.PI/2.7;
  const gum=shade('#d2c4ab',.7);
  tube(g,[[-.20,.48,.03],[-.08,.51,.04],[.08,.51,.04],[.2,.48,.03]],.036,gum);
}
function bottle(g){
  const shape=[new THREE.Vector2(0,.05),new THREE.Vector2(.14,.05),
    new THREE.Vector2(.19,.10),new THREE.Vector2(.21,.32),
    new THREE.Vector2(.19,.46),new THREE.Vector2(.10,.54),
    new THREE.Vector2(.095,.69),new THREE.Vector2(.12,.72)];
  const body=add(g,new THREE.LatheGeometry(shape,28),
    shade('#addbd4',.14,0,{transparent:true,opacity:.67,transmission:.16,thickness:.55,clearcoat:1}));
  sphere(g,.11,shade('#efe5c8'),0,.30,0,1,1.3,.6);
  const scroll=add(g,new THREE.CylinderGeometry(.088,.088,.25,16),shade('#f4e3c5'),0,.33,0);
  scroll.rotation.z=.25;
  const cork=add(g,new THREE.CylinderGeometry(.11,.095,.16,20),shade('#b79870',.9),0,.77,0);
  sphere(g,.035,ivory,-.08,.6,.09);
}
export function createTreasure(item,scale=1){
  const g=new THREE.Group();
  if(item.id==='sand-dollar')sandDollar(g,item);
  else if(item.id==='moon-shell')moonShell(g,item);
  else if(item.type==='scallop'||item.type==='shell')scallop(g,item);
  else if(item.type==='conch')conch(g,item);
  else if(item.type==='glass')glass(g,item);
  else if(['ring','bracelet','charm'].includes(item.type))jewel(g,item);
  else if(item.type==='coin')embossedCoin(g,item);
  else if(item.type==='key')antiqueKey(g,item);
  else if(item.type==='starfish')starfish(g,item);
  else if(item.type==='pearl')oyster(g,item);
  else if(item.type==='fossil')fossil(g,item);
  else if(item.type==='tooth')sharkTooth(g,item);
  else if(item.type==='bottle')bottle(g);
  g.scale.setScalar(scale);
  g.userData.itemId=item.id;
  return g;
}
