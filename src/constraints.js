/**
 * Protocol constraints.
 */

const get = require('get-value');

const MAX_LENGTHS = {
  'response.text': 1024,
  'response.tts': 1024,
  'response.buttons.$i.title': 64,
  'response.buttons.$i.url': 1024,
};

exports.assertResponse = body => {
  assertPropLength(body, 'response.text');
  assertPropLength(body, 'response.tts');
  assertButtons(body);
};

const assertPropLength = (obj, key, index) => {
  const indexedKey = index !== undefined ? key.replace('$i', index) : key;
  const value = get(obj, indexedKey, '');
  const maxLength = MAX_LENGTHS[key];
  if (value.length > maxLength) {
    throw new Error(buildErrorMessage(indexedKey, value, maxLength));
  }
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

