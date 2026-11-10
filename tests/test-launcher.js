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

(async () => {
  if (!fs.existsSync(exe)) { fail('launcher executable exists', 'Build launcher.exe first'); return summary(); }
  if (fs.readFileSync(exe).subarray(0, 2).toString() !== 'MZ') { fail('valid Windows executable', 'Missing PE signature'); return summary(); }
  pass('launcher executable exists');

  const child = spawn(exe, [sample], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GLB_VIEWER_TEST: '1' }
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });

  try {
    const port = await new Promise(resolve => {
      const started = Date.now();
      const poll = () => {
        const marker = 'Server listening on http://127.0.0.1:';
        const position = output.indexOf(marker);
        if (position !== -1) {
          const value = Number(output.slice(position + marker.length).split(/[\r\n]/, 1)[0]);
          resolve(Number.isInteger(value) && value > 0 ? value : null);
        } else if (Date.now() - started > 8000) {
          resolve(null);
        } else {
          setTimeout(poll, 100);
        }
      };
      poll();
    });

    if (!port) {
      fail('local server starts', output || 'No startup message');
      return summary();
    }
    pass('local server starts on an available port');

    const get = route => new Promise(resolve => {
      http.get({ hostname: '127.0.0.1', port, path: route }, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
      }).on('error', () => resolve({ status: 0, body: Buffer.alloc(0) }));
    });

    // Use raw TCP for traversal: Node's URL/HTTP client normalizes ../ before sending it.
    const rawGet = requestTarget => new Promise(resolve => {
      const socket = net.connect(port, '127.0.0.1', () => {
        socket.write(
          `GET ${requestTarget} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`
        );
      });
      const chunks = [];
      socket.on('data', chunk => chunks.push(chunk));
      socket.on('end', () => {
        const response = Buffer.concat(chunks).toString('latin1');
        const status = Number(response.match(/^HTTP\/1\.1 (\d{3})/)?.[1] || 0);
        resolve({ status, response });
      });
      socket.on('error', () => resolve({ status: 0, response: '' }));
    });

    const page = await get('/viewer.html?open=1');
    if (page.status === 200 && page.body.toString().includes('GLB Viewer')) pass('serves viewer page');
    else fail('serves viewer page', `HTTP ${page.status}`);

    const model = await get('/__model');
    if (model.status === 200 && model.body.equals(fs.readFileSync(sample))) pass('serves exact selected model bytes');
    else fail('serves selected model', `HTTP ${model.status}, ${model.body.length} bytes`);

    const traversal = await rawGet('/../launcher.rs');
    if (traversal.status === 403) pass('blocks literal parent-directory traversal');
    else fail('blocks literal parent-directory traversal', `HTTP ${traversal.status}`);

    const encodedTraversal = await rawGet('/%2e%2e/launcher.rs');
    if (encodedTraversal.status !== 200) pass('does not expose files through encoded traversal');
    else fail('does not expose files through encoded traversal', `HTTP ${encodedTraversal.status}`);
  } finally {
    child.kill();
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
