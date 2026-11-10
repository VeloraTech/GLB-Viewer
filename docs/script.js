import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  // Placeholder Release URLs (replace with real GitHub Releases links)
  const releases = {
    windows: 'https://github.com/VeloraTech/GLB-Viewer/releases/latest/download/glb-viewer-windows.exe',
    mac: 'https://github.com/VeloraTech/GLB-Viewer/releases/latest/download/glb-viewer-mac.dmg',
    linux: 'https://github.com/VeloraTech/GLB-Viewer/releases/latest/download/glb-viewer-linux.AppImage',
  };

  const labelMap = {
    windows: 'Download for Windows',
    mac: 'Download for Mac',
    linux: 'Download for Linux',
  };

  // Detect OS using navigator.userAgentData or userAgent fallback
  function detectOS() {
    const uaData = navigator.userAgentData;
    if (uaData && uaData.platform) {
      const p = uaData.platform.toLowerCase();
      if (p.includes('windows')) return 'windows';
      if (p.includes('mac')) return 'mac';
      if (p.includes('linux')) return 'linux';
      if (p.includes('android')) return 'linux';
    }
    const uaLower = navigator.userAgent.toLowerCase();
    if (uaLower.includes('mac')) return 'mac';
    if (uaLower.includes('linux')) return 'linux';
    if (uaLower.includes('windows')) return 'windows';
    if (uaLower.includes('android')) return 'linux';
    if (uaLower.includes('iphone') || uaLower.includes('ipad')) return 'mac';
    return 'windows';
  }

  function applyOS(osKey) {
    const navCta = document.querySelector('.nav-cta');
    const heroBtn = document.querySelector('.hero-actions .btn-primary');
    const osLabel = document.getElementById('os-detected');
    const dlOsSelect = document.getElementById('dl-os');

    const label = labelMap[osKey] || 'Download';
    const url = releases[osKey] || releases.windows;

    if (navCta) {
      navCta.textContent = label;
      navCta.href = url;
    }
    if (heroBtn) {
      heroBtn.textContent = label;
      heroBtn.href = url;
    }
    if (osLabel) osLabel.textContent = 'Detected OS: ' + osKey.charAt(0).toUpperCase() + osKey.slice(1);
    if (dlOsSelect) dlOsSelect.value = osKey;
  }

  const detected = detectOS();
  applyOS(detected);

  // Dropdown handler for "choose another OS"
  const dlCustom = document.getElementById('dl-custom');
  const dlOsSelect = document.getElementById('dl-os');
  if (dlCustom && dlOsSelect) {
    dlCustom.addEventListener('click', () => {
      applyOS(dlOsSelect.value);
    });
  }

  // Privacy-friendly analytics placeholder (anonymous only)
  function track(eventName, props) {
    // Placeholder: send to Plausible / Umami. Anonymous only.
    // Never track file names, file sizes, or models.
    console.log('[analytics]', eventName, props);
  }

  track('page_view', { os: detected });

  // Track download clicks on primary buttons
  document.querySelectorAll('.btn-primary').forEach((btn) => {
    btn.addEventListener('click', () => track('download_clicked', { os: detected }));
  });

    // Demo section: drag and drop GLB support
    const demoViewport = document.getElementById('demo-viewport');
    if (demoViewport) {
      // Prevent default drag behaviors (avoid about:blank#blocked navigation)
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        demoViewport.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });

      demoViewport.addEventListener('dragenter', () => {
        demoViewport.classList.add('drag-over');
      }, false);

      demoViewport.addEventListener('dragleave', () => {
        demoViewport.classList.remove('drag-over');
      }, false);

      demoViewport.addEventListener('drop', (e) => {
        demoViewport.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf') || file.type.includes('model'))) {
          track('demo_drop', { file: file.name });
          loadDemoModel(file);
        }
      }, false);

      // Click to pick file
      demoViewport.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.glb,.gltf';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            track('demo_pick', { file: file.name });
            loadDemoModel(file);
          }
        };
        input.click();
      });
    }

    function loadDemoModel(file) {
      const url = URL.createObjectURL(file);
      const container = document.getElementById('demo-viewport');

      // Clear existing
      while (container.firstChild) container.removeChild(container.firstChild);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f1115);

      const aspect = container.clientWidth / container.clientHeight || 16 / 9;
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
      camera.position.set(0, 1.5, 4);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambient);

      const dir = new THREE.DirectionalLight(0xffffff, 1.5);
      dir.position.set(3, 5, 4);
      scene.add(dir);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      const loader = new GLTFLoader();
      loader.load(url, (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.8;

        model.position.sub(center);
        camera.position.set(0, 0, cameraZ);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();

        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
          camera.aspect = container.clientWidth / container.clientHeight || 16 / 9;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        });
      }, undefined, (err) => {
        console.error('Demo model load failed:', err);
        container.innerHTML = '<p style="color:#ff6b6b;padding:20px;text-align:center;">Failed to load model. Try another file.</p>';
      });
    }
  })();
