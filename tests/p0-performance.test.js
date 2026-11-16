import test from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceMonitor } from '../src/core/PerformanceMonitor.js';

test('PerformanceMonitor ignores invalid frame samples', () => {
  const monitor = new PerformanceMonitor();
  for (const value of [0, -1, NaN, Infinity, -Infinity, '0.016']) {
    monitor.recordFrame(value);
  }
  const frame = monitor.snapshot().frame;
  assert.equal(frame.sampleCount, 0);
  assert.equal(frame.averageFrameMs, null);
  assert.equal(frame.p95FrameMs, null);
  assert.equal(frame.fpsFromAverageFrameTime, null);
});

test('PerformanceMonitor keeps a bounded rolling frame window', () => {
  const monitor = new PerformanceMonitor({ frameSampleLimit: 3 });
  [0.01, 0.02, 0.03, 0.04].forEach((sample) => monitor.recordFrame(sample));
  const frame = monitor.snapshot().frame;
  assert.equal(frame.sampleCount, 3);
  assert.equal(frame.averageFrameMs, 30);
  assert.equal(frame.p95FrameMs, 40);
  assert.equal(frame.fpsFromAverageFrameTime, 1000 / 30);
});

test('PerformanceMonitor bounds load history and preserves status metadata', () => {
  const monitor = new PerformanceMonitor({ loadHistoryLimit: 2 });
  monitor.recordLoad({ fileName: 'first.glb', durationMs: 10.126, status: 'success' });
  monitor.recordLoad({ fileName: 'second.glb', durationMs: 20, status: 'failed' });
  monitor.recordLoad({ fileName: 'third.glb', durationMs: 30, status: 'stale' });
  const loads = monitor.snapshot().recentLoads;
  assert.deepEqual(loads.map((load) => load.fileName), ['second.glb', 'third.glb']);
  assert.deepEqual(loads.map((load) => load.status), ['failed', 'stale']);
  assert.equal(loads[0].durationMs, 20);
});

test('PerformanceMonitor ignores invalid load durations', () => {
  const monitor = new PerformanceMonitor();
  for (const durationMs of [-1, NaN, Infinity, '12']) {
    monitor.recordLoad({ fileName: 'invalid.glb', durationMs, status: 'success' });
  }
  assert.equal(monitor.snapshot().recentLoads.length, 0);
});

test('PerformanceMonitor sanitizes scene statistics without inventing measurements', () => {
  const monitor = new PerformanceMonitor();
  monitor.setSceneStats({ triangles: 120, vertices: NaN, meshes: -Infinity });
  assert.deepEqual(monitor.snapshot().scene, {
    triangles: 120,
    vertices: 0,
    meshes: 0
  });
});
