describe('tap', () => {

  it('should send request by protocol (button without payload)', async () => {
    const buttons = [{title: 'Да, начинаем!'}];
    server.setResponse({buttons});
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
          }
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

  it('should set user props', async () => {
    const buttons = [{title: 'Да'}];
    server.setResponse({buttons});
    const user = new User();
    await user.enter();
    const response = await user.tap('Да');

    assert.deepEqual(user.body, {
      response: {
        buttons: [
          {title: 'Да'}
        ]
      },
      session:
        {
          message_id: 2,
          new: false,
          session_id: 'session-1',
          skill_id: 'test-skill',
          user_id: 'user-1'
        },
      version: '1.0'
    });
    assert.deepEqual(user.response, {
      buttons: [
        {title: 'Да'}
      ]
    });
    assert.deepEqual(user.response, response);
  });

  it('tap by title (button with payload)', async () => {
    const buttons = [
      {title: 'Да', payload: {foo: 1}}
    ];
    server.setResponse({buttons});
    const user = new User();
    await user.enter();
    await user.tap('Да');

    assert.containSubset(server.requests[1], {
      request: {
        command: 'да',
        original_utterance: 'Да',
        type: 'ButtonPressed',
        payload: {foo: 1}
      }
    });
  });

  it('tap by regexp', async () => {
    const buttons = [
      {title: 'Да', payload: {foo: 1}}
    ];
    server.setResponse({buttons});
    const user = new User();
    await user.enter();
    await user.tap(/д/i);

    assert.containSubset(server.requests[1], {
      request: {
        command: 'да',
        original_utterance: 'Да',
        type: 'ButtonPressed',
        payload: {foo: 1}
      }
    });
  });

  it('tab with extraProps', async () => {
    const buttons = [{title: 'Да'}];
    server.setResponse({buttons});
    const user = new User();
    await user.enter();
    await user.tap('Да', {request: {markup: {dangerous_context: true}}});

    assert.containSubset(server.requests[1], {
      request: {
        command: 'да',
        original_utterance: 'Да',
        type: 'SimpleUtterance',
        markup: {dangerous_context: true}
      }
    });
  });

  it('tap with extraProps as a function', async () => {
    const buttons = [{title: 'Да'}];
    server.setResponse({buttons});
    const user = new User();
    await user.enter();
    await user.tap('Да', body => body.request.markup = {dangerous_context: true});

    assert.containSubset(server.requests[1], {
      request: {
        command: 'да',
        original_utterance: 'Да',
        type: 'SimpleUtterance',
        markup: {dangerous_context: true}
      }
    });
  });

  it('throws for missing buttons', async () => {
    const user = new User();
    await user.enter();
    await assert.rejects(user.tap('Да'), /Предыдущий запрос не вернул ни одной кнопки/);
  });

  it('throws if non matched by title', async () => {
    const buttons = [
      {title: 'Да'},
      {title: 'Нет'},
    ];
    server.setResponse({buttons});

    const user = new User();
    await user.enter();
    await assert.rejects(user.tap('Ок'),
      /Кнопка "Ок" не найдена среди возможных кнопок: Да, Нет./
    );
  });

  it('throws if non matched by regexp', async () => {
    const buttons = [
      {title: 'Да'},
      {title: 'Нет'},
    ];
    server.setResponse({buttons});

    const user = new User();
    await user.enter();
    await assert.rejects(user.tap(/помощь/i),
      /Кнопка "\/помощь\/i" не найдена среди возможных кнопок: Да, Нет./
    );
  });

  it('navigate to url if button contains url', async () => {
    const buttons = [{
      title: 'кнопка',
      url: `${server.getUrl()}/foo`
    }];
    server.setResponse({buttons});
    const user = new User();
    await user.enter();
    server.setHandlerReqInfo();
    await user.tap('кнопка');

    assert.equal(user.body, '{"method":"GET","url":"/foo"}');
  });
});

