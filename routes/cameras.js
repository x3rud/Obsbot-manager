const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/', (req, res) => {
  db.all('SELECT * FROM cameras', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { name, ip, groupId } = req.body;
  if (!name || !ip || !groupId) return res.status(400).json({ error: 'Name, IP, and Group ID are required.' });
  const stmt = db.prepare('INSERT INTO cameras (name, ip, groupId) VALUES (?, ?, ?)');
  stmt.run(name, ip, groupId, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

router.put('/:id', (req, res) => {
  const { name, ip, groupId } = req.body;
  const { id } = req.params;
  if (!name || !ip || !groupId) return res.status(400).json({ error: 'Name, IP, and Group ID are required.' });
  const stmt = db.prepare('UPDATE cameras SET name = ?, ip = ?, groupId = ? WHERE id = ?');
  stmt.run(name, ip, groupId, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Camera not found' });
    res.status(200).json({ message: 'Camera updated successfully' });
  });
});

router.post('/bulk', (req, res) => {
  const { cameras } = req.body;
  if (!Array.isArray(cameras) || cameras.length === 0)
    return res.status(400).json({ error: 'cameras array is required.' });

  const stmt = db.prepare('INSERT INTO cameras (name, ip, groupId) VALUES (?, ?, ?)');
  const skipped = [];
  const ids = [];

  db.serialize(() => {
    cameras.forEach(cam => {
      if (!cam.name || !cam.ip || !cam.groupId) {
        skipped.push(cam);
        return;
      }
      stmt.run(cam.name, cam.ip, cam.groupId, function (err) {
        if (err) skipped.push({ ...cam, error: err.message });
        else ids.push(this.lastID);
      });
    });

    stmt.finalize(err => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ inserted: ids.length, skipped });
    });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM cameras WHERE id = ?');
  stmt.run(id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Camera not found' });
    res.status(204).send();
  });
});

module.exports = router;
