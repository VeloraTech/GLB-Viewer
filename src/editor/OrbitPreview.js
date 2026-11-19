/**
 * OrbitPreview — non-destructive camera turntable around the active model.
 * The model's transforms and animation mixer are never modified.
 */
export class OrbitPreview {
  constructor({ THREE, camera, controls, getModel, speed = 0.45, axis = "y" }) {
    if (!THREE || !camera || !controls || typeof getModel !== "function") throw new TypeError("OrbitPreview requires camera, controls and getModel.");
    this.THREE = THREE;\n    this.camera = camera;
    this.controls = controls;
    this.getModel = getModel;
    this.speed = speed;
    this.axis = axis;
    this.active = false;
    this.center = null;
    this.radius = 0;
    this.angle = 0;
    this.onManualStart = () => this.stop();
    this.controls.addEventListener?.("start", this.onManualStart);
  }

  start() {
    const model = this.getModel();
    if (!model) return false;
    model.updateWorldMatrix?.(true, true);
    const box = new this.THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return false;
    this.center = box.getCenter(new this.THREE.Vector3());
    const offset = this.camera.position.clone().sub(this.center);
    this.radius = Math.max(offset.length(), 0.001);
    this.angle = Math.atan2(offset.x, offset.z);
    this.height = offset.y;
    this.controls.target.copy(this.center);
    this.controls.update();
    this.active = true;
    return true;
  }

  stop() { this.active = false; }
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
    if (!this.active || !this.center) return;
    const dt = Math.max(0, Math.min(Number(deltaSeconds) || 0, 0.1));
    this.angle += this.speed * dt;
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    const h = this.height;
    let offset;
    if (this.axis === "x") offset = new this.THREE.Vector3(this.radius * c, this.radius * s, h);
    else if (this.axis === "z") offset = new this.THREE.Vector3(this.radius * c, h, this.radius * s);
    else offset = new this.THREE.Vector3(this.radius * s, h, this.radius * c);
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
