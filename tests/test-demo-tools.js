const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'docs', 'script.js'), 'utf8');
const desktopViewer = fs.readFileSync(path.join(root, 'viewer.html'), 'utf8');
const moduleBody = script.replace(/^import\s+.*?;\s*$/gm, '');

new vm.Script(moduleBody, { filename: 'docs/script.js' });

if (desktopViewer.includes('<ion-icon') ||
    desktopViewer.includes('ionicons@') ||
    desktopViewer.includes('unpkg.com/ionicons') ||
    desktopViewer.includes('cdn.jsdelivr.net/npm/ionicons') ||
    !desktopViewer.includes('class="workspace-icon"')) {
  throw new Error('Desktop viewer icons must be local and must not depend on remote Ionicons assets.');
}


const tools = ['scene', 'objects', 'transform', 'lighting', 'materials', 'inspect', 'plugins'];
for (const tool of tools) {
  if (!html.includes('data-demo-tool="' + tool + '"')) {
    throw new Error('Demo sidebar is missing its ' + tool + ' control.');
  }
}
for (const feature of ['renderDemoTool', 'demoStats', 'demoMaterials', 'demoRange']) {
  if (!script.includes('function ' + feature + '(')) {
    throw new Error('Demo sidebar is missing ' + feature + '().');
  }
}
const sourceLoader = script.slice(script.indexOf('function loadDemoSource'), script.indexOf('function loadDemoModel'));
if (sourceLoader.includes('file.name')) {
  throw new Error('Sample loader references a file variable that does not exist.');
}
if (!script.includes('demoModelName = file.name;')) {
  throw new Error('User-selected model names are not reflected in the demo tools.');
}
console.log('PASS: demo sidebar controls, tool handlers, and model loaders');
