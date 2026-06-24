const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer-core');
const { existsSync } = require('fs');
const Logger = require('../utils/logger');

// Preference order: env var → common install paths across platforms
const BROWSER_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  // Windows Edge (ships with every Win10/11)
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // Windows Chrome
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

function findBrowser() {
  for (const p of BROWSER_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'No Chrome/Edge browser found. Install Chrome or Edge, or set the PUPPETEER_EXECUTABLE_PATH environment variable.'
  );
}

router.get('/:ip', async (req, res) => {
  const { ip } = req.params;
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: findBrowser(),
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.goto(`http://${ip}/#/control`, { waitUntil: 'networkidle2', timeout: 10000 });
    const status = await page.evaluate(() => {
      const btn = document.querySelector(
        '#app > div > div > div.portal-content._scrollbar_mini > div > div > div.control-tail-air.control-wrap > div.control-body > div.air-console.isProd > div.foldable-list > div:nth-child(1) > div.panel-body > div:nth-child(1) > div.grid-list._c2 > button:nth-child(1)'
      );
      if (!btn) return 'not-found';
      return btn.classList.contains('active');
    });
    res.json({ status });
  } catch (err) {
    Logger.error(`Camera: ${ip} --> Error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch camera UI status', details: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

module.exports = router;
