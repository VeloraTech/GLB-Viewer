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
    let demoModelName = 'ring.glb';
    let demoAmbient = null;
    let demoKeyLight = null;
    let demoGrid = null;
    let demoAxes = null;
    const demoToolPanel = document.getElementById('demo-tool-panel');
    const demoToolPanelTitle = document.getElementById('demo-tool-panel-title');
    const demoToolPanelContent = document.getElementById('demo-tool-panel-content');
    const demoToolButtons = [...document.querySelectorAll('[data-demo-tool]')];
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
        demoAmbient = new THREE.HemisphereLight(0xffffff, 0x555566, 1.6);
        demoScene.add(demoAmbient);
        demoKeyLight = new THREE.DirectionalLight(0xffffff, 2);
        demoKeyLight.position.set(3, 5, 4);
        demoScene.add(demoKeyLight);
        demoGrid = new THREE.GridHelper(10, 20, 0x667080, 0x343b46);
        demoGrid.visible = false;
        demoScene.add(demoGrid);
        demoAxes = new THREE.AxesHelper(1.5);
        demoAxes.visible = false;
        demoScene.add(demoAxes);
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
        demoModelName = source.split('/').pop() || 'model.glb';
        if (previous) {
          demoScene.remove(previous);
          disposeDemoTree(previous);
        }
        setDemoStatus('', true);
        if (demoToolPanel && !demoToolPanel.hidden) renderDemoTool(demoToolPanel.dataset.tool || 'scene');
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
        demoModelName = file.name;
        if (previous) {
          demoScene.remove(previous);
          disposeDemoTree(previous);
        }
        setDemoStatus('', true);
        if (demoToolPanel && !demoToolPanel.hidden) renderDemoTool(demoToolPanel.dataset.tool || 'scene');
      }, undefined, (error) => {
        URL.revokeObjectURL(url);
        console.error('Demo model load failed:', error);
        setDemoStatus('Could not load this model. Check that it is a valid GLB or glTF file.', false, false);
      });
    }


    function demoNode(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function demoRange(parent, label, value, min, max, step, onInput) {
      const wrap = demoNode('label', 'demo-tool-field');
      const top = demoNode('span', 'demo-tool-field-label', label);
      const output = demoNode('output', '', String(value));
      const input = demoNode('input');
      input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = value;
      input.addEventListener('input', () => { output.value = input.value; onInput(Number(input.value)); });
      top.append(output); wrap.append(top, input); parent.append(wrap);
    }
    function demoMaterials() {
      const materials = new Set();
      demoModel?.traverse(node => {
        if (!node.isMesh || !node.material) return;
        (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
      });
      return [...materials];
    }
    function demoStats() {
      const stats = { objects: 0, meshes: 0, vertices: 0, triangles: 0 };
      demoModel?.traverse(node => {
        if (node.userData?.editorHelper) return;
        stats.objects++;
        if (node.isMesh && node.geometry) {
          stats.meshes++;
          const geometry = node.geometry;
          stats.vertices += geometry.attributes.position?.count || 0;
          stats.triangles += geometry.index ? geometry.index.count / 3 : (geometry.attributes.position?.count || 0) / 3;
        }
      });
      return stats;
    }
    function renderDemoTool(name) {
      if (!demoToolPanel || !demoToolPanelContent) return;
      const labels = { scene:'Scene', objects:'Objects / Outliner', transform:'Transform', lighting:'Lighting', materials:'Materials', inspect:'Inspect', plugins:'Plugins' };
      demoToolPanel.dataset.tool = name;
      demoToolPanelTitle.textContent = labels[name] || 'Viewer tools';
      demoToolPanelContent.replaceChildren();
      const note = text => demoToolPanelContent.append(demoNode('p','demo-tool-note',text));
      if (!demoModel) { note('Load a GLB or glTF model to use these tools.'); return; }
      if (name === 'scene') {
        demoToolPanelContent.append(demoNode('div','demo-tool-model-name',demoModelName));
        note('The model stays on your device. Nothing is uploaded.');
        const reset = demoNode('button','demo-tool-action','Reset view');
        reset.addEventListener('click',()=>fitDemoModel(demoModel));
        demoToolPanelContent.append(reset);
      } else if (name === 'objects') {
        demoModel.traverse(node => {
          if (node === demoModel || node.userData?.editorHelper) return;
          const row = demoNode('div','demo-object-row');
          const label = demoNode('span','',node.name || node.type || 'Object');
          const toggle = demoNode('button','demo-object-toggle',node.visible ? 'Hide' : 'Show');
          toggle.addEventListener('click',()=>{node.visible=!node.visible;toggle.textContent=node.visible?'Hide':'Show';});
          row.append(label,toggle); demoToolPanelContent.append(row);
        });
        if (!demoToolPanelContent.childElementCount) note('This model has no child objects to list.');
      } else if (name === 'transform') {
        ['x','y','z'].forEach(axis => demoRange(demoToolPanelContent,'Rotate '+axis.toUpperCase(),Math.round(THREE.MathUtils.radToDeg(demoModel.rotation[axis])),-180,180,1,value=>{demoModel.rotation[axis]=THREE.MathUtils.degToRad(value);}));
        demoRange(demoToolPanelContent,'Scale',Number(demoModel.scale.x.toFixed(2)),0.1,3,0.05,value=>demoModel.scale.setScalar(value));
        const reset=demoNode('button','demo-tool-action','Reset transform');
        reset.addEventListener('click',()=>{demoModel.rotation.set(0,0,0);demoModel.scale.setScalar(1);renderDemoTool('transform');});
        demoToolPanelContent.append(reset);
      } else if (name === 'lighting') {
        demoRange(demoToolPanelContent,'Environment light',demoAmbient.intensity,0,3,0.05,value=>{demoAmbient.intensity=value;});
        demoRange(demoToolPanelContent,'Key light',demoKeyLight.intensity,0,5,0.05,value=>{demoKeyLight.intensity=value;});
      } else if (name === 'materials') {
        const materials=demoMaterials();
        const colorLabel=demoNode('label','demo-tool-field');
        colorLabel.append(demoNode('span','demo-tool-field-label','Base color'));
        const color=demoNode('input'); color.type='color'; color.value='#'+(materials[0]?.color?.getHexString?.()||'cccccc');
        color.addEventListener('input',()=>materials.forEach(material=>{if(material.color)material.color.set(color.value);}));
        colorLabel.append(color); demoToolPanelContent.append(colorLabel);
        demoRange(demoToolPanelContent,'Metalness',materials[0]?.metalness??0.4,0,1,0.01,value=>materials.forEach(material=>{if('metalness' in material)material.metalness=value;}));
        demoRange(demoToolPanelContent,'Roughness',materials[0]?.roughness??0.4,0,1,0.01,value=>materials.forEach(material=>{if('roughness' in material)material.roughness=value;}));
        note('Material changes affect this preview only.');
      } else if (name === 'inspect') {
        const stats=demoStats();
        [['Objects',stats.objects],['Meshes',stats.meshes],['Vertices',stats.vertices.toLocaleString()],['Triangles',Math.round(stats.triangles).toLocaleString()]].forEach(([label,value])=>{
          const row=demoNode('div','demo-inspect-row'); row.append(demoNode('span','',label),demoNode('strong','',String(value))); demoToolPanelContent.append(row);
        });
      } else if (name === 'plugins') {
        note('Preview extensions');
        [['Grid overlay',demoGrid],['Axis helper',demoAxes]].forEach(([label,helper])=>{
          const wrap=demoNode('label','demo-tool-check'), input=demoNode('input');
          input.type='checkbox'; input.checked=helper.visible; input.addEventListener('change',()=>{helper.visible=input.checked;});
          wrap.append(input,document.createTextNode(label)); demoToolPanelContent.append(wrap);
        });
        note('These lightweight helpers run in the browser preview. The desktop viewer has the full editor workspace.');
      }
    }
    demoToolButtons.forEach(button=>button.addEventListener('click',()=>{
      const name=button.dataset.demoTool;
      const close=!demoToolPanel.hidden && demoToolPanel.dataset.tool===name;
      demoToolButtons.forEach(item=>{item.classList.toggle('active',!close&&item===button);item.setAttribute('aria-expanded',String(!close&&item===button));});
      demoToolPanel.hidden=close;
      if(!close)renderDemoTool(name);
    }));
    document.getElementById('demo-tool-panel-close')?.addEventListener('click',()=>{
      demoToolPanel.hidden=true;
      demoToolButtons.forEach(button=>{button.classList.remove('active');button.setAttribute('aria-expanded','false');});
    });

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
