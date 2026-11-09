(function () {
  const ua = navigator.userAgentData || {};
  const platform = ua.platform || (navigator.userAgent.match(/(Windows|Mac|Linux|Android|iOS)/) || [null])[0] || 'unknown';
  const osDetected = document.getElementById('os-detected');
  const dlBtn = document.getElementById('dl-btn');
  const dlOther = document.getElementById('dl-other');
  const dlOs = document.getElementById('dl-os');
  const dlCustom = document.getElementById('dl-custom');

  // Placeholder Release URLs (replace with real GitHub Releases links)
  const releases = {
    windows: 'https://github.com/OWNER/REPO/releases/latest/download/glb-viewer-windows.exe',
    mac: 'https://github.com/OWNER/REPO/releases/latest/download/glb-viewer-mac.dmg',
    linux: 'https://github.com/OWNER/REPO/releases/latest/download/glb-viewer-linux.AppImage',
  };

  function setButton(osKey) {
    const labelMap = { windows: 'Download for Windows', mac: 'Download for Mac', linux: 'Download for Linux' };
    dlBtn.textContent = labelMap[osKey] || 'Download';
    dlBtn.onclick = () => { location.href = releases[osKey] || releases.windows; };
    dlOs.value = osKey;
  }

  // Detect OS
  let detected = 'windows';
  const uaLower = navigator.userAgent.toLowerCase();
  if (uaLower.includes('mac')) detected = 'mac';
  else if (uaLower.includes('linux')) detected = 'linux';
  else if (uaLower.includes('windows')) detected = 'windows';
  else if (uaLower.includes('android')) detected = 'linux';
  else if (uaLower.includes('iphone') || uaLower.includes('ipad')) detected = 'mac';

  osDetected.textContent = 'Detected OS: ' + detected.charAt(0).toUpperCase() + detected.slice(1);
  setButton(detected);

  dlCustom.onclick = () => { setButton(dlOs.value); };

  // Privacy-friendly analytics placeholder (anonymous only)
  function track(eventName, props) {
    // Placeholder: send to Plausible / Umami. Anonymous only.
    // Never track file names, file sizes, or models.
    console.log('[analytics]', eventName, props);
  }

  track('page_view', { os: detected });
  dlBtn.addEventListener('click', () => track('download_clicked', { os: detected }));
})();
