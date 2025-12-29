const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function getChromePaths() {
  const platform = process.platform;
  if (platform === 'win32') {
    return [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ];
  }
  if (platform === 'darwin') {
    return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  }
  // Linux
  return [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ];
}

function findChrome() {
  const candidates = getChromePaths();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function openChrome() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('Chrome не найден. Установите Google Chrome.');
    process.exit(1);
  }
  const profileDir = path.resolve(__dirname, '../other/chrome-profile');
  const args = [`--remote-debugging-port=9222`, `--user-data-dir=${profileDir}`];
  const child = require('child_process').spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

openChrome();
