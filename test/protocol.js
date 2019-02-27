/**
 * Base request and response body.
 */

const merge = require('lodash.merge');

exports.createRequest = obj => {
  return merge({
    request: {
      command: '',
      original_utterance: '',
      type: 'SimpleUtterance',
    },
    session: {
      new: true,
      user_id: 'user-1',
      session_id: 'session-1',
      message_id: 1,
      skill_id: 'test-skill',
    },
    meta: {
      locale: 'ru-RU',
      timezone: 'Europe/Moscow',
      client_id: 'ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)',
      interfaces: {
        screen: {}
      }
    },
    version: '1.0'
  }, obj);
};

exports.createResponse = obj => {
  return merge({
    response: {
      text: 'привет',
      tts: 'прив+ет',
      buttons: [
        {title: 'Отлично', hide: true}
      ],
      end_session: false,
    },
  }, obj);
};
