const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/', (req, res) => {
  db.all('SELECT * FROM groups', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name is required.' });
  const stmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
  stmt.run(name, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run('DELETE FROM cameras WHERE groupId = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
    });
    db.run('DELETE FROM groups WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Group not found' });
      res.status(204).send();
    });
  });
});

module.exports = router;
