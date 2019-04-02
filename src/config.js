
const defaults = {
  /**
   * User id generation function.
   * @type {Function}
   */
  generateUserId: () => `${Date.now()}-${Math.random()}`,

  /**
   * File to record responses.
   * @type {String}
   */
  recorderFile: '',
};

module.exports = {...defaults};
