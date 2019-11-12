/**
 * Alice user emulation class.
 */

const fetch = require('node-fetch');
const merge = require('lodash.merge');
const debug = require('debug')('alice-tester');
const constraints = require('./constraints');
const config = require('./config');
const requestTemplate = require('./request.template');
const getEntities = require('./entities');

const NEW_SESSION_ORIGINAL_UTTERANCE = 'запусти навык тест';

class User {
  static extractUserId(reqBody) {
    return reqBody && reqBody.session && reqBody.session.user_id;
  }

  /**
   * @param {String|http.Server} webhookUrl
   * @param {Object|Function} [extraProps]
   */
  constructor(webhookUrl, extraProps = {}) {
    this._setWebhookUrl(webhookUrl);
    this._extraProps = extraProps;
    this._id = User.extractUserId(extraProps) || config.generateUserId();
    this._sessionsCount = 0;
    this._messagesCount = 0;
    this._reqTimestamp = 0;
    this._reqBody = null;
    this._resBody = null;
    debug(`NEW USER for ${webhookUrl}`);
  }

  get id() {
    return this._id;
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

  get webhookUrl() {
    return this._webhookUrl;
  }

  async enter(message = '', extraProps = {}) {
    this._sessionsCount++;
    this._messagesCount = 0;
    const original_utterance = `${NEW_SESSION_ORIGINAL_UTTERANCE}${message === '' ? '' : ` ${message}`}`;
    return this._sendMessage(message, {request: {original_utterance}}, extraProps);
  }

  async say(message, extraProps = {}) {
    return this._sendMessage(message, extraProps);
  }

  /**
   * Tap on button.
   *
   * @param {String|RegExp} title
   * @param {Object} [extraProps]
   * @returns {Promise}
   */
  async tap(title, extraProps = {}) {
    this._assertButtonsInPrevResponse();
    const button = this._findButton(title);
    if (button.url) {
      return this._navigate(button.url);
    } else {
      const buttonExtraProps = button.payload
        ? {request: {type: 'ButtonPressed', payload: button.payload}}
        : {request: {type: 'SimpleUtterance'}};

      return this._sendMessage(button.title, buttonExtraProps, extraProps);
    }
  }

  async _sendMessage(message, ...extraPropsList) {
    this._resBody = null;
    this._messagesCount++;
    this._buildBaseReqBody(message);
    [this._extraProps, ...extraPropsList].forEach(extraProps => this._mergeExtraProps(extraProps));
    // sometimes userId is defined via function in extraProps and available only after the request body formed.
    this._updateUserIdIfNeeded();
    return this._post();
  }

  _buildBaseReqBody(message) {
    const command = normalizeCommand(message);
    const tokens = command ? command.split(/\s+/) : [];
    const entities = getEntities(tokens);
    this._reqBody = merge({}, requestTemplate, {
      request: {
        command,
        original_utterance: message,
        nlu: {
          tokens,
          entities,
        }
      },
      session: {
        new: this._messagesCount === 1,
        user_id: this.id,
        session_id: this.sessionId,
        message_id: this._messagesCount,
      }
    });
  }

  _mergeExtraProps(extraProps) {
    if (typeof extraProps === 'function') {
      extraProps(this._reqBody);
    } else {
      merge(this._reqBody, extraProps);
    }
  }

  _findButton(title) {
    const isMatchedButton = typeof title === 'string'
      ? button => button.title === title
      : button => title.test(button.title);

    const button = this.response.buttons.find(isMatchedButton);
    if (!button) {
      const possibleTitles = this.response.buttons.map(b => b.title).join(', ');
      throw new Error(`Кнопка "${title}" не найдена среди возможных кнопок: ${possibleTitles}.`);
    }

    return button;
  }

  async _post() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const body = JSON.stringify(this._reqBody);
    debug(`REQUEST: ${body}`);
    this._reqTimestamp = Date.now();
    const response = await fetch(this._webhookUrl, {method: 'post', headers, body});
    return response.ok ? this._handleSuccess(response) : this._handleError(response);
  }

  async _handleSuccess(response) {
    this._resBody = await response.json();
    debug(`RESPONSE: ${JSON.stringify(this._resBody)}`);
    constraints.assertResponse(this._resBody);
    this._assertResponseTime();
    return this._resBody.response;
  }

  async _handleError(response) {
    const text = await response.text();
    debug(`RESPONSE: ${text}`);
    throw new Error(text);
  }

  _setWebhookUrl(webhookUrl) {
    webhookUrl = webhookUrl || config.webhookUrl;

    if (!webhookUrl) {
      throw new Error(`You should provide webhookUrl`);
    }

    if (typeof webhookUrl === 'string') {
      this._webhookUrl = webhookUrl;
    } else {
      const {address, port} = webhookUrl.address();
      const ip = ['0.0.0.0', '::'].includes(address) ? 'localhost' : address;
      this._webhookUrl = `http://${ip}:${port}`;
    }
  }

  _updateUserIdIfNeeded() {
    const sentUserId = User.extractUserId(this._reqBody);
    if (sentUserId !== this._id) {
      this._id = sentUserId;
    }
  }

  _assertResponseTime() {
    const responseTime = Date.now() - this._reqTimestamp;
    if (config.responseTimeout && responseTime > config.responseTimeout) {
      throw new Error(`Response time (${responseTime} ms) exceeded timeout (${config.responseTimeout} ms)`);
    }
  }

  async _navigate(url) {
    this._resBody = null;
    const response = await fetch(url);
    this._resBody = await response.text();
    return this._resBody;
  }

  _assertButtonsInPrevResponse() {
    if (!this.response || !Array.isArray(this.response.buttons) || this.response.buttons.length === 0) {
      throw new Error(`Предыдущий запрос не вернул ни одной кнопки.`);
    }
  }
}

const normalizeCommand = message => {
  return message
  // приводим к нижнему регистру
    .toLowerCase()
    // удаляем знаки препинания
    .replace(/[,.!?]/g, '')
    // удаляем повторяющиеся пробелы
    .replace(/\s+/g, ' ')
    // отрезаем пробелы в начале и конце
    .trim();
};

User.config = config;

module.exports = User;
