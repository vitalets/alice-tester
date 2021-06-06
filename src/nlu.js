/**
 * nlu
 */

exports.getNlu = command => {
  const tokens = getTokens(command);
  // todo: пока поддерживаются только целые числа!
  const entities = getNumbers(tokens);
  const intents = getIntents(command);
  return {
    tokens,
    entities,
    intents,
  };
};

const getTokens = command => {
  return command ? command.split(/\s+/) : [];
};

const getNumbers = tokens => {
  return tokens.reduce((acc, token, i) => {
    if (/\d+/.test(token)) {
      const entity = {
        type: 'YANDEX.NUMBER',
        value: Number(token),
        tokens: {
          start: i,
          end: i + 1,
        }
      };
      acc.push(entity);
    }
    return acc;
  }, []);
};

const getIntents = command => {
  return {
    ...getBuildInIntent(command)
  };
};

// see: https://yandex.ru/dev/dialogs/alice/doc/nlu.html#predefined-intents
const buildInIntents = {
  'YANDEX.CONFIRM': /^да$/,
  'YANDEX.REJECT': /^нет$/,
  'YANDEX.HELP': /^помощь$/,
  'YANDEX.REPEAT': /^повтори$/,
  'YANDEX.WHAT_CAN_YOU_DO': /^что ты умеешь$/,
};

const getBuildInIntent = command => {
  for (const key of Object.keys(buildInIntents)) {
    const regexp = buildInIntents[key];
    if (regexp.test(command)) {
      return {
        [key]: {
          slots: {}
        }
      };
    }
  }
  return {};
};
