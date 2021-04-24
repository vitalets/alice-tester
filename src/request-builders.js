/**
 * Хелперы для сборки request body.
 */
const { getNlu } = require('./nlu');

const buildReqBody = ({ request, session, state }) => {
  state = buildStateObject(state);
  return {
    request,
    session,
    meta: buildMetaObject(),
    ...(state ? { state } : {}),
    version: '1.0',
  };
};

const buildSimpleUtteranceRequest = userMessage => {
  const command = buildCommand(userMessage);
  const nlu = getNlu(command);
  return {
    command,
    original_utterance: userMessage,
    type: 'SimpleUtterance',
    nlu,
    markup: {
      dangerous_context: false
    },
  };
};

const buildEnterRequest = userMessage => {
  return {
    ...buildSimpleUtteranceRequest(userMessage),
    original_utterance: `запусти навык тест${userMessage === '' ? '' : ` ${userMessage}`}`,
  };
};

/**
 * При нажатии на кнопку с payload в запросе не приходят command, original_utterance, markup
 */
const buildButtonPressedRequest = payload => {
  return {
    payload,
    type: 'ButtonPressed',
    nlu: {
      tokens: [],
      entities: [],
    },
  };
};

const buildSessionObject = ({ userId, sessionId, messagesCount }) => {
  return {
    new: messagesCount === 1,
    user_id: userId, /* deprecated in favor of application.application_id */
    application: {
      application_id: userId,
    },
    session_id: sessionId,
    message_id: messagesCount,
    skill_id: 'test-skill',
  };
};

const buildMetaObject = () => {
  return {
    locale: 'ru-RU',
    timezone: 'Europe/Moscow',
    client_id: 'ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)',
    interfaces: {
      screen: {}
    }
  };
};

const buildStateObject = state => {
  return (state && Object.keys(state).length > 0) ? state : null;
};

const buildCommand = message => {
  return message
    // приводим к нижнему регистру
    .toLowerCase()
    // удаляем знаки препинания
    .replace(/[,.!?]/g, '')
    // удаляем повторяющиеся пробелы
    .replace(/\s+/g, ' ')
    // отрезаем пробелы в начале и конце
    .trim();
};

module.exports = {
  buildReqBody,
  buildSimpleUtteranceRequest,
  buildEnterRequest,
  buildButtonPressedRequest,
  buildSessionObject,
};
