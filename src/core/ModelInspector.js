/**
 * Inspect a loaded Three.js Object3D tree without mutating it.
 * Returns primitive counts, material/texture totals, bounds and review warnings.
 */
export function inspectModel(root, THREE) {
  if (!root || typeof root.traverse !== 'function' || !THREE?.Box3 || !THREE?.Vector3) {
    throw new TypeError('A model and Three.js namespace are required.');
  }
  let meshes = 0, vertices = 0, triangles = 0, groups = 0;
  const materials = new Set(), textures = new Set(), warnings = new Set();
  const visited = new Set();
  root.updateWorldMatrix?.(true, true);
  const collectTextures = value => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (value.isTexture) { textures.add(value); return; }
    if (Array.isArray(value)) { value.forEach(collectTextures); return; }
    for (const nested of Object.values(value)) collectTextures(nested);
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
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  if (bounds.isEmpty()) warnings.add('Model bounds could not be calculated.');
  return {
    meshes, vertices, triangles: Math.round(triangles), groups,
    materials: materials.size, textures: textures.size,
    warnings: [...warnings], size,
  };
}
