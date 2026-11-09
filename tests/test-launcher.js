// Node.js test for test 5: Rust launcher opens Chrome on localhost 8000.
// Run: node tests/test-launcher.js

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const exe = path.join(__dirname, '..', 'launcher.exe');
const sample = path.join(__dirname, '..', 'sample', 'ring.glb');

let results = [];
const pass = (name) => { results.push(`PASS: ${name}`); console.log(`PASS: ${name}`); };
const fail = (name, err) => { results.push(`FAIL: ${name} — ${err}`); console.error(`FAIL: ${name}`, err); };

// Test 5a: launcher.exe exists and is a valid PE executable
try {
  if (!fs.existsSync(exe)) {
    fail('launcher.exe exists', `not found at ${exe}. Build it first: rustc launcher.rs -o launcher.exe`);
  } else {
    const buf = fs.readFileSync(exe);
    const magic = buf.slice(0, 2).toString('latin1');
    if (magic === 'MZ') {
      pass('launcher.exe exists and is a valid Windows executable');
    } else {
      fail('launcher.exe exists and is a valid Windows executable', 'not a valid PE executable');
    }
  }
} catch (e) {
  fail('launcher.exe exists', e.message);
}

// Test 5b: launcher binds port 8000 and serves viewer.html
(async () => {
  if (!fs.existsSync(exe)) {
    console.log('\nSkipping port test — launcher.exe not found.');
    printSummary();
    return;
  }

  // Start launcher with the sample GLB file
  const child = spawn(exe, [sample], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  let stdout = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stdout += d.toString(); });

  // Wait for the server to start listening (up to 5 seconds)
  const serverReady = await new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (stdout.includes('Server listening on http://127.0.0.1:8000')) resolve(true);
      else if (Date.now() - start > 5000) resolve(false);
      else setTimeout(check, 100);
    };
    check();
  });

  if (!serverReady) {
    fail('launcher binds port 8000', 'server did not start within 5 seconds');
    child.kill();
    printSummary();
    return;
  }

  // Try to fetch viewer.html from localhost:8000
  const fetchOK = await new Promise((resolve) => {
    http.get('http://127.0.0.1:8000/viewer.html', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve(res.statusCode === 200 && data.includes('<html'));
      });
    }).on('error', () => resolve(false));
  });

  if (fetchOK) {
    pass('launcher serves viewer.html on localhost:8000');
  } else {
    fail('launcher serves viewer.html on localhost:8000', 'could not fetch viewer.html');
  }

  // Clean up: kill the launcher process
  try { child.kill(); } catch (e) {}

  printSummary();
})();

function printSummary() {
  console.log('\n--- Test Summary ---');
  results.forEach(r => console.log(r));
  const failures = results.filter(r => r.startsWith('FAIL'));
  console.log(`\n${results.length - failures.length}/${results.length} passed`);
  if (failures.length > 0) {
    console.error(`${failures.length} test(s) failed`);
    process.exit(1);
  }
}
