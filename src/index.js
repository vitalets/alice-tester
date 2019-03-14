/**
 * Alice user emulation class.
 */

const fetch = require('node-fetch');
const merge = require('lodash.merge');
const debug = require('debug')('alice-tester');
const constraints = require('./constraints');

class User {
  constructor(webhookUrl, extraProps = {}) {
    this._webhookUrl = webhookUrl;
    this._extraProps = extraProps;
    this._index = ++User.counter;
    this._sessionsCount = 0;
    this._messagesCount = 0;
    this._reqBody = null;
    this._resBody = null;
  }

  get userId() {
    return `user-${this._index}`;
  }

  get sessionId() {
    return `session-${this._sessionsCount}`;
  }

  get response() {
    return this._resBody && this._resBody.response;
  }

  get body() {
    return this._resBody;
  }

  async enter(message = '', extraProps = {}) {
    this._sessionsCount++;
    this._messagesCount = 0;
    await this.say(message, extraProps);
  }

  async say(message, extraProps = {}) {
    await this._sendMessage(message, extraProps);
  }

  async tap(title, extraProps = {}) {
    if (!this.response || !Array.isArray(this.response.buttons) || this.response.buttons.length === 0) {
      throw new Error(`Предыдущий запрос не вернул ни одной кнопки.`);
    }

    const button = this.response.buttons.find(b => b.title === title);
    if (!button) {
      const possibleTitles = this.response.buttons.map(b => b.title).join(', ');
      throw new Error(`Кнопка "${title}" не найдена среди возможных кнопок: ${possibleTitles}.`);
    }

    const buttonExtraProps = {request: {type: 'ButtonPressed', payload: button.payload}};
    await this._sendMessage(button.title, buttonExtraProps, extraProps);
  }

  async _sendMessage(message, ...extraPropsList) {
    this._resBody = null;
    this._messagesCount++;
    this._buildBaseReqBody(message);
    [this._extraProps].concat(extraPropsList).forEach(extraProps => this._mergeExtraProps(extraProps));
    await this._post();
  }

  _buildBaseReqBody(message) {
    this._reqBody = {
      request: {
        command: message,
        original_utterance: message,
        type: 'SimpleUtterance',
      },
      session: {
        new: this._messagesCount === 1,
        user_id: this.userId,
        session_id: this.sessionId,
        message_id: this._messagesCount,
        skill_id: 'test-skill',
      },
      meta: {
        locale: 'ru-RU',
        timezone: 'Europe/Moscow',
        client_id: 'ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)',
        interfaces: {
          screen: {}
        }
      },
      version: '1.0'
    };
  }

  _mergeExtraProps(extraProps) {
    if (typeof extraProps === 'function') {
      extraProps(this._reqBody);
    } else {
      merge(this._reqBody, extraProps);
    }
  }

  async _post() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    const body = JSON.stringify(this._reqBody);

    debug(`REQUEST: ${body}`);

    const response = await fetch(this._webhookUrl, {method: 'post', headers, body});

    if (response.ok) {
      this._resBody = await response.json();
      debug(`RESPONSE: ${JSON.stringify(this._resBody)}`);
      constraints.assertResponse(this._resBody);
    } else {
      const text = await response.text();
      debug(`RESPONSE: ${text}`);
      throw new Error(text);
    }
  }
}

User.counter = 0;

module.exports = User;
