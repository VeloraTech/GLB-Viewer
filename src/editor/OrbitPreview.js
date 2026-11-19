/**
 * OrbitPreview — non-destructive camera turntable around the active model.
 * It changes the camera only; model transforms and animation state are untouched.
 */
export class OrbitPreview {
  constructor({ THREE, camera, controls, getModel, speed = 0.45, axis = "y" }) {
    if (!THREE || !camera || !controls || typeof getModel !== "function") throw new TypeError("OrbitPreview requires THREE, camera, controls and getModel.");
    this.THREE = THREE;
    this.camera = camera;
    this.controls = controls;
    this.getModel = getModel;
    this.speed = speed;
    this.axis = axis;
    this.active = false;
    this.paused = false;
    this.center = null;
    this.radius = 0;
    this.angle = 0;
    this.height = 0;
    this.onManualStart = () => this.pause();
    this.controls.addEventListener?.("start", this.onManualStart);
  }

  start() {
    const model = this.getModel();
    if (!model) return false;
    model.updateWorldMatrix?.(true, true);
    const box = new this.THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return false;
    this.center = box.getCenter(new this.THREE.Vector3());
    this.syncFromCamera();
    this.controls.target.copy(this.center);
    this.controls.update();
    this.active = true;
    this.paused = false;
    return true;
  }

  syncFromCamera() {
    if (!this.center) return;
    const offset = this.camera.position.clone().sub(this.center);
    this.radius = Math.max(Math.hypot(offset.x, offset.z), 0.001);
    this.angle = Math.atan2(offset.x, offset.z);
    this.height = offset.y;
  }

  pause() { if (this.active) this.paused = true; }
  resume() {
    if (!this.active) return this.start();
    this.syncFromCamera();
    this.paused = false;
    return true;
  }
  stop() { this.active = false; this.paused = false; }
  toggle() { return this.active ? (this.stop(), false) : this.start(); }

  setSpeed(value) {
    const speed = Number(value);
    if (!Number.isFinite(speed) || speed < 0.02 || speed > 3) throw new RangeError("Orbit speed must be between 0.02 and 3 radians per second.");
    this.speed = speed;
  }

  setAxis(axis) {
    if (!["x", "y", "z"].includes(axis)) throw new TypeError("Orbit axis must be x, y or z.");
    this.axis = axis;
    if (this.active) this.start();
  }

  update(deltaSeconds) {
    if (!this.active || this.paused || !this.center) return;
    const dt = Math.max(0, Math.min(Number(deltaSeconds) || 0, 0.1));
    this.angle += this.speed * dt;
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    let offset;
    if (this.axis === "x") offset = new this.THREE.Vector3(this.height, this.radius * s, this.radius * c);
    else if (this.axis === "z") offset = new this.THREE.Vector3(this.radius * c, this.radius * s, this.height);
    else offset = new this.THREE.Vector3(this.radius * s, this.height, this.radius * c);
    this.camera.position.copy(this.center).add(offset);
    this.camera.lookAt(this.center);
    this.controls.target.copy(this.center);
    this.controls.update();
  }

  dispose() {
    this.stop();
    this.controls.removeEventListener?.("start", this.onManualStart);
  }
}
