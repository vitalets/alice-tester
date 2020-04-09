/**
 * Alice user emulation class.
 */

const fetch = require('node-fetch');
const merge = require('lodash.merge');
const debug = require('debug')('alice-tester');
const { throwIf, throwError } = require('throw-utils');
const get = require('get-value');
const constraints = require('./constraints');
const config = require('./config');
const getEntities = require('./entities');

const NEW_SESSION_ORIGINAL_UTTERANCE = 'запусти навык тест';

class User {
  static extractUserId(reqBody) {
    return reqBody && reqBody.session && reqBody.session.user_id;
  }

  /**
   * @param {String|http.Server} [webhookUrl]
   * @param {Object|Function} [extraProps] extraProps applied to every request
   */
  constructor(webhookUrl = '', extraProps = {}) {
    this._setWebhookUrl(webhookUrl || config.webhookUrl);
    this._extraProps = extraProps;
    this._id = User.extractUserId(extraProps) || config.generateUserId();
    this._sessionsCount = 0;
    this._messagesCount = 0;
    this._reqTimestamp = 0;
    this._reqBody = null;
    this._resBody = null;
    debug(`NEW USER for ${this._webhookUrl}`);
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

  /**
   * Вход пользователя в навык - Новая сессия.
   *
   * @param {string} [message='']
   * @param {function|object} extraProps
   * @returns {Promise}
   */
  async enter(message = '', extraProps = {}) {
    this._sessionsCount++;
    this._messagesCount = 0;
    const request = this._buildSimpleUtteranceRequest(message);
    request.original_utterance = `${NEW_SESSION_ORIGINAL_UTTERANCE}${message === '' ? '' : ` ${message}`}`;
    return this._sendRequest(request, extraProps);
  }

  async say(message, extraProps = {}) {
    const request = this._buildSimpleUtteranceRequest(message);
    return this._sendRequest(request, extraProps);
  }

  /**
   * Tap on button.
   *
   * @param {String|RegExp} title
   * @param {Object} [extraProps]
   * @returns {Promise}
   */
  async tap(title, extraProps = {}) {
    const buttons = this.response.buttons;
    throwIf(!Array.isArray(buttons) || !buttons.length, `Предыдущий запрос не вернул ни одной кнопки.`);
    const button = this._findButton(buttons, title);
    return this._sendTapRequest(button, extraProps);
  }

  /**
   * Tap on BigImage or image in ItemsList.
   *
   * @param {String|RegExp} [title]
   * @param {Object} [extraProps]
   * @returns {Promise}
   */
  async tapImage(title, extraProps = {}) {
    throwIf(!this.response.card, `Предыдущий запрос не вернул поле card.`);
    const isBigImage = this.response.card.type === 'BigImage';
    const items = isBigImage ? [this.response.card] : this.response.card.items;
    throwIf(!Array.isArray(items) || !items.length, `Предыдущий запрос не вернул изображений.`);
    const itemsWithButton = items.filter(item => item.button);
    throwIf(!itemsWithButton.length, `Предыдущий запрос не вернул изображений с кнопками.`);
    // Кнопки в изображениях имеют свойство text, а не title. Но если text не задан, то используется title изображения.
    // Поэтому тут для удобства приводим кнопки-изображения к формату обычных кнопок, задавая им title.
    const buttons = itemsWithButton.map(item => ({
      title: item.button.text || item.title,
      url: item.button.url,
      payload: item.button.payload,
    }));
    const button = isBigImage ? buttons[0] : this._findButton(buttons, title);
    return this._sendTapRequest(button, extraProps);
  }

  async _sendTapRequest({ title, payload, url }, extraProps) {
    // если у копки есть и url и payload, то в ПП ios происходит и переход на урл, и отправка payload в навык
    // Но на андроиде другое поведение: payload в навык не отправляется. Поэтому оставляем только переход по урлу
    if (url) {
      return this._navigate(url);
    } else {
      const request = payload
        ? this._buildButtonPressedRequest(payload)
        : this._buildSimpleUtteranceRequest(title);
      return this._sendRequest(request, extraProps);
    }
  }

  async _sendRequest(request, extraProps) {
    this._resBody = null;
    this._messagesCount++;
    this._buildReqBody(request, extraProps);
    return this._post();
  }

  _buildReqBody(request, extraProps) {
    this._reqBody = {
      request,
      session: this._buildSessionObject(),
      meta: this._buildMetaObject(),
      version: '1.0',
    };
    this._mergeExtraProps(this._extraProps);
    this._mergeExtraProps(extraProps);
    // sometimes userId is defined via function in extraProps and available only after the request body formed.
    this._updateUserIdIfNeeded();
  }

  _buildSimpleUtteranceRequest(userMessage) {
    const command = normalizeCommand(userMessage);
    const tokens = command ? command.split(/\s+/) : [];
    const entities = getEntities(tokens);
    return {
      command,
      original_utterance: userMessage,
      type: 'SimpleUtterance',
      nlu: {
        tokens,
        entities,
      },
      markup: {
        dangerous_context: false
      },
    };
  }

  _buildButtonPressedRequest(payload) {
    // при нажатии на кнопку с payload в запросе не приходят command, original_utterance, markup
    return {
      payload,
      type: 'ButtonPressed',
      nlu: {
        tokens: [],
        entities: [],
      },
    };
  }

  _buildSessionObject() {
    return {
      new: this._messagesCount === 1,
      user_id: this.id,
      session_id: this.sessionId,
      message_id: this._messagesCount,
      skill_id: 'test-skill',
    };
  }

  _buildMetaObject() {
    return {
      locale: 'ru-RU',
      timezone: 'Europe/Moscow',
      client_id: 'ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)',
      interfaces: {
        screen: {}
      }
    };
  }

  /**
   * Если extraProps функция, то она мутирует запрос внутри.
   * Если extraProps объект, то домердживаем их в запрос.
   *
   * @param {function|object} extraProps
   * @private
   */
  _mergeExtraProps(extraProps) {
    if (typeof extraProps === 'function') {
      extraProps(this._reqBody);
    } else {
      merge(this._reqBody, extraProps);
    }
  }

  _findButton(buttons, title) {
    throwIf(!title, `Необходимо задать title кнопки для нажатия.`);
    const matchButton = typeof title === 'string'
      ? button => button.title === title
      : button => title.test(button.title);
    const button = buttons.find(matchButton);
    return button || throwError(
      `Кнопка "${title}" не найдена среди возможных кнопок: ${buttons.map(b => b.title).join(', ')}.`
    );
  }


  async _post() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const body = JSON.stringify(this._reqBody);
    debug(`REQUEST: ${body}`);
    this._reqTimestamp = Date.now();
    const response = await fetch(this._webhookUrl, { method: 'post', headers, body });
    return response.ok ? this._handleSuccess(response) : this._handleError(response);
  }

