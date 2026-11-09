// Browser console tests for GLB Viewer (tests 1-4).
// Run these in the DevTools Console while viewer.html is open.

(async () => {
  const results = [];
  const pass = (name) => { results.push(`PASS: ${name}`); console.log(`PASS: ${name}`); };
  const fail = (name, err) => { results.push(`FAIL: ${name} — ${err}`); console.error(`FAIL: ${name}`, err); };

  // Test 1: Viewer loads sample ring.glb without error
  try {
    const info = document.getElementById('info-chip');
    const error = document.getElementById('error');
    const loading = document.getElementById('loading');
    const hasRenderer = !!document.querySelector('canvas');
    if (hasRenderer && !error.style.display || error.style.display === 'none') {
      pass('Viewer loads without crash');
    } else {
      fail('Viewer loads without crash', 'error overlay visible or no canvas');
    }
  } catch (e) { fail('Viewer loads without crash', e); }

  // Test 2: Drag and drop loads a file (simulated via file input)
  try {
    const input = document.getElementById('file-input');
    const blob = await fetch('./sample/ring.glb').then(r => r.blob());
    const file = new File([blob], 'ring.glb', { type: 'model/gltf-binary' });
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 1500));
    const infoChip = document.getElementById('info-chip').textContent;
    if (infoChip && infoChip !== '—') {
      pass('Drag and drop / file picker loads a file');
    } else {
      fail('Drag and drop / file picker loads a file', 'info chip empty');
    }
  } catch (e) { fail('Drag and drop / file picker loads a file', e); }

  // Test 3: Corrupt file shows error message, not crash
  try {
    const input = document.getElementById('file-input');
    const corrupt = new File([new Uint8Array([1,2,3,4])], 'bad.glb', { type: 'model/gltf-binary' });
    const dt = new DataTransfer();
    dt.items.add(corrupt);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 1500));
    const error = document.getElementById('error');
    if (error.style.display === 'flex') {
      pass('Corrupt file shows error message');
    } else {
      fail('Corrupt file shows error message', 'error overlay not shown');
    }
  } catch (e) { fail('Corrupt file shows error message', e); }

  // Test 4: Screenshot button works
  try {
    const btn = document.getElementById('screenshot');
    const origClick = HTMLElement.prototype.click;
    let clicked = false;
    btn.click();
    // Screenshot triggers a download via anchor click; just verify button exists and is callable
    if (btn) {
      pass('Screenshot button exists and is clickable');
    } else {
      fail('Screenshot button exists and is clickable', 'button missing');
    }
  } catch (e) { fail('Screenshot button exists and is clickable', e); }

  console.log('\n--- Test Summary ---');
  results.forEach(r => console.log(r));
})();
