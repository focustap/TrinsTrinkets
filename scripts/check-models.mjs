import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CATALOG} from '../src/catalog.js';
import {createTreasure} from '../src/treasures.js';

let vertexCount=0;
for(const item of CATALOG){
  const model=createTreasure(item);
  assert.equal(model.userData.itemId,item.id,item.id+' should preserve its catalog ID');
  assert.ok(model.children.length>0,item.id+' must have visible geometry');
  const bbox=new THREE.Box3().setFromObject(model);
  assert.equal(bbox.isEmpty(),false,item.id+' must have nonempty bounds');
  const size=bbox.getSize(new THREE.Vector3());
  assert.ok(size.x>.1&&size.y>.04&&size.z>.015,item.id+' must be a sculpted 3D shape');
  assert.ok(Math.max(size.x,size.y,size.z)<1.9,item.id+' should fit on shelf');
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    const positions=obj.geometry.getAttribute('position');
    assert.ok(positions?.count>0,item.id+' has geometry vertices');
    for(let i=0;i<positions.count;i++)for(let k=0;k<3;k++)
      assert.ok(Number.isFinite(positions.array[i*3+k]),item.id+' has invalid vertex');
    vertexCount+=positions.count;
  });
}
assert.equal(CATALOG.length,32,'all catalog items should be tested');
console.log('Verified',CATALOG.length,'treasures with',vertexCount,'finite vertices.');
