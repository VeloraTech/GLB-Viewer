import test from 'node:test';
import assert from 'node:assert/strict';
import { disposeObjectResources } from '../src/core/ResourceDisposer.js';

function resource(extra = {}) {
  return { disposeCount: 0, dispose() { this.disposeCount += 1; }, ...extra };
}

function tree(children) {
  return {
    traverse(callback) {
      callback(this);
      for (const child of children) callback(child);
    },
  };
}

test('disposes shared geometry, material and texture only once', () => {
  const geometry = resource();
  const texture = resource({ isTexture: true });
  const material = resource({ map: texture });
  const root = tree([
    { geometry, material },
    { geometry, material },
  ]);

  disposeObjectResources(root);

  assert.equal(geometry.disposeCount, 1);
  assert.equal(material.disposeCount, 1);
  assert.equal(texture.disposeCount, 1);
});

test('disposes material arrays, nested uniform textures and skeleton textures', () => {
  const geometry = resource();
  const map = resource({ isTexture: true });
  const uniformTexture = resource({ isTexture: true });
  const boneTexture = resource({ isTexture: true });
  const materialA = resource({ map });
  const materialB = resource({ uniforms: { diffuseMap: { value: [uniformTexture] } } });
  const skeleton = { boneTexture };
  const root = tree([{ geometry, material: [materialA, materialB], skeleton }]);

  disposeObjectResources(root);

  for (const item of [geometry, map, uniformTexture, boneTexture, materialA, materialB]) {
    assert.equal(item.disposeCount, 1);
  }
});

test('does nothing for a missing or non-traversable root', () => {
  assert.doesNotThrow(() => disposeObjectResources(null));
  assert.doesNotThrow(() => disposeObjectResources({}));
});
