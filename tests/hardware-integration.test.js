import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRelayHardwareProvider, BrowserCapabilityProvider, isHardwareProfile } from '../src/core/HardwareProviders.js';
import { evaluateAdaptiveQuality } from '../src/core/AdaptiveQualityPolicy.js';
const profile = { metadata: { contract_id: 'glb-viewer.hardware-profile', contract_version: '1.0.0' }, cpu: { logical_count: 4 }, memory: { total_bytes: 8_000_000_000, available_bytes: 4_000_000_000 }, gpus: [], power: { source: 'ac', battery: { present: false, charge_percent: null } } };
const noMeasurements = { frame: { sampleCount: 0, p95FrameMs: null } };
test('accepts versioned NativeRelay profile contract', () => { assert.equal(isHardwareProfile(profile), true); assert.equal(isHardwareProfile({ ...profile, metadata: {} }), false); });
test('NativeRelay failure is isolated', async () => { const r = await new NativeRelayHardwareProvider({ fetchImpl: async () => { throw Error('offline'); } }).getProfile(); assert.equal(r.available, false); assert.equal(r.profile, null); });
test('NativeRelay accepts valid partial profile', async () => { const r = await new NativeRelayHardwareProvider({ fetchImpl: async () => ({ ok: true, json: async () => profile }) }).getProfile(); assert.equal(r.available, true); assert.equal(r.profile.memory.available_bytes, 4_000_000_000); });
test('browser capabilities work when NativeRelay is unavailable', () => {
  const browser = new BrowserCapabilityProvider().getCapabilities({ renderer: { domElement: { clientWidth: 800, clientHeight: 600 }, getContext: () => ({ VERSION: 1, SHADING_LANGUAGE_VERSION: 2, MAX_TEXTURE_SIZE: 3, MAX_CUBE_MAP_TEXTURE_SIZE: 4, MAX_RENDERBUFFER_SIZE: 5, MAX_VERTEX_ATTRIBS: 6, getParameter: k => k === 3 ? 8192 : 'WebGL', getExtension: () => null, getContextAttributes: () => ({ antialias: true }), isContextLost: () => false }) } });
  const d = evaluateAdaptiveQuality({ nativeRelay: { available: false }, browser, performance: noMeasurements }); assert.equal(browser.available, true); assert.equal(d.level, 'balanced');
});
test('NativeRelay works when browser WebGL detection throws', () => {
  const browser = new BrowserCapabilityProvider().getCapabilities({ renderer: { getContext: () => { throw Error('lost'); } } });
  const d = evaluateAdaptiveQuality({ nativeRelay: { available: true, profile }, browser, performance: noMeasurements });
  assert.equal(browser.available, false); assert.equal(browser.status, 'webgl_context_error'); assert.equal(d.level, 'balanced');
});
test('browser provider handles lost WebGL context', () => { const r = new BrowserCapabilityProvider().getCapabilities({ renderer: { getContext: () => ({ isContextLost: () => true }) } }); assert.equal(r.available, false); assert.equal(r.status, 'webgl_context_lost'); });
test('browser provider treats individual parameter exceptions as unknown', () => {
  const r = new BrowserCapabilityProvider().getCapabilities({ renderer: { getContext: () => ({ getParameter: () => { throw Error('unavailable'); }, getExtension: () => null, getContextAttributes: () => ({}) }) } });
  assert.equal(r.available, true); assert.equal(r.webgl.maxTextureSize, null);
});
test('all providers unavailable selects conservative defaults without fabricated metrics', () => { const d = evaluateAdaptiveQuality({ nativeRelay: { available: false }, browser: { available: false }, performance: noMeasurements }); assert.equal(d.level, 'conservative'); assert.equal(d.signals.memoryPressure, null); assert.deepEqual(d.reasons, ['no_capability_signals_available']); });
test('low memory pressure independently recommends conservative quality', () => { const p = structuredClone(profile); p.memory.available_bytes = 500_000_000; const d = evaluateAdaptiveQuality({ nativeRelay: { available: true, profile: p }, browser: { available: false }, performance: noMeasurements }); assert.equal(d.level, 'conservative'); assert.ok(d.reasons.includes('low_available_system_memory')); });
test('unknown memory and battery readings do not become zero', () => { const p = structuredClone(profile); p.memory.available_bytes = null; p.power.battery = { present: true, charge_percent: null }; const d = evaluateAdaptiveQuality({ nativeRelay: { available: true, profile: p }, browser: { available: false }, performance: noMeasurements }); assert.equal(d.level, 'balanced'); assert.equal(d.signals.memoryPressure, null); });
test('measured slow frame time independently recommends conservative quality', () => { const d = evaluateAdaptiveQuality({ nativeRelay: { available: false }, browser: { available: false }, performance: { frame: { sampleCount: 30, p95FrameMs: 40 } } }); assert.equal(d.level, 'conservative'); assert.ok(d.reasons.includes('measured_slow_frame_time')); });
