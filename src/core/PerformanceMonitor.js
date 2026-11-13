/**
 * Lightweight, local-only performance measurements for the viewer.
 * No timers, logging, network requests, or per-frame object allocations.
 */
export class PerformanceMonitor {
  constructor({ frameSampleLimit = 120, loadHistoryLimit = 20 } = {}) {
    this.frameSamples = new Float64Array(Math.max(1, frameSampleLimit));
    this.frameSampleCount = 0;
    this.frameSampleIndex = 0;
    this.loadHistoryLimit = Math.max(1, loadHistoryLimit);
    this.loads = [];
    this.sceneStats = { triangles: 0, vertices: 0, meshes: 0 };
    this.startedAt = Date.now();
  }

  recordFrame(deltaSeconds) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    this.frameSamples[this.frameSampleIndex] = deltaSeconds * 1000;
    this.frameSampleIndex = (this.frameSampleIndex + 1) % this.frameSamples.length;
    this.frameSampleCount = Math.min(this.frameSampleCount + 1, this.frameSamples.length);
  }

  recordLoad({ fileName, durationMs, status }) {
    if (!Number.isFinite(durationMs) || durationMs < 0) return;
    this.loads.push({
      fileName: String(fileName || 'unknown'),
      durationMs: Math.round(durationMs * 100) / 100,
      status: String(status || 'unknown'),
      completedAt: new Date().toISOString()
    });
    if (this.loads.length > this.loadHistoryLimit) {
      this.loads.splice(0, this.loads.length - this.loadHistoryLimit);
    }
  }

  setSceneStats(stats = {}) {
    this.sceneStats = {
      triangles: Number.isFinite(stats.triangles) ? stats.triangles : 0,
      vertices: Number.isFinite(stats.vertices) ? stats.vertices : 0,
      meshes: Number.isFinite(stats.meshes) ? stats.meshes : 0
    };
  }

  snapshot() {
    const samples = [];
    let total = 0;
    for (let i = 0; i < this.frameSampleCount; i++) {
      const value = this.frameSamples[i];
      samples.push(value);
      total += value;
    }
    samples.sort((a, b) => a - b);
    const averageFrameMs = samples.length ? total / samples.length : null;
    return {
      generatedAt: new Date().toISOString(),
      sessionDurationMs: Date.now() - this.startedAt,
      frame: {
        sampleCount: samples.length,
        averageFrameMs,
        fpsFromAverageFrameTime: averageFrameMs ? 1000 / averageFrameMs : null,
        p95FrameMs: samples.length ? samples[Math.min(samples.length - 1, Math.ceil(samples.length * 0.95) - 1)] : null
      },
      scene: { ...this.sceneStats },
      recentLoads: this.loads.map((load) => ({ ...load }))
    };
  }
}
