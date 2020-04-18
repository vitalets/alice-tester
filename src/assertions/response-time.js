/**
 * Проверка времени ответа.
 */
const { throwError } = require('throw-utils');
const config = require('../config');

/**
 * Проверяем время ответа.
 *
 * @param {number} requestTime
 */
exports.assertResponseTime = requestTime => {
  const responseTime = Date.now() - requestTime;
  if (config.responseTimeout && responseTime > config.responseTimeout) {
    throwError(`Response time (${responseTime} ms) exceeded timeout (${config.responseTimeout} ms)`);
  }
};
