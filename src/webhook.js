/**
 * Webhook.
 */
const { throwIf } = require('throw-utils');

/**
 * Получаем вебхук.
 *
 * @param {String|Function|http.Server} passedWebhookUrl
 */
exports.getWebhookUrl = passedWebhookUrl => {
  throwIf(!passedWebhookUrl, `You should provide webhookUrl`);

  if ([ 'string', 'function' ].includes(typeof passedWebhookUrl)) {
    return passedWebhookUrl;
  } else {
    return buildWebhookUrlFromServer(passedWebhookUrl);
  }
};

const buildWebhookUrlFromServer = server => {
  const { address, port } = server.address();
  const ip = ['0.0.0.0', '::'].includes(address) ? 'localhost' : address;
  return `http://${ip}:${port}`;
};
