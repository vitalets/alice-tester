
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
};

module.exports = {...defaults};

Object.defineProperty(module.exports, 'restore', {
  value: () => Object.assign(module.exports, defaults)
});
