/* Independent viewer shell: this file intentionally has no ES-module dependencies. */
(() => {
  const state = { failed: false };
  function showBootstrapFailure(message) {
    if (window.__GLB_VIEWER_BOOTED__ || state.failed) return;
    state.failed = true;
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
      loading.style.display = 'none';
    }
    const error = document.getElementById('error');
    if (error) {
      error.style.display = 'none';
      error.style.pointerEvents = 'none';
    }
    let notice = document.getElementById('viewer-bootstrap-error');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'viewer-bootstrap-error';
      notice.setAttribute('role', 'alert');
      notice.style.cssText = 'position:fixed;left:12px;top:58px;z-index:200;max-width:min(560px,calc(100vw - 24px));padding:12px 14px;border:1px solid rgba(255,120,120,.45);border-radius:8px;background:#282326;color:#fff;font:13px/1.5 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35);pointer-events:auto';
      document.body.appendChild(notice);
    }
    notice.textContent = 'Viewer tools could not finish initializing. ' + message + ' Check %LOCALAPPDATA%\\GLBViewer\\launcher.log for missing or failed local assets.';
    console.error('[GLB Viewer bootstrap]', message, { filename: window.__GLB_VIEWER_LAST_ERROR__ || null });
  }
  window.addEventListener('error', event => {
    const target = event.target;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      const assetUrl = target.src || target.href || '';
      // Browsers request /favicon.ico automatically; it is intentionally not a required viewer asset.
      if (assetUrl && new URL(assetUrl, window.location.href).pathname === '/favicon.ico') return;
      // Third-party icon CDN failures must never disable the local application.
      if (assetUrl && new URL(assetUrl, window.location.href).origin !== window.location.origin) return;
      if (assetUrl) showBootstrapFailure('A required local application file failed to load: ' + assetUrl);
      return;
    }
    if (event.error) {
      window.__GLB_VIEWER_LAST_ERROR__ = event.filename || '';
      showBootstrapFailure((event.error.message || 'An application startup error occurred.') +
        (event.filename ? ' (' + event.filename + ')' : ''));
    }
  }, true);
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const detail = reason?.stack || reason?.message || String(reason || 'An application startup task failed.');
    showBootstrapFailure(detail);
  });
  document.addEventListener('click', event => {
    if (window.__GLB_VIEWER_BOOTED__) return;
    const button = event.target.closest?.('[data-workspace]');
    if (!button) return;
    const name = button.dataset.workspace;
    const shell = document.getElementById('workspace-main');
    const content = document.getElementById('workspace-content');
    if (!shell || !content) return;
    const views = [...content.querySelectorAll('.workspace-view')];
    const selected = views.find(view => view.dataset.view === name);
    if (!selected) return;
    shell.hidden = false;
    shell.style.display = 'flex';
    views.forEach(view => { view.hidden = view !== selected; });
    const heading = shell.querySelector('#workspace-header h2');
    if (heading) heading.textContent = name[0].toUpperCase() + name.slice(1);
    button.classList.add('active');
    document.querySelectorAll('[data-workspace]').forEach(item => {
      if (item !== button) item.classList.remove('active');
    });
  });
})();
