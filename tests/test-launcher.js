const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const exe = path.join(__dirname, '..', 'launcher.exe');
const sample = path.join(__dirname, '..', 'sample', 'ring.glb');
const results = [];
const pass = name => { results.push(true); console.log('PASS:', name); };
const fail = (name, error) => { results.push(false); console.error('FAIL:', name, error); };

(async () => {
  if (!fs.existsSync(exe)) { fail('launcher executable exists', 'Build launcher.exe first'); return summary(); }
  if (fs.readFileSync(exe).subarray(0, 2).toString() !== 'MZ') { fail('valid Windows executable', 'Missing PE signature'); return summary(); }
  pass('launcher executable exists');

  const child = spawn(exe, [sample], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  const port = await new Promise(resolve => {
    const started = Date.now();
    const poll = () => {
      const match = output.match(/127\\.0\\.0\\.1:(\\d+)/);
      if (match) resolve(Number(match[1]));
      else if (Date.now() - started > 8000) resolve(null);
      else setTimeout(poll, 100);
    };
    poll();
  });
  if (!port) { fail('local server starts', output || 'No startup message'); child.kill(); return summary(); }
  pass('local server starts on an available port');

  const get = route => new Promise(resolve => {
    http.get(`http://127.0.0.1:${port}${route}`, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
    }).on('error', () => resolve({ status: 0, body: Buffer.alloc(0) }));
  });
  const page = await get('/viewer.html?open=1');
  if (page.status === 200 && page.body.toString().includes('GLB Viewer')) pass('serves viewer page');
  else fail('serves viewer page', `HTTP ${page.status}`);
  const model = await get('/__model');
  if (model.status === 200 && model.body.length === fs.statSync(sample).size) pass('serves exact selected model bytes');
  else fail('serves selected model', `HTTP ${model.status}, ${model.body.length} bytes`);
  const traversal = await get('/../launcher.rs');
  if (traversal.status === 403 || traversal.status === 404) pass('blocks parent-directory paths');
  else fail('blocks parent-directory paths', `HTTP ${traversal.status}`);
  child.kill();
  summary();
})();

function summary() {
  const passed = results.filter(Boolean).length;
  console.log(`\\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exitCode = 1;
}
