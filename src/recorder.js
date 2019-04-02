/**
 * Records all unique responses to provided file.
 */

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const debug = require('debug')('alice-tester:recorder');
const config = require('./config');

class Recorder {
  constructor() {
    this._responses = new Map();
    process.on('exit', () => this._save());
  }

  static get file() {
    return config.recorderFile;
  }

  static get enabled() {
    return Boolean(Recorder.file);
  }

  static _ensureDir() {
    const dir = path.dirname(Recorder.file);
    mkdirp.sync(dir);
  }

  handleResponse(response) {
    if (Recorder.enabled) {
      const key = `${response.text}|${response.tts}`;
      delete response.end_session;
      this._responses.set(key, response);
    }
  }

  _save() {
    if (Recorder.enabled) {
      Recorder._ensureDir();
      const content = this._buildContent();
      fs.writeFileSync(Recorder.file, content);
      debug(`Saved ${this._responses.size} response(s) in ${Recorder.file}`);
    }
  }

  _buildContent() {
    const items = Array.from(this._responses.values());
    items.sort((a, b) => (a.text || '').localeCompare(b.text));
    return JSON.stringify(items, false, 2);
  }
}

module.exports = new Recorder();
