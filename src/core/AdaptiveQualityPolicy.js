/**
 * Produces recommendations only. It does not mutate the renderer or scene.
 * Unknown and unavailable signals are neutral, never interpreted as zero.
 */
export function evaluateAdaptiveQuality({ nativeRelay, browser, performance } = {}) {
  const reasons = [];
  let level = 'conservative';
  const profile = nativeRelay?.available ? nativeRelay.profile : null;
  const memory = profile?.memory;
  const availableBytes = Number.isFinite(memory?.available_bytes) ? memory.available_bytes : null;
  const memoryTotal = Number.isFinite(memory?.total_bytes) && memory.total_bytes > 0 ? memory.total_bytes : null;
  const memoryPressure = availableBytes !== null && memoryTotal !== null
    ? availableBytes / memoryTotal
    : null;

  const hasCapabilitySignal = Boolean(nativeRelay?.available || browser?.available ||
    (Number.isFinite(performance?.frame?.p95FrameMs) && performance.frame.sampleCount >= 30));
  if (!hasCapabilitySignal) {
    reasons.push('no_capability_signals_available');
  } else {
    // A usable provider is evidence that the viewer can make a normal
    // recommendation. Missing individual readings remain neutral; they are
    // not converted to zero or treated as a reason to downgrade.
    level = 'balanced';
  }

  if (memoryPressure !== null && memoryPressure < 0.12) {
    level = 'conservative';
    reasons.push('low_available_system_memory');
  }

  const power = profile?.power;
  const battery = power?.battery;
  if (battery?.present === true && battery.charge_percent !== null &&
      Number.isFinite(battery.charge_percent) && battery.charge_percent <= 15 &&
      power?.source === 'battery') {
    level = 'conservative';
    reasons.push('low_battery_on_battery_power');
  }

  const frameP95 = performance?.frame?.p95FrameMs;
  if (Number.isFinite(frameP95) && performance.frame.sampleCount >= 30 && frameP95 > 33.3) {
    level = 'conservative';
    reasons.push('measured_slow_frame_time');
  }

  const webgl = browser?.available ? browser.webgl : null;
  if (webgl && Number.isFinite(webgl.maxTextureSize) && webgl.maxTextureSize < 4096) {
    if (level === 'balanced') level = 'conservative';
    reasons.push('limited_webgl_texture_capacity');
  }

  return {
    level,
    reasons,
    signals: {
      nativeRelay: nativeRelay?.available ? 'available' : 'unavailable',
      browser: browser?.available ? 'available' : 'unavailable',
      frameMeasurements: Number.isFinite(frameP95) ? 'available' : 'unavailable',
      memoryPressure: memoryPressure === null ? null : Math.round(memoryPressure * 1000) / 1000
    },
    policyVersion: 1
  };
}
