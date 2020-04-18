/**
 * Webhook.
 */
const { throwIf } = require('throw-utils');

/**
 * Проверяем время ответа.
 *
 * @param {String|http.Server} passedWebhookUrl
 */
exports.getWebhookUrl = passedWebhookUrl => {
  throwIf(!passedWebhookUrl, `You should provide webhookUrl`);

  return typeof passedWebhookUrl === 'string'
    ? passedWebhookUrl
    : getWebhookUrlFromServer(passedWebhookUrl);
};

const getWebhookUrlFromServer = server => {
  const { address, port } = server.address();
  const ip = ['0.0.0.0', '::'].includes(address) ? 'localhost' : address;
  return `http://${ip}:${port}`;
};