  async _handleSuccess(response) {
    this._resBody = await response.json();
    debug(`RESPONSE: ${JSON.stringify(this._resBody)}`);
    constraints.assertResponse(this._resBody);
    this._assertResponseTime();
    this._assertStopWords();
    return this._resBody.response;
  }

  async _handleError(response) {
    const text = await response.text();
    debug(`RESPONSE: ${text}`);
    throw new Error(text);
  }

  _setWebhookUrl(webhookUrl) {
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
    const userIdInReqBody = User.extractUserId(this._reqBody);
    if (userIdInReqBody !== this._id) {
      this._id = userIdInReqBody;
    }
  }

  _assertResponseTime() {
    const responseTime = Date.now() - this._reqTimestamp;
    if (config.responseTimeout && responseTime > config.responseTimeout) {
      throw new Error(`Response time (${responseTime} ms) exceeded timeout (${config.responseTimeout} ms)`);
    }
  }

  _assertStopWords() {
    [
      'response.text',
      'response.tts',
      'response.card.title',
      'response.card.description',
    ].forEach(key => {
      const string = get(this._resBody, key, '');
      if (string) {
        const foundStopWord = config.stopWords.find(stopWord => typeof stopWord === 'string'
          ? string.includes(stopWord)
          : stopWord.test(string)
        );
        throwIf(foundStopWord, `Stop word "${foundStopWord}" found in ${key}: "${string}"`);
      }
    });
  }

  async _navigate(url) {
    this._resBody = null;
    const response = await fetch(url);
    this._resBody = await response.text();
    return this._resBody;
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
