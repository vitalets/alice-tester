/**
 * nlu
 */

exports.getNlu = command => {
  const tokens = getTokens(command);
  // todo: пока поддерживаются только целые числа!
  const entities = getNumbers(tokens);
  return {
    tokens,
    entities,
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
