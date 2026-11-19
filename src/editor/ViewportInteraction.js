/**
 * ViewportInteraction — owns pointer-to-scene selection without replacing
 * OrbitControls (which continues to own orbit, pan and zoom gestures).
 */
export class ViewportInteraction {
  constructor({ element, camera, scene, raycaster, onSelect, dragThreshold = 4 }) {
    if (!element || !camera || !scene || !raycaster || typeof onSelect !== "function") throw new TypeError("ViewportInteraction requires element, camera, scene, raycaster and onSelect.");
    Object.assign(this, { element, camera, scene, raycaster, onSelect, dragThreshold });
    this.down = null;
    this.handleDown = (e) => { if (e.button === 0) this.down = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }; };
    this.handleUp = (e) => {
      const start = this.down; this.down = null;
      if (!start || start.pointerId !== e.pointerId || Math.hypot(e.clientX-start.x,e.clientY-start.y) > this.dragThreshold) return;
      const rect = this.element.getBoundingClientRect();
      const pointer = { x: ((e.clientX-rect.left)/rect.width)*2-1, y: -((e.clientY-rect.top)/rect.height)*2+1 };
      this.raycaster.setFromCamera(pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.scene.children, true);
      this.onSelect(hits.find(hit => hit.object?.isMesh)?.object || null, hits);
    };
    element.addEventListener("pointerdown", this.handleDown);
    element.addEventListener("pointerup", this.handleUp);
  }
  dispose() { this.element.removeEventListener("pointerdown", this.handleDown); this.element.removeEventListener("pointerup", this.handleUp); this.down = null; }
}
