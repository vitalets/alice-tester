describe('tap (items list)', () => {

  it('throws for missing "items" field', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
      }
    });
    const user = new User();
    await user.enter();
    const promise = user.tapImage('картинка');

    await assert.rejects(promise, /Изображение с кнопкой "картинка" не найдено/);
  });

  it('throws for no items with "button" field', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [{
          image_id: '123',
          title: 'картинка!',
        }]
      }
    });
    const user = new User();
    await user.enter();
    const promise = user.tapImage('картинка');

    await assert.rejects(promise, /Изображение с кнопкой "картинка" не найдено/);
  });

  it('throws for empty title in tapImage()', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [{
          image_id: '123',
          title: 'картинка!',
          button: { }
        }]
      }
    });
    const user = new User();
    await user.enter();
    const promise = user.tapImage();

    await assert.rejects(promise, /Для tapImage\(\) без параметра нужен bigImage с кнопкой в ответе/);
  });

  it('empty image button: send image title', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [{
          image_id: '123',
          title: 'картинка!',
          button: {
            // пустая кнопка: отправляет title
          }
        }]
      }
    });
    const user = new User();
    await user.enter();
    await user.tapImage('картинка!');

    assert.deepEqual(server.requests[1].request, {
      command: 'картинка',
      original_utterance: 'картинка!',
      type: 'SimpleUtterance',
      nlu: {
        tokens: [
          'картинка',
        ],
        entities: [],
        intents: {}
      },
      markup: {
        dangerous_context: false
      },
    });
  });

  it('image button with text: send button text', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [{
          image_id: '123',
          title: 'картинка!',
          button: {
            text: 'привет!'
          }
        }]
      }
    });
    const user = new User();
    await user.enter();
    await user.tapImage('привет!');

    assert.deepEqual(server.requests[1].request, {
      command: 'привет',
      original_utterance: 'привет!',
      type: 'SimpleUtterance',
      nlu: {
        tokens: [
          'привет',
        ],
        entities: [],
        intents: {},
      },
      markup: {
        dangerous_context: false
      },
    });
  });

  it('image button with payload: send button payload', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [{
          image_id: '123',
          title: 'картинка!',
          button: {
            payload: { foo: 42 }
          }
        }]
      }
    });
    const user = new User();
    await user.enter();
    await user.tapImage('картинка!');

    assert.deepEqual(server.requests[1].request, {
      type: 'ButtonPressed',
      payload: { foo: 42 },
      nlu: {
        tokens: [],
        entities: [],
      },
    });
  });

  it('image button with url: navigate', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [{
          image_id: '123',
          title: 'картинка!',
          button: {
            url: `${server.getUrl()}/foo`
          }
        }]
      }
    });
    const user = new User();
    await user.enter();
    server.setEchoHandler();
    await user.tapImage('картинка!');

    assert.equal(user.body, '{"method":"GET","url":"/foo"}');
  });

  it('match by regexp', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [
          {
            image_id: '123',
            title: 'картинка!',
            button: {}
          },
          {
            image_id: '456',
            title: 'куку',
            button: {}
          }
        ]
      }
    });

    const user = new User();
    await user.enter();
    await user.tapImage(/карт/);

    assert.deepEqual(server.requests[1].request, {
      command: 'картинка',
      original_utterance: 'картинка!',
      type: 'SimpleUtterance',
      nlu: {
        tokens: [
          'картинка',
        ],
        entities: [],
        intents: {}
      },
      markup: {
        dangerous_context: false
      },
    });
  });

  it('throws if non matched', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [
          {
            image_id: '123',
            title: 'картинка!',
            button: {}
          },
          {
            image_id: '456',
            title: 'куку',
            button: {}
          }
        ]
      }
    });

    const user = new User();
    await user.enter();
    const promise = user.tapImage('блабла');
    await assert.rejects(promise, /Изображение с кнопкой "блабла" не найдено/);
  });

  it('tap image item in history', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'ItemsList',
        items: [{
          image_id: '123',
          title: 'картинка!',
          button: {
            text: 'привет!'
          }
        }]
      }
    });
    const user = new User();
    await user.enter();

    server.setResponse({ text: 'text' });
    await user.say('bla bla');

    await user.tapImage('привет!');

    assert.deepEqual(server.requests[2].request, {
      command: 'привет',
      original_utterance: 'привет!',
      type: 'SimpleUtterance',
      nlu: {
        tokens: [
          'привет',
        ],
        entities: [],
        intents: {}
      },
      markup: {
        dangerous_context: false
      },
    });
  });

});

