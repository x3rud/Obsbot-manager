const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const https = require('https');
const path = require('path');

const GITHUB_REPO = 'x3rud/Obsbot-manager';
const ROOT = path.join(__dirname, '..');

function run(cmd, cwd = ROOT) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

function fetchGithubRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: { 'User-Agent': 'obsbot-updater' },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid response from GitHub API')); }
      });
    }).on('error', reject);
  });
}

async function getCurrentVersion() {
  try {
    const tag = await run('git describe --tags --abbrev=0');
    if (tag) return tag;
  } catch { /* no tags — fall through */ }

  // Fall back to package.json version
  try {
    const pkg = require(path.join(ROOT, 'package.json'));
    return `v${pkg.version}`;
  } catch {
    return 'unknown';
  }
}

router.get('/check', async (_req, res) => {
  try {
    const [current, release] = await Promise.all([getCurrentVersion(), fetchGithubRelease()]);
    const latest = release.tag_name;
    const normalise = v => v.replace(/^v/, '');
    res.json({
      current,
      latest,
      upToDate: normalise(current) === normalise(latest),
      releaseNotes: release.body ?? '',
      releaseUrl: release.html_url ?? '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/apply', async (_req, res) => {
  try {
    await run('git pull');
    await run('pnpm install');
    await run('pnpm install', path.join(ROOT, 'app'));
    await run('pnpm run build', path.join(ROOT, 'app'));
    res.json({ success: true, message: 'Update applied. Please restart the server.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
