// backend/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const ping = require('ping');
const puppeteer = require('puppeteer');
const Logger = require('./utils/logger');

const app = express();

const db = new sqlite3.Database('./obsbot.db');

app.use(cors());
app.use(bodyParser.json());

const path = require('path');

app.use(express.static(path.join(__dirname, '/app/dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/app/dist/index.html'));
});

// DB Setup
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY, name TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS cameras (id INTEGER PRIMARY KEY, name TEXT, ip TEXT, groupId INTEGER, FOREIGN KEY(groupId) REFERENCES groups(id))`);
});

// Routes
app.get('/api/groups', (req, res) => {
  db.all('SELECT * FROM groups', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/groups', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Group name is required.' });
  }
  const stmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
  stmt.run(name, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});


app.get('/api/cameras', (req, res) => {
  db.all('SELECT * FROM cameras', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/cameras', (req, res) => {
  const { name, ip, groupId } = req.body;
  if (!name || !ip || !groupId) {
    return res.status(400).json({ error: 'Name, IP, and Group ID are required.' });
  }
  const stmt = db.prepare('INSERT INTO cameras (name, ip, groupId) VALUES (?, ?, ?)');
  stmt.run(name, ip, groupId, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

app.put('/api/cameras/:id', (req, res) => {
  const { name, ip, groupId } = req.body;
  const { id } = req.params;

  if (!name || !ip || !groupId) {
    return res.status(400).json({ error: 'Name, IP, and Group ID are required.' });
  }

  const stmt = db.prepare('UPDATE cameras SET name = ?, ip = ?, groupId = ? WHERE id = ?');
  stmt.run(name, ip, groupId, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    res.status(200).json({ message: 'Camera updated successfully' });
  });
});

app.delete('/api/cameras/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM cameras WHERE id = ?');
  stmt.run(id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Camera not found' });
    res.status(204).send();
  });
});

app.get('/api/ping/:ip', async (req, res) => {
  try {
    const result = await ping.promise.probe(req.params.ip);
    result.alive ? res.sendStatus(200) : res.sendStatus(503);
  } catch {
    res.sendStatus(500);
  }
});

app.post('/api/command', async (req, res) => {
  const { ip, command, data } = req.body;
  try {
    const response = await axios.post(`http://${ip}/camera/sdk/${command}`, data);
    Logger.success("Camera: " + ip + " --> " + response.data);
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    Logger.error("Camera: " + ip + " --> Error: " + err.message);
    res.status(status).json({ error: err.message });
  }
});

app.put('/api/command', async (req, res) => {
  const { ip, command, data } = req.body;
  try {
    const response = await axios.put(`http://${ip}/camera/sdk/${command}`, data);
    Logger.info(`Camera: http://${ip}/camera/sdk/${command}`);
    Logger.success("Camera: " + ip + " --> " + JSON.stringify(response.data));
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    Logger.error("Camera: " + ip + " --> Error: " + JSON.stringify(err.response.body));
    res.status(status).json({ error: err.message });
  }
});


app.get('/api/camera-status/:ip', async (req, res) => {
  const { ip } = req.params;

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto(`http://${ip}/#/control`, { waitUntil: 'networkidle2', timeout: 10000 });

    const buttonColor = await page.evaluate(() => {
      const btn = document.querySelector(
        '#app > div > div > div.portal-content._scrollbar_mini > div > div > div.control-tail-air.control-wrap > div.control-body > div.air-console.isProd > div.foldable-list > div:nth-child(1) > div.panel-body > div:nth-child(1) > div.grid-list._c2 > button:nth-child(1)'
      );
      if (!btn) return 'not-found';
      return btn.classList.contains('active') ? true : false;
    });

    await browser.close();

    res.json({ status: buttonColor });
  } catch (err) {
    Logger.error("Camera: " + ip + " --> Error: " + err.message);
    res.status(500).json({ error: 'Failed to fetch camera UI color', details: err.message });
  }
});


app.listen(3001, () =>  Logger.info('API running on http://localhost:3001'));
