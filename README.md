# alice-tester

[![Build Status](https://travis-ci.org/vitalets/alice-tester.svg?branch=master)](https://travis-ci.org/vitalets/alice-tester)
[![Coverage Status](https://coveralls.io/repos/github/vitalets/alice-tester/badge.svg?branch=master)](https://coveralls.io/github/vitalets/alice-tester?branch=master)
[![npm](https://img.shields.io/npm/v/alice-tester.svg)](https://www.npmjs.com/package/alice-tester)
[![license](https://img.shields.io/npm/l/alice-tester.svg)](https://www.npmjs.com/package/alice-tester)

Node.js библиотека для автоматического тестирования навыков Алисы. 
Позволяет эмулировать сообщения пользователя в соответствии с [протоколом](https://tech.yandex.ru/dialogs/alice/doc/protocol-docpage/)
и проверять ответы навыка.

## Содержание

<!-- toc -->

- [Установка](#%D1%83%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0)
- [Использование](#%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5)
  * [Один тест](#%D0%BE%D0%B4%D0%B8%D0%BD-%D1%82%D0%B5%D1%81%D1%82)
  * [Много тестов](#%D0%BC%D0%BD%D0%BE%D0%B3%D0%BE-%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2)
- [API](#api)
  * [new User(webhookUrl, [extraProps])](#new-userwebhookurl-extraprops)
  * [user.enter([message], [extraProps])](#userentermessage-extraprops)
  * [user.say(message, [extraProps])](#usersaymessage-extraprops)
  * [user.tap(title, [extraProps])](#usertaptitle-extraprops)
  * [user.response](#userresponse)
  * [user.body](#userbody)
  * [user.userId](#useruserid)
  * [user.sessionId](#usersessionid)
- [Лицензия](#%D0%BB%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F)

<!-- tocstop -->

## Установка
```bash
npm i alice-tester --save-dev
```

## Использование
### Один тест
Если веб-сервер с навыком запущен локально на `http://localhost:3000`, то тест может выглядеть так:
```js
// test.js
const assert = require('assert');
const User = require('alice-tester');

it('should get welcome message', async () => {
  const user = new User('http://localhost:3000'); // создаем пользователя

  await user.enter(); // пользователь заходит в навык
  assert.equal(user.response.text, 'Добро пожаловать!'); // проверяем, что навык нас поприветствовал
  
  await user.say('Что ты умеешь?'); // отправляем сообщение в навык
  assert.equal(user.response.text, 'Я умею играть в города.'); // проверяем, что навык ответил верно (текстом)
  assert.equal(user.response.tts, 'Я умею играть в город+а.'); // проверяем, что навык ответил верно (голосом)
  assert.deepEqual(user.response.buttons, [{title: 'Помощь', hide: true}]); // проверяем, что навык нарисовал правильные кнопки
});
```

Запустить тест можно через [mocha](https://mochajs.org):
```bash
$ mocha test.js

  ✓ should get welcome message

  1 passing (34ms)
```

### Много тестов
Когда тестов станет больше, запуск/остановку сервера удобнее вынести в `before/after` хуки:
```js
const assert = require('assert');
const User = require('alice-tester');
const server = require('./server');

const PORT = 3000;

before(done => {
  // запускаем сервер навыка
  server.listen(PORT, done);
});

it('should get welcome message', async () => {
  const user = new User(`http://localhost:${PORT}`);
  const response = await user.enter();
  assert.equal(response.text, 'Добро пожаловать!');
});

it('should show help', async () => {
  const user = new User(`http://localhost:${PORT}`);
  await user.enter();
  const response = await user.say('Что ты умеешь?');
  assert.equal(user.response.text, 'Я умею играть в города.');
});

after(done => {
  // останавливаем сервер
  server.close(done);
});
```

Результат:
```bash
$ mocha test.js

  ✓ should get welcome message
  ✓ should show help

  2 passing (37ms)
```

Более подробно про разработку тестов для навыков можно почитать в [статье на Хабре](https://habr.com/ru/post/441978/). 

## API

### new User(webhookUrl, [extraProps])
Создание нового пользователя для теста.  
**Параметры:**
  * **webhookUrl** `{String}` - вебхук-урл навыка.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к каждому запросу, либо функция модификации тела запроса.

### user.enter([message], [extraProps])
Вход пользователя в навык.  
**Параметры:**
  * **message** `{?String=''}` - фраза, с которой пользователь пришел в навык.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к телу запросу, либо функция модификации тела запроса.

**Returns**: `Promise`

### user.say(message, [extraProps])
Отправка сообщения в навык.  
**Параметры:**
  * **message** `{String}` - сообщение.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к телу запросу, либо функция модификации тела запроса.

**Returns**: `Promise`

### user.tap(title, [extraProps])
Нажатие пользователем на кнопку с заданным текстом.
Если предыдущий запрос не вернул кнопок, то будет ошибка.
Если предыдущий запрос вернул кнопки с дополнительными данными (payload), то эти данные будут прикреплены к запросу.   
**Параметры:**
  * **title** `{String}` - текст кнопки.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к телу запросу, либо функция модификации тела запроса.

**Returns**: `Promise`

### user.response
Поле `response` из последнего [ответа](https://tech.yandex.ru/dialogs/alice/doc/protocol-docpage/#response) навыка.
 
### user.body
Тело последнего [ответа](https://tech.yandex.ru/dialogs/alice/doc/protocol-docpage/#response) навыка.

### user.userId
Сгенерированный идентификатор пользователя.

### user.sessionId
Сгенерированный идентификатор текущей сессии.

## Лицензия
MIT @ [Vitaliy Potapov](https://github.com/vitalets)

