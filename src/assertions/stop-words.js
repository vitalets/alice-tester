/**
 * Проверка стоп-слов.
 */
const { throwIf } = require('throw-utils');
const get = require('get-value');
const config = require('../config');

// todo: check image titles and descriptions for ItemsList

const PROPS = [
  'response.text',
  'response.tts',
  'response.card.title',
  'response.card.description',
  'response.card.header.text',
  'response.card.footer.text',
];

/**
 * Проверяем стоп-слова в ответе.
 *
 * @param {object} resBody
 */
exports.assertStopWords = resBody => {
  for (const prop of PROPS) {
    const value = get(resBody, prop, '');
    if (value) {
      const foundStopWord = config.stopWords.find(stopWord => typeof stopWord === 'string'
        ? value.includes(stopWord)
        : stopWord.test(value)
      );
      throwIf(foundStopWord, `Stop word "${foundStopWord}" found in ${prop}: "${value}"`);
    }
  }
};
