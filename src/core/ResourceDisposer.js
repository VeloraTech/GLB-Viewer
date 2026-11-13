/**
 * Dispose GPU-backed resources owned by a loaded Object3D tree.
 *
 * GLTF scenes may share geometry, materials, or textures between meshes.
 * Sets ensure each resource is disposed at most once per call. This function
 * intentionally does not dispose scene.environment or renderer-owned assets.
 */
export function disposeObjectResources(root) {
  if (!root || typeof root.traverse !== 'function') return;

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const skeletons = new Set();
  const visited = new Set();

  const collectTextures = (value) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);

    if (value.isTexture) {
      textures.add(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collectTextures);
      return;
    }

    // Shader uniforms and nested material extension data can contain textures.
    for (const nested of Object.values(value)) {
      if (nested && typeof nested === 'object') collectTextures(nested);
    }
  };

  root.traverse((object) => {
    if (object.geometry?.dispose) geometries.add(object.geometry);

    if (object.material) {
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) {
        if (!material || materials.has(material)) continue;
        materials.add(material);
        collectTextures(material);
      }
    }

    if (object.skeleton && !skeletons.has(object.skeleton)) {
      skeletons.add(object.skeleton);
      if (object.skeleton.boneTexture) textures.add(object.skeleton.boneTexture);
    }
  });

  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
}
