# alice-tester

[![Build Status](https://travis-ci.org/vitalets/alice-tester.svg?branch=master)](https://travis-ci.org/vitalets/alice-tester)
[![Coverage Status](https://coveralls.io/repos/github/vitalets/alice-tester/badge.svg?branch=master)](https://coveralls.io/github/vitalets/alice-tester?branch=master)
[![npm](https://img.shields.io/npm/v/alice-tester.svg)](https://www.npmjs.com/package/alice-tester)
[![license](https://img.shields.io/npm/l/alice-tester.svg)](https://www.npmjs.com/package/alice-tester)

Библиотека для автоматического тестирования навыков Алисы на Node.js. 
Позволяет эмулировать сообщения пользователя в соответствии с [протоколом](https://tech.yandex.ru/dialogs/alice/doc/protocol-docpage/)
и проверять ответы навыка.

## Содержание

<!-- toc -->

- [Установка](#%D1%83%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0)
- [Использование](#%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5)
- [API](#api)
  * [User.config](#userconfig)
  * [new User([webhookUrl], [extraProps])](#new-userwebhookurl-extraprops)
  * [user.enter([message], [extraProps])](#userentermessage-extraprops)
  * [user.say(message, [extraProps])](#usersaymessage-extraprops)
  * [user.tap(title, [extraProps])](#usertaptitle-extraprops)
  * [user.response](#userresponse)
  * [user.body](#userbody)
  * [user.id](#userid)
  * [user.sessionId](#usersessionid)
- [Проверка времени ответа](#%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%BA%D0%B0-%D0%B2%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D0%B8-%D0%BE%D1%82%D0%B2%D0%B5%D1%82%D0%B0)
- [Проверка размеров ответа](#%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%BA%D0%B0-%D1%80%D0%B0%D0%B7%D0%BC%D0%B5%D1%80%D0%BE%D0%B2-%D0%BE%D1%82%D0%B2%D0%B5%D1%82%D0%B0)
- [Запись ответов в файл](#%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D1%8C-%D0%BE%D1%82%D0%B2%D0%B5%D1%82%D0%BE%D0%B2-%D0%B2-%D1%84%D0%B0%D0%B9%D0%BB)
- [Отладка тестов](#%D0%BE%D1%82%D0%BB%D0%B0%D0%B4%D0%BA%D0%B0-%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2)
- [История версий](#%D0%B8%D1%81%D1%82%D0%BE%D1%80%D0%B8%D1%8F-%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D0%B9)
- [Лицензия](#%D0%BB%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F)

<!-- tocstop -->

## Установка
```bash
npm i alice-tester --save-dev
```

## Использование
Если веб-сервер с навыком запущен локально на `http://localhost:3000`, то тест может выглядеть так:
```js
const assert = require('assert');
const User = require('alice-tester');

it('should get welcome message', async () => {
  const user = new User('http://localhost:3000');
  await user.enter();
  
  assert.equal(user.response.text, 'Добро пожаловать!');
});
```

Запустить тест можно через [mocha](https://mochajs.org):
```
$ mocha test.js

  ✓ should get welcome message

  1 passing (34ms)
```

Дальше можно добавить тест взаимодействия с навыком.
Спросить пользователем `"Что ты умеешь?"` и проверить текстово-голосовой ответ и кнопки:
```js
const assert = require('assert');
const User = require('alice-tester');

it('should show help', async () => {
  const user = new User('http://localhost:3000');
  await user.enter();
  await user.say('Что ты умеешь?');

  assert.equal(user.response.text, 'Я умею играть в города.');
  assert.equal(user.response.tts, 'Я умею играть в город+а.');
  assert.deepEqual(user.response.buttons, [{title: 'Понятно', hide: true}]);
});
```

Когда тестов станет больше, запуск/остановку сервера удобно вынести в `before/after` хуки:
```js
const assert = require('assert');
const User = require('alice-tester');
const server = require('./server');

const PORT = 3000;

before(done => {
  server.listen(PORT, done);
});

after(done => {
  server.close(done);
});

it('should get welcome message', async () => {
  const user = new User(`http://localhost:${PORT}`);
  await user.enter();

  assert.equal(user.response.text, 'Добро пожаловать!');
});

it('should show help', async () => {
  const user = new User(`http://localhost:${PORT}`);
  await user.enter();
  await user.say('Что ты умеешь?');

  assert.equal(user.response.text, 'Я умею играть в города.');
});
```

Результат:
```
$ mocha test.js

  ✓ should get welcome message
  ✓ should show help

  2 passing (37ms)
```

Более подробно про разработку тестов для навыков можно почитать в [статье на Хабре](https://habr.com/ru/post/441978/). 

## API

### User.config
Глобальный конфиг класса `User`:
  * **generateUserId** `{Function}` - функция генерации `userId`. По умолчанию: `` () => `${Date.now()}-${Math.random()}` ``
  * **responseTimeout** `{Number}` - таймаут для ответа навыка (мс). По умолчанию: `1000`
  * **webhookUrl** `{String}` - дефолтный вебхук-урл. По умолчанию: `''`

Пример:
```js
User.config.generateUserId = () => Date.now();
User.config.responseTimeout = 500;
User.config.webhookUrl = 'http://localhost:3000';
```

### new User([webhookUrl], [extraProps])
Создание нового пользователя для теста.  
**Параметры:**
  * **webhookUrl** `{?String|http.Server}` - вебхук-урл навыка в виде строки или инстанса `http.Server`. Если не передан, используется дефолтный из `User.config.webhookUrl`.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к каждому запросу, либо функция модификации тела запроса.

Примеры:
```js
// обычный пользователь
const user = new User('http://localhost');

// пользователь с заданным user_id
const user = new User('http://localhost', {session: {user_id: 'custom-user-id'}});

// пользователь без экрана
const user = new User('http://localhost', body => delete body.meta.interfaces.screen);

// используем дефолтный вебхук-урл
User.config.webhookUrl = 'http://localhost:3000';
const user = new User();
```

### user.enter([message], [extraProps])
Вход пользователя в навык.  
**Параметры:**
  * **message** `{?String=''}` - фраза, с которой пользователь пришел в навык. При этом в `original_utterance` по умолчанию будет `"запусти навык тест {message}"`.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к телу запросу, либо функция модификации тела запроса.

**Returns**: `Promise<response>`

### user.say(message, [extraProps])
Отправка сообщения в навык.  
**Параметры:**
  * **message** `{String}` - сообщение. По умолчанию одинаковое в `command` и `original_utterance`.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к телу запросу, либо функция модификации тела запроса.

**Returns**: `Promise<response>`

### user.tap(title, [extraProps])
Нажатие пользователем на кнопку с заданным текстом.
Если предыдущий запрос не вернул кнопок, то будет ошибка.
Если предыдущий запрос вернул кнопки с дополнительными данными (payload), то эти данные будут прикреплены к запросу.   
**Параметры:**
  * **title** `{String}` - текст кнопки.
  * **extraProps** `{?Object|Function}` - объект с полями, которые будут добавлены к телу запросу, либо функция модификации тела запроса.

**Returns**: `Promise<response>`

### user.response
Поле `response` из последнего [ответа](https://tech.yandex.ru/dialogs/alice/doc/protocol-docpage/#response) навыка.
 
### user.body
Тело последнего [ответа](https://tech.yandex.ru/dialogs/alice/doc/protocol-docpage/#response) навыка.

### user.id
Сгенерированный идентификатор пользователя.

### user.sessionId
Сгенерированный идентификатор текущей сессии.

## Проверка времени ответа
Если время ответа на запрос превышает `User.config.responseTimeout`, то тест упадет с ошибкой:
```
Response time (1056 ms) exceeded timeout (1000 ms)
```
Можно выставить любое другое значение порога, либо отключить проверку значением `0`.

## Проверка размеров ответа
На многие поля ответа накладываются ограничения по длине. 
Например, `response.text` не может быть больше 1024 символов.
В процессе прогона тестов `alice-tester` автоматически проверяет все ответы навыка на соответствие лимитам
и кидает ошибку в случае их нарушения:
```
Length of response.text (1049) is greater than allowed (1024): События романа «Война и мир» происходят ... и преодолевать любые трудности.
```

## Запись ответов в файл
Если при запуске тестов указать переменную окружения `ALICE_TESTER_RECORD=path/to/file.json`,
то все уникальные ответы навыка будут записаны в этот файл:
```
ALICE_TESTER_RECORD=responses.json mocha test.js
```

Пример полученного `responses.json`:
```json
[
  {
    "text": "Здорово!",
    "tts": "Здор+ово!"
  },
  {
    "text": "Это приватный навык и недоступен для публичного использования.",
    "tts": "Это приватный навык и недоступен для публичного использования."
  }
]
```

## Отладка тестов
Для отладки тестов можно использовать переменную окружения DEBUG (см [debug](https://github.com/visionmedia/debug)).
Тогда в консоль будут выводится все отправляемые запросы и ответы:
```bash
DEBUG=alice-tester mocha test.js
```
В консоли:
```
alice-tester REQUEST: {"request":{"command":"","original_utterance":"","type":"SimpleUtterance"},"session":{"new":true,"user_id":"user-1","session_id":"session-1","message_id":1,"skill_id":"test-skill"},"meta":{"locale":"ru-RU","timezone":"Europe/Moscow","client_id":"ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)","interfaces":{"screen":{}}},"version":"1.0"} +0ms
alice-tester RESPONSE: {"version":"1.0","session":{"new":true,"user_id":"user-1","session_id":"session-1","message_id":1,"skill_id":"test-skill"},"response":{"text":"Это приватный навык и недоступен для публичного использования.","tts":"Это приватный навык и недоступен для публичного использования.","end_session":true}} +15ms
```

## История версий
 * [0.5.0](https://github.com/vitalets/alice-tester/milestone/1?closed=1)

## Лицензия
MIT @ [Vitaliy Potapov](https://github.com/vitalets)

