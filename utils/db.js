const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// When running as a pkg .exe the snapshot FS is read-only, so put the DB
// next to the executable instead of inside the bundle.
const dbPath = process.pkg
  ? path.join(path.dirname(process.execPath), 'obsbot.db')
  : path.join(__dirname, '..', 'obsbot.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY, name TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS cameras (id INTEGER PRIMARY KEY, name TEXT, ip TEXT, groupId INTEGER, FOREIGN KEY(groupId) REFERENCES groups(id))`);
});

module.exports = db;
