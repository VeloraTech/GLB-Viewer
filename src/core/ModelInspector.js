/**
 * Inspect a loaded Object3D tree without mutating it.
 * Counts rendered mesh geometry and reports content that deserves export review.
 */
export function inspectModel(root) {
  if (!root || typeof root.traverse !== 'function') {
    throw new TypeError('A model with a traverse() method is required.');
  }
  let meshes = 0, vertices = 0, triangles = 0, groups = 0;
  const materials = new Set(), textures = new Set(), warnings = new Set();
  root.updateWorldMatrix?.(true, true);
  const box = new globalThis.__GLB_VIEWER_THREE__?.Box3?.(); 
  const collectTextures = (value, visited = new Set()) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (value.isTexture) { textures.add(value); return; }
    if (Array.isArray(value)) { value.forEach(item => collectTextures(item, visited)); return; }
    for (const nested of Object.values(value)) collectTextures(nested, visited);
  };
  root.traverse(object => {
    if (object.isGroup) groups++;
    if (object.isMesh) {
      meshes++;
      const geometry = object.geometry;
      const position = geometry?.attributes?.position;
      const count = geometry?.index ? geometry.index.count : position?.count || 0;
      if (!position) warnings.add('A mesh has no position attribute.');
      else {
        vertices += position.count;
        triangles += Math.floor(count / 3);
        if (count % 3 !== 0) warnings.add('Some mesh geometry is not a complete set of triangles.');
      }
      if (geometry?.morphAttributes && Object.keys(geometry.morphAttributes).length) warnings.add('Morph targets are present; verify animation after export.');
      if (object.isSkinnedMesh) warnings.add('Skinned mesh detected; verify skinning after export.');
      const slots = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of slots) {
        if (!material) continue;
        materials.add(material);
        collectTextures(material);
      }
    }
    if (object.isLine || object.isPoints) warnings.add('Line or point geometry is present; GLB export compatibility should be checked.');
  });
  let dimensions = null;
  if (root.constructor?.name === 'Scene' && root.position) {
    // Box3 is supplied by the caller through the standard Three.js object API
    // when available; geometry-derived inspection remains useful without it.
  }
  return { meshes, vertices, triangles, groups, materials: materials.size, textures: textures.size, warnings: [...warnings], dimensions };
}
