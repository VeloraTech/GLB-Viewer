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
    notice.textContent = 'Viewer tools could not finish initializing. Your workspace navigation is still available. ' + message;
    console.error('[GLB Viewer bootstrap]', message);
  }
  window.addEventListener('error', event => {
    const target = event.target;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      showBootstrapFailure('A required application file failed to load: ' + (target.src || target.href || 'unknown asset'));
      return;
    }
    if (event.error) showBootstrapFailure(event.error.message || 'An application startup error occurred.');
  }, true);
  window.addEventListener('unhandledrejection', event => {
    showBootstrapFailure(event.reason?.message || 'An application startup task failed.');
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
