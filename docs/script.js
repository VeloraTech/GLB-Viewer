import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  // GitHub Releases remains the source of truth for the current Windows installer.
  const releasePage = 'https://github.com/VeloraTech/GLB-Viewer/releases/latest/download/GLB-Viewer-Setup.exe';
  const platformGuide = 'https://github.com/VeloraTech/GLB-Viewer/blob/main/PLATFORM_SUPPORT.md';
  const releases = {
    windows: releasePage,
    mac: platformGuide,
    linux: platformGuide,
  };

  const labelMap = {
    windows: 'Download for Windows',
    mac: 'View Mac browser support',
    linux: 'View Linux browser support',
    android: 'View desktop downloads',
    ios: 'View desktop downloads',
  };

  // Check mobile user-agent tokens before platform hints: Android browsers may
  // expose a Linux-like platform value through userAgentData.
  function detectOS() {
    const ua = navigator.userAgent || '';
    const uaLower = ua.toLowerCase();

    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios';

    const platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
    if (platform.includes('windows') || uaLower.includes('windows')) return 'windows';
    if (platform.includes('mac') || uaLower.includes('macintosh')) return 'mac';
    if (platform.includes('linux') || uaLower.includes('linux')) return 'linux';
    return 'unknown';
  }

  function applyOS(osKey) {
    const navCta = document.querySelector('.nav-cta');
    const heroBtn = document.querySelector('.hero-actions .btn-primary');
    const osLabel = document.getElementById('os-detected');
    const downloadBtn = document.getElementById('dl-btn');
    const dlOsSelect = document.getElementById('dl-os');
    const isMobile = osKey === 'android' || osKey === 'ios';
    const isSupported = Object.prototype.hasOwnProperty.call(releases, osKey);
    const label = labelMap[osKey] || 'Choose a desktop download';
    const url = isSupported ? releases[osKey] : '#download';

    if (navCta) {
      navCta.textContent = isMobile ? 'View desktop options' : (osKey === 'windows' ? 'Download for Windows' : label);
      navCta.href = isMobile ? '#download' : url;
    }
    if (heroBtn) {
      heroBtn.textContent = isMobile ? 'View desktop downloads' : (osKey === 'windows' ? 'Download for Windows' : label);
      heroBtn.href = isMobile ? '#download' : url;
    }
    if (downloadBtn) {
      downloadBtn.textContent = isMobile ? 'Choose a desktop platform' : (osKey === 'windows' ? 'Download for Windows' : label);
      downloadBtn.href = isMobile ? '#dl-other' : url;
      if (!downloadBtn.querySelector('span')) downloadBtn.insertAdjacentHTML('beforeend', ' <span aria-hidden="true">↗</span>');
    }
    if (osLabel) {
      osLabel.textContent = isMobile
        ? 'No installation package is currently available for ' + (osKey === 'ios' ? 'iOS' : 'Android') + '. You can still choose a Windows, macOS, or Linux download below.'
        : (osKey === 'unknown'
          ? 'Could not identify your operating system. Choose a desktop download below.'
          : 'Detected OS: ' + osKey.charAt(0).toUpperCase() + osKey.slice(1));
    }
    if (dlOsSelect && isSupported) dlOsSelect.value = osKey;
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

    // Browser demo: show a lightweight bundled sample first, then replace it with local user files.
    const demoViewport = document.getElementById('demo-viewport');
    const demoStatus = document.getElementById('demo-preview-status');
    let demoRenderer = null;
    let demoScene = null;
    let demoCamera = null;
    let demoControls = null;
    let demoModel = null;
    let demoFrame = 0;
    let demoResizeObserver = null;
    let demoInitialized = false;
    const demoLoader = new GLTFLoader();

    function setDemoStatus(message, hidden = false, busy = true) {
      if (!demoStatus) return;
      demoStatus.querySelector('span:last-child').textContent = message;
      demoStatus.hidden = hidden;
      if (demoViewport) demoViewport.setAttribute('aria-busy', String(busy));
    }

    function disposeDemoTree(root) {
      if (!root) return;
      const geometries = new Set(), materials = new Set(), textures = new Set();
      root.traverse((node) => {
        if (node.geometry) geometries.add(node.geometry);
        const list = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of list) {
          if (!material) continue;
          materials.add(material);
          for (const value of Object.values(material)) {
            if (value && value.isTexture) textures.add(value);
          }
        }
      });
      textures.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      geometries.forEach((item) => item.dispose());
    }

    function initDemo() {
      if (!demoViewport || demoInitialized) return;
      demoInitialized = true;
      try {
        demoScene = new THREE.Scene();
        demoScene.background = new THREE.Color(0x111318);
        demoCamera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
        demoCamera.position.set(0, 0, 4);
        demoRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
        demoRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        demoRenderer.outputColorSpace = THREE.SRGBColorSpace;
        demoViewport.appendChild(demoRenderer.domElement);
        demoScene.add(new THREE.HemisphereLight(0xffffff, 0x555566, 1.6));
        const key = new THREE.DirectionalLight(0xffffff, 2);
        key.position.set(3, 5, 4);
        demoScene.add(key);
        demoControls = new OrbitControls(demoCamera, demoRenderer.domElement);
        demoControls.enableDamping = true;
        demoControls.dampingFactor = 0.06;
        demoControls.minDistance = 0.2;
        demoControls.maxDistance = 100;
        const resize = () => {
          if (!demoRenderer || !demoCamera) return;
          const width = Math.max(demoViewport.clientWidth, 1);
          const height = Math.max(demoViewport.clientHeight, 1);
          demoCamera.aspect = width / height;
          demoCamera.updateProjectionMatrix();
          demoRenderer.setSize(width, height, false);
        };
        if ('ResizeObserver' in window) {
          demoResizeObserver = new ResizeObserver(resize);
          demoResizeObserver.observe(demoViewport);
        } else {
          window.addEventListener('resize', resize, { passive: true });
        }
        resize();
        const render = () => {
          demoFrame = requestAnimationFrame(render);
          demoControls.update();
          demoRenderer.render(demoScene, demoCamera);
        };
        render();
        loadDemoSource('https://raw.githubusercontent.com/VeloraTech/GLB-Viewer/main/sample/ring.glb', 'Loading sample ring…');
      } catch (error) {
        console.error('Could not initialize the 3D preview:', error);
        setDemoStatus('Interactive preview unavailable. You can still choose a GLB or glTF file.', false, false);
      }
    }

    function fitDemoModel(model) {
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.position.sub(center);
      const distance = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(demoCamera.fov) / 2))) * 1.7;
      demoCamera.position.set(0, 0, distance);
      demoCamera.near = Math.max(distance / 1000, 0.001);
      demoCamera.far = Math.max(distance * 100, 100);
      demoCamera.updateProjectionMatrix();
      demoControls.target.set(0, 0, 0);
      demoControls.minDistance = Math.max(maxDim * 0.15, 0.05);
      demoControls.maxDistance = maxDim * 30;
      demoControls.update();
    }

    function loadDemoSource(source, loadingText = 'Loading your model…') {
      if (!demoScene) initDemo();
      if (!demoScene) return;
      setDemoStatus(loadingText);
      demoLoader.load(source, (gltf) => {
        const nextModel = gltf.scene;
        demoScene.add(nextModel);
        fitDemoModel(nextModel);
        const previous = demoModel;
        demoModel = nextModel;
        if (previous) {
          demoScene.remove(previous);
          disposeDemoTree(previous);
        }
        setDemoStatus('', true);
      }, undefined, (error) => {
        console.error('Demo model load failed:', error);
        setDemoStatus('Sample preview could not load. Choose a GLB or glTF file to try the viewer.', false, false);
      });
    }

    function loadDemoModel(file) {
      if (!demoScene) initDemo();
      if (!demoScene) return;
      const url = URL.createObjectURL(file);
      setDemoStatus('Loading ' + file.name + '…');
      demoLoader.load(url, (gltf) => {
        URL.revokeObjectURL(url);
        const nextModel = gltf.scene;
        demoScene.add(nextModel);
        fitDemoModel(nextModel);
        const previous = demoModel;
        demoModel = nextModel;
        if (previous) {
          demoScene.remove(previous);
          disposeDemoTree(previous);
        }
        setDemoStatus('', true);
      }, undefined, (error) => {
        URL.revokeObjectURL(url);
        console.error('Demo model load failed:', error);
        setDemoStatus('Could not load this model. Check that it is a valid GLB or glTF file.', false, false);
      });
    }

    if (demoViewport) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((name) => {
        demoViewport.addEventListener(name, (event) => { event.preventDefault(); event.stopPropagation(); });
      });
      demoViewport.addEventListener('dragenter', () => demoViewport.classList.add('drag-over'));
      demoViewport.addEventListener('dragleave', () => demoViewport.classList.remove('drag-over'));
      demoViewport.addEventListener('drop', (event) => {
        demoViewport.classList.remove('drag-over');
        const file = event.dataTransfer?.files?.[0];
        if (file && /\.(glb|gltf)$/i.test(file.name)) loadDemoModel(file);
      });
      const fileInput = document.getElementById('demo-file-input');
      fileInput?.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!/\.(glb|gltf)$/i.test(file.name)) setDemoStatus('Please choose a .glb or .gltf file.', true);
        else loadDemoModel(file);
        fileInput.value = '';
      });
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            initDemo();
          }
        }, { rootMargin: '250px 0px' });
        observer.observe(demoViewport);
      } else {
        initDemo();
      }
      window.addEventListener('pagehide', () => {
        if (demoFrame) cancelAnimationFrame(demoFrame);
        demoResizeObserver?.disconnect();
        demoControls?.dispose();
        if (demoModel) disposeDemoTree(demoModel);
        demoRenderer?.dispose();
      }, { once: true });
    }

  // Compact mobile navigation with keyboard and touch support.
  const menuButton = document.querySelector('.mobile-menu-btn');
  const primaryNavigation = document.getElementById('primary-navigation');
  if (menuButton && primaryNavigation) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      primaryNavigation.classList.remove('is-open');
    };

    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      primaryNavigation.classList.toggle('is-open', !isOpen);
    });

    primaryNavigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (!primaryNavigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  // Reveal content as it enters the viewport. Keep all content visible when
  // IntersectionObserver is unavailable or reduced motion is requested.
  const navWrap = document.querySelector('.nav-wrap');
  const revealItems = document.querySelectorAll('[data-reveal]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (navWrap) {
    const updateNav = () => navWrap.classList.toggle('is-scrolled', window.scrollY > 12);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach((item, index) => {
      item.style.setProperty('--reveal-delay', (index % 4) * 75 + 'ms');
      revealObserver.observe(item);
    });
  }

  })();
