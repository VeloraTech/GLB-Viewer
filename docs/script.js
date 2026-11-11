import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  // The current v1.0.0 release has no attached installer assets.
  // Link to the real release page rather than inventing download filenames.
  const releasePage = 'https://github.com/VeloraTech/GLB-Viewer/releases/download/v1.0.2/GLB-Viewer-Setup-v1.0.2.exe';
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
      downloadBtn.textContent = isMobile ? 'Choose a desktop platform' : (osKey === 'windows' ? 'View Windows release' : label);
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

    // Demo section: drag and drop GLB support
    const demoViewport = document.getElementById('demo-viewport');
    if (demoViewport) {
      // Prevent default drag behaviors on document (avoid about:blank#blocked navigation)
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        document.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });

      // Prevent default drag behaviors on viewport
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
          track('demo_drop', { extension: file.name.split('.').pop().toLowerCase() });
          loadDemoModel(file);
        }
      }, false);

      // Click to pick file via visible upload button
      const fileInput = document.getElementById('demo-file-input');
      if (fileInput) {
        // Use a real label/input activation instead of a scripted click. This is
        // more reliable with Android browser file pickers and preserves user activation.
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          const extension = file.name.split('.').pop().toLowerCase();
          if (extension !== 'glb' && extension !== 'gltf') {
            showDemoError('Please choose a .glb or .gltf model file.');
            fileInput.value = '';
            return;
          }

          track('demo_pick', { extension });
          loadDemoModel(file);

          // Clear after starting the load so the same file can be selected again.
          fileInput.value = '';
        });
      }
    }

    function showDemoError(message) {
      const container = document.getElementById('demo-viewport');
      if (container) {
        container.innerHTML = '';
        const notice = document.createElement('p');
        notice.textContent = message;
        notice.style.cssText = 'color:#ff6b6b;padding:20px;text-align:center;';
        container.appendChild(notice);
      }
    }

    function loadDemoModel(file) {
      const container = document.getElementById('demo-viewport');
      if (!container) return;

      let url;
      try {
        url = URL.createObjectURL(file);
      } catch (error) {
        console.error('Could not create a local URL for the selected model:', error);
        showDemoError('Your browser could not open this file. Try a GLB file in a current version of Chrome.');
        return;
      }

      // Clear existing content before rendering the selected model.
      while (container.firstChild) container.removeChild(container.firstChild);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f1115);

      const aspect = container.clientWidth / container.clientHeight || 16 / 9;
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
      camera.position.set(0, 1.5, 4);

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (error) {
        URL.revokeObjectURL(url);
        console.error('WebGL renderer initialization failed:', error);
        showDemoError('3D rendering is unavailable in this browser. Check that hardware acceleration and WebGL are enabled.');
        return;
      }

      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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
        URL.revokeObjectURL(url);
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
        URL.revokeObjectURL(url);
        console.error('Demo model load failed:', err);
        showDemoError('Failed to load this model. Use a valid GLB file and try again.');
      });
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
