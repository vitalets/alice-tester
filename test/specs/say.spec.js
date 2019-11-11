describe('say', () => {
  it('should send request by protocol', async () => {
    const user = new User();
    await user.enter();
    await user.say('куку');

    assert.deepEqual(server.requests[1], {
      request:
        {
          command: 'куку',
          original_utterance: 'куку',
          type: 'SimpleUtterance',
          nlu: {}
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
      response: {text: 'хай', tts: 'даров'},
      session:
        {
          new: false,
          user_id: 'user-1',
          session_id: 'session-1',
          message_id: 2,
          skill_id: 'test-skill'
        },
      version: '1.0'
    });
    assert.deepEqual(user.response, {
      text: 'хай',
      tts: 'даров'
    });
    assert.deepEqual(user.response, response);
  });

  it('in-call extraProps', async () => {
    const user = new User();
    await user.enter();
    await user.say('2 + 2 равно 4', {
      request: {
        original_utterance: 'два плюс два равно четыре'
      }
    });

    assert.containSubset(server.requests[1], {
      request: {
        command: '2 + 2 равно 4',
        original_utterance: 'два плюс два равно четыре',
      }
    });
  });

  it('global extraProps', async () => {
    const user = new User(server, {session: {user_id: 'custom-user'}});
    await user.enter();
    await user.say('Что ты умеешь?');

    assert.containSubset(server.requests[1], {
      request: {
        command: 'Что ты умеешь?',
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
    await user.say('2 + 2 равно 4', {
      request: {
        original_utterance: 'два плюс два равно четыре'
      }
    });

    assert.containSubset(server.requests[1], {
      request: {
        command: '2 + 2 равно 4',
        original_utterance: 'два плюс два равно четыре',
      },
      session: {
        user_id: 'custom-user'
      }
    });
  });

  it('extraProps as a function', async () => {
    const user = new User(server, body => body.session.user_id = 'custom-user');
    await user.enter();
    await user.say('2 + 2 равно 4', body => body.request.original_utterance = 'два плюс два равно четыре');

    assert.containSubset(server.requests[1], {
      request: {
        command: '2 + 2 равно 4',
        original_utterance: 'два плюс два равно четыре',
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
});

