const chalk = require('chalk');

class Logger {
  static _timestamp() {
    return chalk.gray(`[${new Date().toISOString()}]`);
  }

  static info(message) {
    console.log(`${this._timestamp()} ${chalk.blue('[INFO]')} ${message}`);
  }

  static success(message) {
    console.log(`${this._timestamp()} ${chalk.green('[SUCCESS]')} ${message}`);
  }

  static warning(message) {
    console.log(`${this._timestamp()} ${chalk.yellow('[WARNING]')} ${message}`);
  }

  static error(message) {
    console.error(`${this._timestamp()} ${chalk.red('[ERROR]')} ${message}`);
  }

  static status(label, message) {
    console.log(`${this._timestamp()} ${chalk.cyan(`[${label.toUpperCase()}]`)} ${message}`);
  }
}

module.exports = Logger;
