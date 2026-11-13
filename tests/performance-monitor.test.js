import test from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceMonitor } from '../src/core/PerformanceMonitor.js';

test('records a rolling frame-time window and derives FPS', () => {
  const monitor = new PerformanceMonitor({ frameSampleLimit: 3 });
  monitor.recordFrame(0.01);
  monitor.recordFrame(0.02);
  monitor.recordFrame(0.03);
  monitor.recordFrame(0.04);
  monitor.recordFrame(0);
  const frame = monitor.snapshot().frame;
  assert.equal(frame.sampleCount, 3);
  assert.equal(frame.averageFrameMs, 30);
  assert.ok(Math.abs(frame.fpsFromAverageFrameTime - (1000 / 30)) < 0.0001);
  assert.equal(frame.p95FrameMs, 40);
});

test('ignores invalid frame samples and records bounded load history', () => {
  const monitor = new PerformanceMonitor({ loadHistoryLimit: 2 });
  monitor.recordFrame(NaN);
  monitor.recordFrame(-1);
  monitor.recordLoad({ fileName: 'a.glb', durationMs: 12.345, status: 'success' });
  monitor.recordLoad({ fileName: 'b.glb', durationMs: 8, status: 'failed' });
  monitor.recordLoad({ fileName: 'c.glb', durationMs: 5, status: 'stale' });
  const snapshot = monitor.snapshot();
  assert.equal(snapshot.frame.sampleCount, 0);
  assert.deepEqual(snapshot.recentLoads.map((load) => load.fileName), ['b.glb', 'c.glb']);
  assert.equal(snapshot.recentLoads[0].durationMs, 8);
});

test('stores scene complexity without requiring Three.js', () => {
  const monitor = new PerformanceMonitor();
  monitor.setSceneStats({ triangles: 120, vertices: 80, meshes: 3 });
  assert.deepEqual(monitor.snapshot().scene, { triangles: 120, vertices: 80, meshes: 3 });
});
