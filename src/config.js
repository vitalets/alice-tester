
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
   * @type {String}
   */
  webhookUrl: '',
};

module.exports = {...defaults};

Object.defineProperty(module.exports, 'restore', {
  value: () => Object.assign(module.exports, defaults)
});
