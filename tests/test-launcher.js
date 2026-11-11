const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');

const exe = path.join(__dirname, '..', 'launcher.exe');
const sample = path.join(__dirname, '..', 'sample', 'ring.glb');
const results = [];
const pass = name => { results.push(true); console.log('PASS:', name); };
const fail = (name, error) => { results.push(false); console.error('FAIL:', name, error); };

function waitForPort(child, outputRef, timeoutMs = 8000) {
  return new Promise(resolve => {
    const started = Date.now();
    const poll = () => {
      const marker = 'Server listening on http://127.0.0.1:';
      const position = outputRef.value.indexOf(marker);
      if (position !== -1) {
        const value = Number(outputRef.value.slice(position + marker.length).split(/[\r\n]/, 1)[0]);
        resolve(Number.isInteger(value) && value > 0 ? value : null);
      } else if (child.exitCode !== null || Date.now() - started > timeoutMs) {
        resolve(null);
      } else {
        setTimeout(poll, 100);
      }
    };
    poll();
  });
}

function get(port, route) {
  return new Promise(resolve => {
    http.get({ hostname: '127.0.0.1', port, path: route }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
    }).on('error', () => resolve({ status: 0, body: Buffer.alloc(0) }));
  });
}

function rawGet(port, requestTarget) {
  return new Promise(resolve => {
    const socket = net.connect(port, '127.0.0.1', () => {
      socket.write(`GET ${requestTarget} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
    });
    const chunks = [];
    socket.on('data', chunk => chunks.push(chunk));
    socket.on('end', () => {
      const response = Buffer.concat(chunks).toString('latin1');
      resolve({ status: Number(response.match(/^HTTP\/1\.1 (\d{3})/)?.[1] || 0), response });
    });
    socket.on('error', () => resolve({ status: 0, response: '' }));
  });
}

(async () => {
  if (!fs.existsSync(exe)) { fail('launcher executable exists', 'Build launcher.exe first'); return summary(); }
  if (fs.readFileSync(exe).subarray(0, 2).toString() !== 'MZ') { fail('valid Windows executable', 'Missing PE signature'); return summary(); }
  pass('launcher executable exists');

  // Start menu / post-install launch: no model argument must open a usable viewer.
  const standalone = spawn(exe, [], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GLB_VIEWER_TEST: '1' } });
  const standaloneOutput = { value: '' };
  standalone.stdout.on('data', chunk => { standaloneOutput.value += chunk.toString(); });
  standalone.stderr.on('data', chunk => { standaloneOutput.value += chunk.toString(); });
  try {
    const port = await waitForPort(standalone, standaloneOutput);
    if (!port) fail('standalone launcher starts without a model', standaloneOutput.value || 'No startup message');
    else {
      pass('standalone launcher starts without a model');
      const page = await get(port, '/viewer.html?standalone=1');
      if (page.status === 200 && page.body.toString().includes('GLB Viewer')) pass('standalone mode serves viewer page');
      else fail('standalone mode serves viewer page', `HTTP ${page.status}`);
      const missingModel = await get(port, '/__model');
      if (missingModel.status === 404) pass('standalone mode does not pretend a model was supplied');
      else fail('standalone mode model endpoint', `HTTP ${missingModel.status}`);
      const heartbeat = await get(port, '/__heartbeat');
      if (heartbeat.status === 204) pass('viewer heartbeat renews the session');
      else fail('viewer heartbeat renews the session', `HTTP ${heartbeat.status}`);
    }
  } finally {
    standalone.kill();
  }

  // Open With: the selected model must be served byte-for-byte.
  const child = spawn(exe, [sample], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GLB_VIEWER_TEST: '1' } });
  const output = { value: '' };
  child.stdout.on('data', chunk => { output.value += chunk.toString(); });
  child.stderr.on('data', chunk => { output.value += chunk.toString(); });

  try {
    const port = await waitForPort(child, output);
    if (!port) {
      fail('local server starts for selected model', output.value || 'No startup message');
      return summary();
    }
    pass('local server starts on an available port');

    const page = await get(port, '/viewer.html?open=1');
    if (page.status === 200 && page.body.toString().includes('GLB Viewer')) pass('serves viewer page');
    else fail('serves viewer page', `HTTP ${page.status}`);

    const model = await get(port, '/__model');
    if (model.status === 200 && model.body.equals(fs.readFileSync(sample))) pass('serves exact selected model bytes');
    else fail('serves selected model', `HTTP ${model.status}, ${model.body.length} bytes`);

    const traversal = await rawGet(port, '/../launcher.rs');
    if (traversal.status === 403) pass('blocks literal parent-directory traversal');
    else fail('blocks literal parent-directory traversal', `HTTP ${traversal.status}`);

    const encodedTraversal = await rawGet(port, '/%2e%2e/launcher.rs');
    if (encodedTraversal.status !== 200) pass('does not expose files through encoded traversal');
    else fail('does not expose files through encoded traversal', `HTTP ${encodedTraversal.status}`);
  } finally {
    child.kill();
  }

  // In test mode the idle lease is deliberately short. No further heartbeat
  // should leave the process alive indefinitely after its viewer is gone.
  const expiring = spawn(exe, [], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GLB_VIEWER_TEST: '1' } });
  const expiryOutput = { value: '' };
  expiring.stdout.on('data', chunk => { expiryOutput.value += chunk.toString(); });
  expiring.stderr.on('data', chunk => { expiryOutput.value += chunk.toString(); });
  const expiryPort = await waitForPort(expiring, expiryOutput);
  if (!expiryPort) {
    fail('idle-session test server starts', expiryOutput.value || 'No startup message');
    expiring.kill();
  } else {
    const exitCode = await new Promise(resolve => {
      const timer = setTimeout(() => { expiring.kill(); resolve(null); }, 6000);
      expiring.once('exit', code => { clearTimeout(timer); resolve(code); });
    });
    if (exitCode === 0) pass('launcher exits after the viewer heartbeat expires');
    else fail('launcher exits after the viewer heartbeat expires', `Exit code: ${exitCode}`);
  }

  summary();
})().catch(error => {
  fail('launcher integration test', error.stack || error.message);
  summary();
});

function summary() {
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exitCode = 1;
}
