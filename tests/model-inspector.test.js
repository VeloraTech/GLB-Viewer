import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectModel } from '../src/core/ModelInspector.js';

class Vector3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  toArray(){return [this.x,this.y,this.z];}
}
class Box3 {
  setFromObject(){return this;}
  getSize(target){target.x=4;target.y=2;target.z=1;return target;}
  isEmpty(){return false;}
}
const THREE={Box3,Vector3};

function makeModel(children) {
  return {children,updateWorldMatrix(){},traverse(callback){
    const visit=node=>{callback(node);(node.children||[]).forEach(visit);};
    visit(this);
  }};
}

test('inspectModel counts indexed and non-indexed mesh geometry and unique resources',()=>{
  const texture={isTexture:true};
  const sharedMaterial={map:texture,normalMap:texture};
  const indexed={isMesh:true,geometry:{attributes:{position:{count:4}},index:{count:6}},material:sharedMaterial};
  const plain={isMesh:true,geometry:{attributes:{position:{count:3}}},material:sharedMaterial};
  const root=makeModel([{isGroup:true,children:[indexed,plain]}]);
  const result=inspectModel(root,THREE);
  assert.equal(result.meshes,2);
  assert.equal(result.vertices,7);
  assert.equal(result.triangles,3);
  assert.equal(result.groups,1);
  assert.equal(result.materials,1);
  assert.equal(result.textures,1);
  assert.deepEqual(result.size.toArray(),[4,2,1]);
  assert.deepEqual(result.warnings,[]);
});

test('inspectModel reports geometry and export-review warnings without mutating model',()=>{
  const malformed={isMesh:true,geometry:{attributes:{position:{count:4}},index:{count:4},morphAttributes:{position:[{}]}},material:null,isSkinnedMesh:true};
  const line={isLine:true};
  const root=makeModel([malformed,line]);
  const result=inspectModel(root,THREE);
  assert.equal(result.triangles,1);
  assert.ok(result.warnings.some(value=>value.includes('complete set of triangles')));
  assert.ok(result.warnings.some(value=>value.includes('Morph targets')));
  assert.ok(result.warnings.some(value=>value.includes('Skinned mesh')));
  assert.ok(result.warnings.some(value=>value.includes('Line or point')));
  assert.equal(malformed.geometry.index.count,4);
});

test('inspectModel rejects missing model or Three.js bounds support',()=>{
  assert.throws(()=>inspectModel(null,THREE),/model and Three.js/i);
  assert.throws(()=>inspectModel(makeModel([]),{}),/model and Three.js/i);
});
