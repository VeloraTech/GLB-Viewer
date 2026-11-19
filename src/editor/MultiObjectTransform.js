/**
 * MultiObjectTransform — applies a TransformControls proxy delta to a selection.
 * Objects keep their original parents; only their local transforms are updated.
 */
export class MultiObjectTransform {
  constructor({ THREE, scene, controls, onCommit = () => {} }) {
    if (!THREE || !scene || !controls) throw new TypeError('THREE, scene and TransformControls are required.');
    Object.assign(this, { THREE, scene, controls, onCommit });
    this.proxy = new THREE.Object3D();
    this.proxy.name = 'GLB Viewer multi-selection pivot';
    this.proxy.userData.editorHelper = true;
    this.objects = [];
    this.active = null;
    this.before = null;
    this.startPivot = null;
    this.space = 'world';
  }

  setSelection(objects, active, space = this.space) {
    this.objects = [...new Set(objects)].filter(Boolean);
    this.active = active && this.objects.includes(active) ? active : this.objects[0] || null;
    this.space = space;
    if (this.objects.length <= 1) {
      if (this.scene.children.includes(this.proxy)) this.scene.remove(this.proxy);
      if (this.objects[0]) this.controls.attach(this.objects[0]);
      else this.controls.detach();
      return;
    }
    this.scene.add(this.proxy);
    this.syncPivot();
    this.controls.attach(this.proxy);
  }

  setSpace(space) {
    this.space = space;
    if (this.objects.length > 1) this.syncPivot();
  }

  syncPivot() {
    if (this.objects.length < 2) return;
    const { THREE } = this;
    this.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3();
    this.objects.forEach(object => bounds.expandByObject(object));
    bounds.getCenter(this.proxy.position);
    this.proxy.quaternion.identity();
    if (this.space === 'local' && this.active) {
      this.active.getWorldQuaternion(this.proxy.quaternion);
    }
    this.proxy.scale.set(1, 1, 1);
    this.proxy.updateMatrixWorld(true);
  }

  begin() {
    if (this.objects.length < 2) return null;
    this.scene.updateMatrixWorld(true);
    this.proxy.updateMatrixWorld(true);
    this.before = this.objects.map(object => ({
      object,
      position: object.position.clone(),
      quaternion: object.quaternion.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone(),
      world: object.matrixWorld.clone(),
      parentWorldInverse: object.parent
        ? object.parent.matrixWorld.clone().invert()
        : new this.THREE.Matrix4()
    }));
    this.startPivot = this.proxy.matrixWorld.clone();
    return this.before;
  }

  update() {
    if (!this.before || !this.startPivot) return;
    const { THREE } = this;
    this.proxy.updateMatrixWorld(true);
    const delta = this.proxy.matrixWorld.clone().multiply(this.startPivot.clone().invert());
    for (const snapshot of this.before) {
      const world = delta.clone().multiply(snapshot.world);
      const local = snapshot.parentWorldInverse.clone().multiply(world);
      local.decompose(snapshot.object.position, snapshot.object.quaternion, snapshot.object.scale);
      snapshot.object.rotation.setFromQuaternion(snapshot.object.quaternion, snapshot.object.rotation.order);
      snapshot.object.updateMatrixWorld(true);
    }
    this.scene.updateMatrixWorld(true);
  }

  finish() {
    if (!this.before) return null;
    const before = this.before;
    const after = before.map(snapshot => ({
      object: snapshot.object,
      position: snapshot.object.position.clone(),
      quaternion: snapshot.object.quaternion.clone(),
      rotation: snapshot.object.rotation.clone(),
      scale: snapshot.object.scale.clone()
    }));
    this.before = null;
    this.startPivot = null;
    const changed = after.some((item, index) =>
      !item.position.equals(before[index].position) ||
      !item.quaternion.equals(before[index].quaternion) ||
      !item.scale.equals(before[index].scale)
    );
    if (!changed) return null;
    const apply = snapshots => {
      snapshots.forEach(value => {
        value.object.position.copy(value.position);
        value.object.quaternion.copy(value.quaternion);
        value.object.rotation.setFromQuaternion(value.object.quaternion, value.object.rotation.order);
        value.object.scale.copy(value.scale);
        value.object.updateMatrixWorld(true);
      });
      this.scene.updateMatrixWorld(true);
    };
    const command = { do: () => apply(after), undo: () => apply(before) };
    this.onCommit(command);
    this.syncPivot();
    return command;
  }

  cancel() {
    if (!this.before) return;
    this.before.forEach(snapshot => {
      snapshot.object.position.copy(snapshot.position);
      snapshot.object.quaternion.copy(snapshot.quaternion);
      snapshot.object.rotation.copy(snapshot.rotation);
      snapshot.object.scale.copy(snapshot.scale);
      snapshot.object.updateMatrixWorld(true);
    });
    this.before = null;
    this.startPivot = null;
    this.syncPivot();
  }

  dispose() {
    this.cancel();
    if (this.controls.object === this.proxy) this.controls.detach();
    this.scene.remove(this.proxy);
    this.objects = [];
    this.active = null;
  }
}
