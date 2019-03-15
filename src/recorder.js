/**
 * Records all unique responses to provided file.
 */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const debug = require('debug')('alice-tester:recorder');

class Recorder {
  constructor() {
    this._file = null;
    this._responses = new Map();
    this._save = this._save.bind(this);
  }

  get enabled() {
    return Boolean(this._file);
  }

  enable(file) {
    this._file = file;
    debug(`enabled for file: ${this._file}`);
    if (fs.existsSync(this._file)) {
      fs.unlinkSync(this._file);
    }
    process.on('exit', this._save);
  }

  disable() {
    this._file = null;
    debug(`disabled.`);
    process.removeListener('exit', this._save);
  }

  addResponse(response) {
    const key = `${response.text}|${response.tts}`;
    this._responses.set(key, response);
  }

  _save() {
    const items = Array.from(this._responses.values());
    if (this._file) {
      items.sort((a, b) => (a.text || '').localeCompare(b.text));
      const content = JSON.stringify(items, false, 2);
      this._ensureDir();
      fs.writeFileSync(this._file, content);
      debug(`saved ${items.length} response(s) in ${this._file}`);
    } else {
      /* istanbul ignore next */
      debug(`Can't save ${items.length} response(s) because no file specified.`);
    }
  }

  _ensureDir() {
    const dir = path.dirname(this._file);
    mkdirp.sync(dir);
  }
}

module.exports = new Recorder();
