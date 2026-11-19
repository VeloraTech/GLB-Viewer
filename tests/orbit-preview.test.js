import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitPreview } from '../src/editor/OrbitPreview.js';

class Vector3 {
  constructor(x=0,y=0,z=0) { Object.assign(this,{x,y,z}); }
  clone() { return new Vector3(this.x,this.y,this.z); }
  set(x,y,z) { Object.assign(this,{x,y,z}); return this; }
  sub(v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; }
  add(v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; }
  length() { return Math.hypot(this.x,this.y,this.z); }
  copy(v) { Object.assign(this,{x:v.x,y:v.y,z:v.z}); return this; }
}
class Box3 {
  setFromObject() { return this; }
  isEmpty() { return false; }
  getCenter(target) { return target.set(0,0,0); }
}
const THREE = { Vector3, Box3 };
function setup() {
  const events = new Map();
  const controls = {
    target: new Vector3(),
    update() {},
    addEventListener(type, fn) { events.set(type, fn); },
    removeEventListener(type) { events.delete(type); },
    emit(type) { events.get(type)?.(); }
  };
  const camera = { position: new Vector3(0,2,10), lookAt() {} };
  const model = { position: new Vector3(4,0,0), updateWorldMatrix() {} };
  const preview = new OrbitPreview({ THREE, camera, controls, getModel: () => model });
  return { preview, camera, controls, model };
}

test('OrbitPreview rotates the camera around the model center without changing model transforms', () => {
  const { preview, camera, model } = setup();
  const original = model.position.clone();
  assert.equal(preview.start(), true);
  const before = camera.position.clone();
  preview.update(0.1);
  assert.notDeepEqual(camera.position, before);
  assert.deepEqual(model.position, original);
  preview.dispose();
});

test('OrbitPreview pauses on manual camera interaction and can resume', () => {
  const { preview, controls, camera } = setup();
  assert.equal(preview.start(), true);
  controls.emit('start');
  assert.equal(preview.paused, true);
  const before = camera.position.clone();
  preview.update(0.1);
  assert.deepEqual(camera.position, before);
  preview.resume();
  preview.update(0.1);
  assert.notDeepEqual(camera.position, before);
  preview.stop();
  assert.equal(preview.active, false);
});

test('OrbitPreview validates speed and axis', () => {
  const { preview } = setup();
  assert.throws(() => preview.setSpeed(0), /between/);
  assert.throws(() => preview.setAxis('q'), /axis/);
  preview.setSpeed(1.2);
  preview.setAxis('x');
  assert.equal(preview.speed, 1.2);
  assert.equal(preview.axis, 'x');
  preview.dispose();
});
