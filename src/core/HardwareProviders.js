/** Independent local hardware signal providers. NativeRelay is optional. */
export class NativeRelayHardwareProvider {
  constructor({ endpoint = '/__hardware/profile', fetchImpl = globalThis.fetch, timeoutMs = 1800 } = {}) {
    this.endpoint = endpoint; this.fetchImpl = fetchImpl; this.timeoutMs = timeoutMs;
  }
  async getProfile() {
    if (typeof this.fetchImpl !== 'function') return unavailable('fetch_unavailable');
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;
    try {
      const response = await this.fetchImpl(this.endpoint, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller?.signal });
      if (!response.ok) return unavailable('http_' + response.status);
      const profile = await response.json();
      if (!isHardwareProfile(profile)) return unavailable('invalid_contract');
      return { available: true, status: 'available', profile };
    } catch (error) {
      return unavailable(error?.name === 'AbortError' ? 'timeout' : 'provider_unavailable');
    } finally { if (timeout !== null) clearTimeout(timeout); }
  }
}
export class BrowserCapabilityProvider {
  getCapabilities({ renderer, canvas = renderer?.domElement } = {}) {
    let gl;
    try { gl = renderer?.getContext?.() || null; } catch { return browserUnavailable('webgl_context_error'); }
    if (!gl) return browserUnavailable('webgl_unavailable');
    try {
      if (gl.isContextLost?.()) return browserUnavailable('webgl_context_lost');
      let debugInfo = null;
      try { debugInfo = gl.getExtension('WEBGL_debug_renderer_info'); } catch {}
      const attributes = gl.getContextAttributes?.() || {};
      const parameter = key => { try { return gl.getParameter(key); } catch { return null; } };
      return { available: true, status: 'available', webgl: {
        version: parameter(gl.VERSION), shadingLanguageVersion: parameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: finiteOrNull(parameter(gl.MAX_TEXTURE_SIZE)),
        maxCubeMapTextureSize: finiteOrNull(parameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)),
        maxRenderbufferSize: finiteOrNull(parameter(gl.MAX_RENDERBUFFER_SIZE)),
        maxVertexAttribs: finiteOrNull(parameter(gl.MAX_VERTEX_ATTRIBS)),
        renderer: debugInfo ? parameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
        vendor: debugInfo ? parameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        antialias: attributes.antialias === true,
        pixelRatio: typeof globalThis.devicePixelRatio === 'number' ? globalThis.devicePixelRatio : 1,
        viewportWidth: canvas?.clientWidth || null, viewportHeight: canvas?.clientHeight || null
      }};
    } catch { return browserUnavailable('webgl_context_error'); }
  }
}
function finiteOrNull(value) { return Number.isFinite(value) ? value : null; }
function browserUnavailable(reason) { return { available: false, status: reason, webgl: null }; }
function unavailable(reason) { return { available: false, status: reason, profile: null }; }
export function isHardwareProfile(value) {
  return Boolean(value && typeof value === 'object' &&
    value.metadata?.contract_id === 'glb-viewer.hardware-profile' &&
    typeof value.metadata.contract_version === 'string' &&
    value.cpu && typeof value.cpu === 'object' &&
    value.memory && typeof value.memory === 'object' && Array.isArray(value.gpus));
}