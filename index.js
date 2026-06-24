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

app.listen(3001, () => {
  Logger.info('API running on http://localhost:3001');
  // When running as a bundled .exe, open the browser automatically
  if (process.pkg) {
    const { exec } = require('child_process');
    setTimeout(() => exec('start http://localhost:3001'), 1200);
  }
});
