describe('enter', () => {
  it('enter without message: request by protocol', async () => {
    const user = new User();
    await user.enter();

    assert.deepEqual(server.requests[0], {
      request:
        {
          command: '',
          original_utterance: 'запусти навык тест',
          type: 'SimpleUtterance',
          nlu: {
            tokens: [],
            entities: [],
            intents: {},
          },
          markup: {
            dangerous_context: false
          },
        },
      session:
        {
          new: true,
          user_id: 'user-1',
          application: {
            application_id: 'user-1',
          },
          session_id: 'session-1',
          message_id: 1,
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

  it('enter with message: request by protocol', async () => {
    const user = new User();
    await user.enter('Сколько времени?');
    assert.containSubset(server.requests[0], {
      request: {
        command: 'сколько времени',
        original_utterance: 'запусти навык тест Сколько времени?',
        type: 'SimpleUtterance',
        nlu: {
          tokens: [
            'сколько',
            'времени'
          ],
          entities: [],
        }
      },
    });
  });

  it('should save response to user props', async () => {
    const user = new User();
    const response = await user.enter();

    assert.deepEqual(user.body, {
      response: {
        text: 'привет',
        tts: 'привет'
      },
      version: '1.0'
    });
    assert.deepEqual(user.response, {
      text: 'привет',
      tts: 'привет'
    });
    assert.deepEqual(user.response, response);
  });

  it('global extraProps', async () => {
    const user = new User(server.getUrl(), {session: {user_id: 'custom-user'}});
    await user.enter();
    assert.containSubset(server.requests[0], {
      session: {
        new: true,
        user_id: 'custom-user'
      }
    });
  });

  it('in-call extraProps as object', async () => {
    const user = new User();
    await user.enter('пицца', {request: {nlu: {tokens: ['пицца']}}});
    assert.containSubset(server.requests[0], {
      request: {
        command: 'пицца',
        original_utterance: 'запусти навык тест пицца',
        nlu: {
          tokens: ['пицца']
        }
      }
    });
  });

  it('extraProps as a function', async () => {
    const user = new User(server, body => body.session.user_id = 'custom-user');
    await user.enter('пицца', body => body.request.nlu.tokens = ['пицца']);

    assert.containSubset(server.requests[0], {
      request: {
        command: 'пицца',
        original_utterance: 'запусти навык тест пицца',
        nlu: {
          tokens: ['пицца']
        }
      },
      session: {
        new: true,
        user_id: 'custom-user'
      }
    });
  });

  it('throws for timeout', async () => {
    User.config.responseTimeout = 100;
    server.setDelay(150);
    const user = new User();

    await assert.rejects(user.enter(), /Response time \(\d+ ms\) exceeded timeout \(100 ms\)/);
  });
});
