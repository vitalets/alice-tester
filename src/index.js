/**
 * Alice user emulation class.
 */

const fetch = require('node-fetch');
const merge = require('lodash.merge');
const debug = require('debug')('alice-tester');
const { throwIf } = require('throw-utils');
const { assertProtocol } = require('./assertions/protocol');
const { assertStopWords } = require('./assertions/stop-words');
const { assertResponseTime } = require('./assertions/response-time');
const { getWebhookUrl } = require('./webhook');
const config = require('./config');
const {
  buildReqBody,
  buildEnterRequest,
  buildSimpleUtteranceRequest,
  buildButtonPressedRequest,
  buildSessionObject,
} = require('./request-builders');

class User {
  static extractUserId(reqBody) {
    return reqBody && reqBody.session && reqBody.session.user_id;
  }

  /**
   * @param {String|http.Server} [webhookUrl]
   * @param {Object|Function} [extraProps] extraProps applied to every request
   */
  constructor(webhookUrl = '', extraProps = {}) {
    this._webhookUrl = getWebhookUrl(webhookUrl || config.webhookUrl);
    this._extraProps = extraProps;
    this._id = User.extractUserId(extraProps) || config.generateUserId();
    this._sessionsCount = 0;
    this._messagesCount = 0;
    this._history = [];
    this._reqTimestamp = 0;
    this._reqBody = null;
    this._resBody = null;
    debug(`NEW USER created`);
  }

  get id() {
    return this._id;
  }

  get sessionId() {
    return `session-${this._sessionsCount}`;
  }

  get history() {
    return this._history;
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
    const request = buildEnterRequest(message);
    return this._sendRequest(request, extraProps);
  }

  async say(message, extraProps = {}) {
    throwIf(!message, `Нельзя отправить пустое сообщение от пользователя.`);
    const request = buildSimpleUtteranceRequest(message);
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
    throwIf(!title, `Необходимо задать title кнопки для нажатия.`);
    const matcherFn = createButtonMatcherFn(title);
    const button = this._findButtonInSuggest(matcherFn) || this._findButtonInHistory(matcherFn);
    throwIf(!button, `Кнопка "${title}" не найдена.`);
    return this._sendTapRequest(button, extraProps);
  }

  /**
   * Tap on BigImage or image in ItemsList.
   *
   * @param {String|RegExp} [title] если title не задан, то тап в BigImage последнего запроса
   * @param {Object} [extraProps]
   * @returns {Promise}
   */
  async tapImage(title, extraProps = {}) {
    let imageButton;
    if (!title) {
      const lastCard = this.response.card;
      throwIf(!lastCard || !lastCard.button, `Для tapImage() без параметра нужен bigImage с кнопкой в ответе.`);
      imageButton = image2Button(lastCard);
    } else {
      const matcherFn = createButtonMatcherFn(title);
      imageButton = this._findImageButtonInHistory(matcherFn);
      throwIf(!imageButton, `Изображение с кнопкой "${title}" не найдено.`);
    }
    return this._sendTapRequest(imageButton, extraProps);
  }

  async _sendTapRequest({ title, payload, url }, extraProps) {
    // если у копки есть и url и payload, то в ПП ios происходит и переход на урл, и отправка payload в навык
    // Но на андроиде другое поведение: payload в навык не отправляется. Поэтому оставляем только переход по урлу
    if (url) {
      return this._navigate(url);
    } else {
      const request = payload
        ? buildButtonPressedRequest(payload)
        : buildSimpleUtteranceRequest(title);
      return this._sendRequest(request, extraProps);
    }
  }

  async _sendRequest(request, extraProps) {
    this._buildReqBody(request, extraProps);
    this._resBody = null;
    this._reqTimestamp = Date.now();
    const isWebhookFunction = typeof this._webhookUrl === 'function';
    this._resBody = await (isWebhookFunction ? this._callWebhook() : this._post());
    this._handleResponse();
    return this._resBody.response;
  }

  async _callWebhook() {
    return this._webhookUrl(this._reqBody);
  }

  async _post() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const body = JSON.stringify(this._reqBody);
    const response = await fetch(this._webhookUrl, { method: 'POST', headers, body });
    if (response.ok) {
      return response.json();
    } else {
      const text = await response.text();
      const status = response.status;
      throw new Error(`${status} ${text}`);
    }
  }

  _handleResponse() {
    // вставляем в историю спереди, чтобы искать всегда начиная с самых последних ответов
    this._history.unshift(this._resBody.response);
    debug(`RESPONSE: ${JSON.stringify(this._resBody)}`);
    assertProtocol(this._resBody);
    assertStopWords(this._resBody);
    assertResponseTime(this._reqTimestamp);
  }

  _buildReqBody(request, extraProps) {
    const session = buildSessionObject({
      userId: this.id,
      sessionId: this.sessionId,
      messagesCount: ++this._messagesCount,
    });
    this._reqBody = buildReqBody({ request, session });
    this._mergeExtraProps(this._extraProps);
    this._mergeExtraProps(extraProps);
    // sometimes userId is defined via function in extraProps and available only after the request body formed.
    this._updateUserIdIfNeeded();
    debug(`REQUEST: ${JSON.stringify(this._reqBody)}`);
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

  _findButtonInSuggest(matcherFn) {
    const suggestButtons = (this.response.buttons || []).filter(button => button.hide);
    return suggestButtons.find(matcherFn);
  }

  _findButtonInHistory(matcherFn) {
    for (const response of this._history) {
      const visibleButtons = (response.buttons || []).filter(button => !button.hide);
      const button = visibleButtons.find(matcherFn);
      if (button) {
        return button;
      }
    }
  }

  _findImageButtonInHistory(matcherFn) {
    const imageResponses = this._history.filter(response => response.card);
    for (const response of imageResponses) {
      const imagesWithButton = (response.card.items || [ response.card ]).filter(item => item.button);
      const buttons = imagesWithButton.map(image2Button);
      const button = buttons.find(matcherFn);
      if (button) {
        return button;
      }
    }
  }

  _updateUserIdIfNeeded() {
    const userIdInReqBody = User.extractUserId(this._reqBody);
    if (userIdInReqBody !== this._id) {
      this._id = userIdInReqBody;
    }
  }

  async _navigate(url) {
    this._resBody = null;
    const response = await fetch(url, { method: 'GET' });
    this._resBody = await response.text();
    return this._resBody;
  }
}

/**
 * Создает матчер-функцию для кнопок.
 */
const createButtonMatcherFn = title => {
  return typeof title === 'string'
    ? button => button.title === title
    : button => title.test(button.title);
};

/**
 * Кнопки в изображениях имеют свойство text, а не title.
 * Но если text не задан, то используется title (чаще всего так и бывает).
 * Поэтому для удобства приводим кнопки-изображения к формату обычных кнопок, задавая им всегда title.
 *
 * @param {object} image
 * @returns {object}
 */
const image2Button = image => ({
  title: image.button.text || image.title,
  url: image.button.url,
  payload: image.button.payload,
});

User.config = config;

module.exports = User;
