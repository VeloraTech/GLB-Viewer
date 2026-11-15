/**
 * Independent local hardware signal providers.
 * NativeRelay is optional; browser capability detection never depends on it.
 */
export class NativeRelayHardwareProvider {
  constructor({ endpoint = '/__hardware/profile', fetchImpl = globalThis.fetch, timeoutMs = 1800 } = {}) {
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async getProfile() {
    if (typeof this.fetchImpl !== 'function') return unavailable('fetch_unavailable');
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller?.signal
      });
      if (!response.ok) return unavailable('http_' + response.status);
      const profile = await response.json();
      if (!isHardwareProfile(profile)) return unavailable('invalid_contract');
      return { available: true, status: 'available', profile };
    } catch (error) {
      return unavailable(error?.name === 'AbortError' ? 'timeout' : 'provider_unavailable');
    } finally {
      if (timeout !== null) clearTimeout(timeout);
    }
  }
}

export class BrowserCapabilityProvider {
  getCapabilities({ renderer, canvas = renderer?.domElement } = {}) {
    const gl = renderer?.getContext?.() || null;
    if (!gl) return { available: false, status: 'webgl_unavailable', webgl: null };
    let debugInfo = null;
    try { debugInfo = gl.getExtension('WEBGL_debug_renderer_info'); } catch {}
    const attributes = gl.getContextAttributes?.() || {};
    return {
      available: true,
      status: 'available',
      webgl: {
        version: gl.getParameter(gl.VERSION) || null,
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || null,
        maxTextureSize: finiteOrNull(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
        maxCubeMapTextureSize: finiteOrNull(gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)),
        maxRenderbufferSize: finiteOrNull(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)),
        maxVertexAttribs: finiteOrNull(gl.getParameter(gl.MAX_VERTEX_ATTRIBS)),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        antialias: attributes.antialias === true,
        pixelRatio: typeof devicePixelRatio === 'number' ? devicePixelRatio : 1,
        viewportWidth: canvas?.clientWidth || null,
        viewportHeight: canvas?.clientHeight || null
      }
    };
  }
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function unavailable(reason) {
  return { available: false, status: reason, profile: null };
}

export function isHardwareProfile(value) {
  return Boolean(value && typeof value === 'object' &&
    value.metadata?.contract_id === 'glb-viewer.hardware-profile' &&
    typeof value.metadata.contract_version === 'string' &&
    value.cpu && typeof value.cpu === 'object' &&
    value.memory && typeof value.memory === 'object' &&
    Array.isArray(value.gpus));
}
