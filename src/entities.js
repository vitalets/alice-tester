/**
 * nlu.entities
 */

module.exports = tokens => {
  return []
    .concat(getNumbers(tokens));
};

// todo: пока поддерживаются только целые числа!
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
