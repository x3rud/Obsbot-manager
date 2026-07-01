const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Logger = require('./utils/logger');

require('./utils/db'); // initialise DB and run migrations

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/app/dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/app/dist/index.html'));
});

app.use('/api/groups',         require('./routes/groups'));
app.use('/api/cameras',        require('./routes/cameras'));
app.use('/api/camera-status',  require('./routes/cameraStatus'));
app.use('/api/command',        require('./routes/command'));
app.use('/api/ping',           require('./routes/ping'));
app.use('/api/update',         require('./routes/update'));

app.listen(3001, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const localIp = Object.values(nets).flat().find(n => n.family === 'IPv4' && !n.internal)?.address ?? 'localhost';
  Logger.info(`API running on http://localhost:3001  (network: http://${localIp}:3001)`);
  if (process.pkg) {
    const { exec } = require('child_process');
    setTimeout(() => exec(`start http://${localIp}:3001`), 1200);
  }
});
