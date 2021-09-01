/**
 * Protocol constraints.
 */
const { throwIf } = require('throw-utils');
const get = require('get-value');
const config = require('../config');

/**
 * Проверяем обязательные поля.
 * Проверяем допустимые размеры полей.
 * todo: use json-micro-schema
 *
 * @param {object} resBody
 */
exports.assertProtocol = resBody => {
  assertPropsRequired(resBody);
  assertPropsLength(resBody);
};

const assertPropsRequired = resBody => {
  const requiredProps = [
    'response.text',
    'version',
  ];
  for (const prop of requiredProps) {
    throwIf(!get(resBody, prop), `Отсутствует обязательное поле "${prop}"`);
  }
};

const assertPropsLength = resBody => {
  assertPropLength(resBody, 'response.text');
  assertPropLength(resBody, 'response.tts');
  assertButtonsLength(resBody);
};

const assertPropLength = (obj, key, index) => {
  const maxLength = config.maxLengths[key];
  if (maxLength) {
    const indexedKey = index !== undefined ? key.replace('$i', index) : key;
    const value = get(obj, indexedKey, '');
    throwIf(value.length > maxLength, () => buildErrorMessage(indexedKey, value, maxLength));
  }
};

const assertButtonsLength = resBody => {
  const buttons = get(resBody, 'response.buttons', []);
  buttons.forEach((_, index) => assertPropLength(resBody, 'response.buttons.$i.title', index));
  buttons.forEach((_, index) => assertPropLength(resBody, 'response.buttons.$i.url', index));
};

const buildErrorMessage = (key, value, maxLength) => {
  const truncatedValue = `${value.substr(0, 15)}...${value.substr(-15)}`;
  return `Length of ${key} (${value.length}) is greater than allowed (${maxLength}): ${truncatedValue}`;
};

