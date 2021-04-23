describe('tap (button)', () => {

  it('button without payload: send command and original_utterance', async () => {
    server.setResponse({
      text: 'text',
      buttons: [
        { title: 'Да, начинаем!' }
      ]
    });
    const user = new User();
    await user.enter();
    await user.tap('Да, начинаем!');

    assert.deepEqual(server.requests[1], {
      request:
        {
          command: 'да начинаем',
          original_utterance: 'Да, начинаем!',
          type: 'SimpleUtterance',
          nlu: {
            tokens: [
              'да',
              'начинаем'
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

  it('button with payload: send payload, no command, no original_utterance', async () => {
    server.setResponse({
      text: 'text',
      buttons: [
        { title: 'Да', payload: {foo: 1} }
      ]
    });
    const user = new User();
    await user.enter();
    await user.tap('Да');

    assert.deepEqual(server.requests[1].request, {
      type: 'ButtonPressed',
      payload: {foo: 1},
      nlu: {
        tokens: [],
        entities: [],
      }
    });
  });

  it('should set user props from response', async () => {
    server.setResponse({
      text: 'text',
      buttons: [
        { title: 'Да' }
      ]
    });
    const user = new User();
    await user.enter();
    const response = await user.tap('Да');

    assert.deepEqual(user.body, {
      response: {
        text: 'text',
        buttons: [
          {title: 'Да'}
        ]
      },
      version: '1.0'
    });
    assert.deepEqual(user.response, {
      text: 'text',
      buttons: [
        {title: 'Да'}
      ]
    });
    assert.deepEqual(user.response, response);
  });

  it('tap by regexp', async () => {
    server.setResponse({
      text: 'text',
      buttons: [
        {title: 'Да', payload: {foo: 1}}
      ]
    });
    const user = new User();
    await user.enter();
    await user.tap(/д/i);

    assert.deepEqual(server.requests[1].request, {
      type: 'ButtonPressed',
      payload: {foo: 1},
      nlu: {
        tokens: [],
        entities: [],
      }
    });
  });

  it('tap with extraProps', async () => {
    server.setResponse({
      text: 'text',
      buttons: [
        { title: 'Да' }
      ]
    });
    const user = new User();
    await user.enter();
    await user.tap('Да', {request: {markup: {dangerous_context: true}}});

    assert.deepEqual(server.requests[1].request, {
      command: 'да',
      original_utterance: 'Да',
      type: 'SimpleUtterance',
      nlu: { tokens: [ 'да' ], entities: [] },
      markup: {
        dangerous_context: true
      }
    });
  });

  it('throws for missing buttons', async () => {
    const user = new User();
    await user.enter();
    await assert.rejects(user.tap('Да'), /Кнопка "Да" не найдена/);
  });

  it('throws if non matched by title', async () => {
    server.setResponse({
      text: 'text',
      buttons: [
        {title: 'Да'},
        {title: 'Нет'},
      ]
    });
    const user = new User();
    await user.enter();
    await assert.rejects(user.tap('Ок'), /Кнопка "Ок" не найдена/);
  });

  it('throws if non matched by regexp', async () => {
    server.setResponse({
      text: 'text',
      buttons: [
        {title: 'Да'},
        {title: 'Нет'},
      ]
    });

    const user = new User();
    await user.enter();
    await assert.rejects(user.tap(/помощь/i), /Кнопка "\/помощь\/i" не найдена/);
  });

  it('navigate to url if button contains url', async () => {
    server.setResponse({
      text: 'text',
      buttons: [{
        title: 'кнопка',
        url: `${server.getUrl()}/foo`
      }]
    });
    const user = new User();
    await user.enter();
    server.setEchoHandler();
    await user.tap('кнопка');

    assert.equal(user.body, '{"method":"GET","url":"/foo"}');
  });

  it('tap non-hidden button in history', async () => {
    server.setResponse({
      text: 'text',
      buttons: [{ title: 'кнопка', hide: false }]
    });
    const user = new User();
    await user.enter();

    server.setResponse({ text: 'привет' });
    await user.say('blabla');

    await user.tap('кнопка');

    assert.deepEqual(server.requests[2].request, {
      command: 'кнопка',
      original_utterance: 'кнопка',
      type: 'SimpleUtterance',
      nlu: { tokens: [ 'кнопка' ], entities: [] },
      markup: {
        dangerous_context: false
      }
    });
  });

  it('does not tap hidden button in history', async () => {
    server.setResponse({
      text: 'text',
      buttons: [{ title: 'кнопка', hide: true }]
    });
    const user = new User();
    await user.enter();

    server.setResponse({ text: 'привет' });
    await user.say('blabla');

    await assert.rejects(user.tap('кнопка'), /Кнопка "кнопка" не найдена/);
  });
});

