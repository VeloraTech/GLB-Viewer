import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRelayHardwareProvider, isHardwareProfile } from '../src/core/HardwareProviders.js';
import { evaluateAdaptiveQuality } from '../src/core/AdaptiveQualityPolicy.js';

const profile = {
  metadata: { contract_id: 'glb-viewer.hardware-profile', contract_version: '1.0.0' },
  cpu: { logical_count: 4 },
  memory: { total_bytes: 8_000_000_000, available_bytes: 4_000_000_000 },
  gpus: [],
  power: { source: 'ac', battery: { present: false, charge_percent: null } }
};

test('accepts the versioned NativeRelay hardware profile contract', () => {
  assert.equal(isHardwareProfile(profile), true);
  assert.equal(isHardwareProfile({ ...profile, metadata: {} }), false);
});

test('NativeRelay failure is isolated and reported as unavailable', async () => {
  const provider = new NativeRelayHardwareProvider({ fetchImpl: async () => { throw new Error('offline'); } });
  const result = await provider.getProfile();
  assert.equal(result.available, false);
  assert.equal(result.profile, null);
});

test('NativeRelay accepts a valid partial profile without requiring optional fields', async () => {
  const provider = new NativeRelayHardwareProvider({
    fetchImpl: async () => ({ ok: true, json: async () => profile })
  });
  const result = await provider.getProfile();
  assert.equal(result.available, true);
  assert.equal(result.profile.memory.available_bytes, 4_000_000_000);
});

test('all providers unavailable selects conservative defaults without fabricated metrics', () => {
  const decision = evaluateAdaptiveQuality({
    nativeRelay: { available: false },
    browser: { available: false },
    performance: { frame: { sampleCount: 0, p95FrameMs: null } }
  });
  assert.equal(decision.level, 'balanced');
  assert.equal(decision.signals.memoryPressure, null);
  assert.deepEqual(decision.reasons, []);
});

test('low memory pressure independently recommends conservative quality', () => {
  const lowMemory = structuredClone(profile);
  lowMemory.memory.available_bytes = 500_000_000;
  const decision = evaluateAdaptiveQuality({
    nativeRelay: { available: true, profile: lowMemory },
    browser: { available: false },
    performance: { frame: { sampleCount: 0, p95FrameMs: null } }
  });
  assert.equal(decision.level, 'conservative');
  assert.ok(decision.reasons.includes('low_available_system_memory'));
});

test('unknown memory and battery readings do not become zero', () => {
  const unknown = structuredClone(profile);
  unknown.memory.available_bytes = null;
  unknown.power.battery = { present: true, charge_percent: null };
  const decision = evaluateAdaptiveQuality({
    nativeRelay: { available: true, profile: unknown },
    browser: { available: false },
    performance: { frame: { sampleCount: 0, p95FrameMs: null } }
  });
  assert.equal(decision.level, 'balanced');
  assert.equal(decision.signals.memoryPressure, null);
});
