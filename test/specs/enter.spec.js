describe('enter', () => {
  it('should send request by protocol', async () => {
    const user = new User();
    await user.enter();

    assert.deepEqual(server.requests[0], {
      request:
        {
          command: '',
          original_utterance: 'запусти навык тест',
          type: 'SimpleUtterance',
          nlu: {}
        },
      session:
        {
          new: true,
          user_id: 'user-1',
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

  it('should save response to user props', async () => {
    const user = new User();
    const response = await user.enter();

    assert.deepEqual(user.body, {
      response: {text: 'привет', tts: 'привет'},
      session:
        {
          new: true,
          user_id: 'user-1',
          session_id: 'session-1',
          message_id: 1,
          skill_id: 'test-skill'
        },
      version: '1.0'
    });
    assert.deepEqual(user.response, {
      text: 'привет',
      tts: 'привет'
    });
    assert.deepEqual(user.response, response);
  });

  it('enter with message', async () => {
    const user = new User();
    await user.enter('куку');
    assert.containSubset(server.requests[0], {
      request: {
        command: 'куку',
        original_utterance: 'запусти навык тест куку',
      },
    });
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
