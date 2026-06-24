const express = require('express');
const router = express.Router();
const ping = require('ping');

router.get('/:ip', async (req, res) => {
  const { ip } = req.params;
  try {
    const result = await ping.promise.probe(ip);
    result.alive ? res.sendStatus(200) : res.sendStatus(503);
  } catch {
    res.sendStatus(500);
  }
});

module.exports = router;
