const express = require('express');
const router = express.Router();
const axios = require('axios');
const Logger = require('../utils/logger');

router.post('/', async (req, res) => {
  const { ip, command, data, mode } = req.body;
  try {
    const requestBody = data ? ` | body: ${JSON.stringify(data)}` : '';
    Logger.info(`Camera: ${ip} <-- [${mode?.toUpperCase()}] /camera/sdk/${command}${requestBody}`);
    const response = await axios({ method: mode, url: `http://${ip}/camera/sdk/${command}`, data, timeout: 3000 });
    Logger.success(`Camera: ${ip} --> ${JSON.stringify(response.data)}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    const networkCodes = ['ECONNABORTED', 'ECONNREFUSED', 'EHOSTUNREACH', 'ETIMEDOUT', 'ENETUNREACH'];
    const isUnreachable = networkCodes.includes(err.code) || err.code?.startsWith('ECONN');
    const status = isUnreachable ? 503 : (err.response?.status || 500);
    const message = isUnreachable ? 'Camera unreachable' : err.message;
    const responseBody = err.response?.data ? ` | body: ${JSON.stringify(err.response.data)}` : '';
    Logger.error(`Camera: ${ip} --> ${message}${responseBody}`);
    res.status(status).json({ error: message });
  }
});

module.exports = router;
