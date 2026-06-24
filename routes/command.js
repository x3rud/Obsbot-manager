const express = require('express');
const router = express.Router();
const axios = require('axios');
const Logger = require('../utils/logger');

router.post('/', async (req, res) => {
  const { ip, command, data, mode } = req.body;
  try {
    const response = await axios({ method: mode, url: `http://${ip}/camera/sdk/${command}`, data, timeout: 5000 });
    Logger.success(`Camera: ${ip} --> ${JSON.stringify(response.data)}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    Logger.error(`Camera: ${ip} --> Error: ${err.message}`);
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
