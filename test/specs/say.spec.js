describe('say', () => {
  it('should send request by protocol', async () => {
    const user = new User();
    await user.enter();
    await user.say('Привет! Как дела?');

    assert.deepEqual(server.requests[1], {
      request:
        {
          command: 'привет как дела',
          original_utterance: 'Привет! Как дела?',
          type: 'SimpleUtterance',
          nlu: {
            tokens: [
              'привет',
              'как',
              'дела',
            ],
            entities: [],
          },
          markup: {
            dangerous_context: false
          },
        },
      session:
        {
          new: false,
          user_id: 'user-1',
          session_id: 'session-1',
          message_id: 2,
          skill_id: 'test-skill'
        },
      meta:
        {
          locale: 'ru-RU',
          timezone: 'Europe/Moscow',
          client_id: 'ru.yandex.searchplugin/5.80 (Samsung Galaxy; Android 4.4)',
          interfaces: {screen: {}}
        },
      version: '1.0'
    });
  });

  it('should save response to user props', async () => {
    const user = new User();
    server.setResponse({text: 'хай', tts: 'даров'});
    const response = await user.enter();
    await user.say('куку');

    assert.deepEqual(user.body, {
      response: {
        text: 'хай',
        tts: 'даров'
      },
      version: '1.0'
    });
    assert.deepEqual(user.response, {
      text: 'хай',
      tts: 'даров'
    });
    assert.deepEqual(user.response, response);
  });

  it('should normalize command', async () => {
    const user = new User();
    await user.enter();

    await user.say('  сообщение   с пробелами  \n');
    assert.equal(server.requests[1].request.command, 'сообщение с пробелами');

    await user.say('цифры 1 23 и математические знаки + - * /');
    assert.equal(server.requests[2].request.command, 'цифры 1 23 и математические знаки + - * /');
  });

  it('should fill entities: YANDEX.NUMBER', async () => {
    const user = new User();
    await user.enter();

    // todo: слова "плюс", "минус" вырезаются из tokens! Зарепортить баг: группа Танцы минус
    // todo: "5 разделить на 2 будет 2,5"
    await user.say('4 и 8 это 12');
    assert.deepEqual(server.requests[1].request.nlu, {
      tokens: ['4', 'и', '8', 'это', '12' ],
      entities:
        [
          {
            type: 'YANDEX.NUMBER',
            value: 4,
            tokens: {
              start: 0,
              end: 1,
            }
          },
          {
            type: 'YANDEX.NUMBER',
            value: 8,
            tokens: {
              start: 2,
              end: 3,
            }
          },
          {
            type: 'YANDEX.NUMBER',
            value: 12,
            tokens: {
              start: 4,
              end: 5,
            }
          },
        ]
    });
  });


  it('in-call extraProps', async () => {
    const user = new User();
    await user.enter();
    await user.say('куку', {
      request: {
        markup: {
          dangerous_context: true
        }
      }
    });

    assert.containSubset(server.requests[1], {
      request: {
        command: 'куку',
        original_utterance: 'куку',
        markup: {
          dangerous_context: true
        }
      }
    });
  });

  it('global extraProps', async () => {
    const user = new User(server, {session: {user_id: 'custom-user'}});
    await user.enter();
    await user.say('Что ты умеешь?');

    assert.containSubset(server.requests[1], {
      request: {
        command: 'что ты умеешь',
        original_utterance: 'Что ты умеешь?',
      },
      session: {
        user_id: 'custom-user'
      }
    });
  });

  it('global and in-call extraProps', async () => {
    const user = new User(server, {session: {user_id: 'custom-user'}});
    await user.enter();
    await user.say('куку', {
      request: {
        markup: {
          dangerous_context: true
        }
      }
    });

    assert.containSubset(server.requests[1], {
      request: {
        command: 'куку',
        original_utterance: 'куку',
        markup: {
          dangerous_context: true
        }
      },
      session: {
        user_id: 'custom-user'
      }
    });
  });

  it('extraProps as a function', async () => {
    const user = new User(server, body => body.session.user_id = 'custom-user');
    await user.enter();
    await user.say('куку', body => body.request.markup = {dangerous_context: true});

    assert.containSubset(server.requests[1], {
      request: {
        command: 'куку',
        original_utterance: 'куку',
        markup: {
          dangerous_context: true
        }
      }
    });
  });

  it('throws for non-200 response', async () => {
    const user = new User();
    await user.enter();
    server.setHandler((req, res) => {
      res.writeHead(500);
      res.end('Skill error');
    });
    await assert.rejects(user.say('Что ты умеешь?'), /Skill error/);
  });

  it('throws for timeout', async () => {
    User.config.responseTimeout = 100;
    const user = new User();
    await user.enter();
    server.setDelay(150);

    await assert.rejects(user.say('Что ты умеешь?'), /Response time \(\d+ ms\) exceeded timeout \(100 ms\)/);
  });

  it('throws for empty message', async () => {
    const user = new User();
    await user.enter();

    await assert.rejects(user.say(), /Нельзя отправить пустое сообщение от пользователя/);
  });
});
