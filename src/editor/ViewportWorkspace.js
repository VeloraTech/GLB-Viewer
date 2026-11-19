/**
 * ViewportWorkspace — lightweight viewport presentation and navigation controls.
 * Grid/axes are editor helpers; shading changes material presentation only.
 */
export class ViewportWorkspace {
  constructor({ THREE, scene, camera, controls, renderer, getModel, getSelection }) {
    Object.assign(this,{THREE,scene,camera,controls,renderer,getModel,getSelection});
    this.grid=new THREE.GridHelper(20,20,0x777777,0x3b3b3b);
    this.grid.name="__editor_grid";this.grid.userData.editorHelper=true;this.grid.visible=true;
    this.axes=new THREE.AxesHelper(2);this.axes.name="__editor_axes";this.axes.userData.editorHelper=true;this.axes.visible=true;
    scene.add(this.grid,this.axes);
    this.originalMaterials=new Map();
    this.mode="material";
    this.savedCamera={position:camera.position.clone(),target:controls.target.clone()};
    this.selectionHelper=null;
  }
  setGrid(visible){this.grid.visible=Boolean(visible);}
  setAxes(visible){this.axes.visible=Boolean(visible);}
  setShading(mode){
    if(!["material","wireframe","normal"].includes(mode))throw new TypeError("Unsupported viewport shading mode.");
    const model=this.getModel();if(!model)return;
    if(this.mode!=="material")this.restoreMaterials(model);
    this.mode=mode;
    if(mode==="material")return;
    model.traverse(object=>{
      if(!object.isMesh||!object.material)return;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      if(!this.originalMaterials.has(object))this.originalMaterials.set(object,object.material);
      const replacement=materials.map(material=>{
        const next=mode==="wireframe"
          ? new this.THREE.MeshBasicMaterial({color:0xc4cbd4,wireframe:true})
          : new this.THREE.MeshNormalMaterial();
        next.side=material.side;return next;
      });
      object.material=Array.isArray(object.material)?replacement:replacement[0];
    });
  }
  restoreMaterials(model=this.getModel()){
    if(!model)return;
    for(const [object,original] of this.originalMaterials){
      const temporary=object.material;
      const temporaryMaterials=Array.isArray(temporary)?temporary:[temporary];
      const originalMaterials=Array.isArray(original)?original:[original];
      // Dispose only the temporary viewport materials created by setShading.
      // Original GLB materials and their textures remain owned by the model.
      temporaryMaterials.forEach(material=>{
        if(material&&!originalMaterials.includes(material))material.dispose?.();
      });
      if(object.parent||object===model||model.getObjectById?.(object.id))object.material=original;
    }
    this.originalMaterials.clear();
  }
  frame(object=this.getSelection()||this.getModel()){
    if(!object)return false;
    object.updateWorldMatrix?.(true,true);
    const box=new this.THREE.Box3().setFromObject(object);
    if(box.isEmpty())return false;
    const center=box.getCenter(new this.THREE.Vector3());
    const size=box.getSize(new this.THREE.Vector3());
    const radius=Math.max(size.x,size.y,size.z,0.01);
    const distance=radius/(2*Math.tan(this.THREE.MathUtils.degToRad(this.camera.fov||45)/2))*1.5;
    const direction=this.camera.position.clone().sub(this.controls.target);
    if(direction.lengthSq()<1e-8)direction.set(0,0,1);
    direction.normalize();
    this.camera.position.copy(center).addScaledVector(direction,distance);
    this.controls.target.copy(center);this.controls.update();
    this.camera.near=Math.max(distance/1000,0.001);this.camera.far=Math.max(distance*100,1000);
    this.camera.updateProjectionMatrix();return true;
  }
  preset(name){
    const model=this.getModel();if(!model)return false;
    model.updateWorldMatrix?.(true,true);
    const box=new this.THREE.Box3().setFromObject(model);
    if(box.isEmpty())return false;
    const center=box.getCenter(new this.THREE.Vector3());
    const size=box.getSize(new this.THREE.Vector3());
    const distance=Math.max(size.x,size.y,size.z,1)*2.2;
    const directions={front:[0,0,1],back:[0,0,-1],right:[1,0,0],left:[-1,0,0],top:[0,1,0],bottom:[0,-1,0]};
    const direction=directions[name];if(!direction)throw new TypeError("Unknown camera preset.");
    this.controls.target.copy(center);
    this.camera.position.copy(center).add(new this.THREE.Vector3(...direction).multiplyScalar(distance));
    this.camera.up.set(0,1,0);
    if(name==="top")this.camera.up.set(0,0,-1);
    if(name==="bottom")this.camera.up.set(0,0,1);
    this.camera.lookAt(center);this.controls.update();return true;
  }
  resetView(){const model=this.getModel();if(!model)return false;return this.frame(model);}
  dispose(){this.restoreMaterials();this.scene.remove(this.grid,this.axes);if(this.selectionHelper)this.scene.remove(this.selectionHelper);}
}
