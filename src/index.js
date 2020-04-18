/**
 * Alice user emulation class.
 */

const fetch = require('node-fetch');
const merge = require('lodash.merge');
const debug = require('debug')('alice-tester');
const { throwIf } = require('throw-utils');
const get = require('get-value');
const constraints = require('./constraints');
const config = require('./config');
const { getNlu } = require('./nlu');

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
    this._history = [];
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
    const request = this._buildSimpleUtteranceRequest(message);
    request.original_utterance = `${NEW_SESSION_ORIGINAL_UTTERANCE}${message === '' ? '' : ` ${message}`}`;
    return this._sendRequest(request, extraProps);
  }

  async say(message, extraProps = {}) {
    throwIf(!message, `Нельзя отправить пустое сообщение от пользователя.`);
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
    const nlu = getNlu(command);
    return {
      command,
      original_utterance: userMessage,
      type: 'SimpleUtterance',
      nlu,
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

  async _post() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const body = JSON.stringify(this._reqBody);
    debug(`REQUEST: ${body}`);
    this._reqTimestamp = Date.now();
    const response = await fetch(this._webhookUrl, { method: 'post', headers, body });
    return response.ok
      ? this._handleSuccess(response)
      : this._handleError(response);
  }

  async _handleSuccess(response) {
    this._resBody = await response.json();
    // вставляем в историю спереди, чтобы искать всегда начиная с самых свежих изображений
    this._history.unshift(this._resBody.response);
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
    // todo: check image titles and descriptions for ItemsList
    // todo: move to stop-words.js module
    [
      'response.text',
      'response.tts',
      'response.card.title',
      'response.card.description',
      'response.card.header.text',
      'response.card.footer.text',
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
