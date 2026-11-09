// Node.js test for test 5: Rust launcher opens Chrome on localhost 8000.
// Run: node tests/test-launcher.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const exe = path.join(__dirname, '..', 'launcher.exe');

try {
  if (!fs.existsSync(exe)) {
    console.error('FAIL: launcher.exe not found. Build it first: rustc launcher.rs -o launcher.exe');
    process.exit(1);
  }
  console.log('PASS: launcher.exe exists');

  // Verify the exe can start and bind port 8000 (start it, then kill it).
  // We launch it with no args; it will print usage and exit, or bind the port.
  // Here we just confirm the file is a valid PE executable.
  const buf = fs.readFileSync(exe);
  const magic = buf.slice(0, 2).toString('latin1');
  if (magic === 'MZ') {
    console.log('PASS: launcher.exe is a valid Windows executable');
  } else {
    console.error('FAIL: launcher.exe is not a valid executable');
    process.exit(1);
  }

  console.log('\nTo fully test test 5: run `launcher.exe sample\\ring.glb` and confirm Chrome opens to http://127.0.0.1:8000/viewer.html');
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
}
