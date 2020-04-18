/**
 * Protocol constraints.
 */
const { throwIf } = require('throw-utils');
const get = require('get-value');

const MAX_LENGTHS = {
  'response.text': 1024,
  'response.tts': 1024,
  'response.buttons.$i.title': 64,
  'response.buttons.$i.url': 1024,
};

/**
 * Проверяем обязательные поля.
 * Проверяем допустимые размеры полей.
 * todo: use json-micro-schema
 *
 * @param {object} resBody
 */
exports.assertProtocol = resBody => {
  assertRequiredProps(resBody);
  assertPropLength(resBody, 'response.text');
  assertPropLength(resBody, 'response.tts');
  assertButtons(resBody);
};

const assertRequiredProps = resBody => {
  const requiredProps = [
    'response.text',
    'session',
    'version',
  ];
  for (const prop of requiredProps) {
    throwIf(!get(resBody, prop), `Отсутствует обязательное поле "${prop}"`);
  }
};

const assertPropLength = (obj, key, index) => {
  const indexedKey = index !== undefined ? key.replace('$i', index) : key;
  const value = get(obj, indexedKey, '');
  const maxLength = MAX_LENGTHS[key];
  throwIf(value.length > maxLength, () => buildErrorMessage(indexedKey, value, maxLength));
};

const assertButtons = body => {
  const buttons = get(body, 'response.buttons', []);
  buttons.forEach((button, index) => assertPropLength(body, 'response.buttons.$i.title', index));
  buttons.forEach((button, index) => assertPropLength(body, 'response.buttons.$i.url', index));
};

const buildErrorMessage = (key, value, maxLength) => {
  const truncatedValue = `${value.substr(0, 15)}...${value.substr(-15)}`;
  return `Length of ${key} (${value.length}) is greater than allowed (${maxLength}): ${truncatedValue}`;
};

