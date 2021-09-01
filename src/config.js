
const defaults = {
  /**
   * User id generation function.
   * @type {Function}
   */
  generateUserId: () => `${Date.now()}-${Math.random()}`,

  /**
   * Timeout for response from skill.
   * @type {Number}
   */
  responseTimeout: 1000,

  /**
   * Default webhook url.
   * @type {String|http.Server|Function}
   */
  webhookUrl: '',

  /**
   * List of words that throws error if found in response.
   * @type {Array<String|RegExp>}
   */
  stopWords: [
    'undefined',
    'null',
    'NaN',
    'true',
    'false',
    'object',
    'Infinity',
    'Error',
    'function',
  ],

  maxLengths: {
    'response.text': 1024,
    'response.tts': 1024,
    'response.buttons.$i.title': 64,
    'response.buttons.$i.url': 1024,
  }
};

module.exports = {...defaults};

Object.defineProperty(module.exports, 'restore', {
  value: () => Object.assign(module.exports, defaults)
});
