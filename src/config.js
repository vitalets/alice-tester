
const defaults = {
  /**
   * User id generation function.
   * @type {Function}
   */
  generateUserId: () => `${Date.now()}-${Math.random()}`,
};

module.exports = {...defaults};
