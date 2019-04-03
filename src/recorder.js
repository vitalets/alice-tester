/**
 * Records all unique responses to provided file.
 */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const debug = require('debug')('alice-tester:recorder');

class Recorder {
  constructor() {
    this._file = '';
    this._responses = new Map();
    process.on('exit', () => this._save());
  }

  set file(file) {
    this._file = file;
    if (this._file) {
      debug(`Recording to file: ${this._file}`);
    }
  }

  get _enabled() {
    return Boolean(this._file);
  }

  handleResponse(response) {
    if (this._enabled) {
      const key = `${response.text}|${response.tts}`;
      delete response.end_session;
      this._responses.set(key, response);
    }
  }

  _save() {
    if (this._enabled) {
      this._ensureDir();
      const content = this._buildContent();
      fs.writeFileSync(this._file, content);
      debug(`Saved ${this._responses.size} response(s) to file: ${this._file}`);
    }
  }

  _buildContent() {
    const items = Array.from(this._responses.values());
    items.sort((a, b) => (a.text || '').localeCompare(b.text));
    return JSON.stringify(items, false, 2);
  }

  _ensureDir() {
    const dir = path.dirname(this._file);
    mkdirp.sync(dir);
  }
}

module.exports = new Recorder();
