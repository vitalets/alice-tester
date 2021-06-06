describe('tap (big image)', () => {

  it('throws for missing title params', async () => {
    server.setResponse({
      text: 'text',
    });
    const user = new User();
    await user.enter();
    await assert.rejects(user.tapImage(), /Для tapImage\(\) без параметра нужен bigImage с кнопкой в ответе/);
  });

  it('throws for big image without button', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'BigImage',
        image_id: '123',
        title: 'картинка!',
      }
    });
    const user = new User();
    await user.enter();
    await user.say('куку');
    await assert.rejects(user.tapImage(), /Для tapImage\(\) без параметра нужен bigImage с кнопкой в ответе/);
  });

  it('empty image button: send image title', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'BigImage',
        image_id: '123',
        title: 'картинка!',
        button: {
          // пустая кнопка: отправляет title
        }
      }
    });
    const user = new User();
    await user.enter();
    await user.tapImage();

    assert.deepEqual(server.requests[1].request, {
      command: 'картинка',
      original_utterance: 'картинка!',
      type: 'SimpleUtterance',
      nlu: {
        tokens: [
          'картинка',
        ],
        entities: [],
        intents: {},
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
        type: 'BigImage',
        image_id: '123',
        title: 'картинка!',
        button: {
          text: 'привет!'
        }
      }
    });
    const user = new User();
    await user.enter();
    await user.tapImage();

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
        type: 'BigImage',
        image_id: '123',
        title: 'картинка!',
        button: {
          payload: { foo: 42 }
        }
      }
    });
    const user = new User();
    await user.enter();
    await user.tapImage();

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
        type: 'BigImage',
        image_id: '123',
        title: 'картинка!',
        button: {
          url: `${server.getUrl()}/foo`
        }
      }
    });
    const user = new User();
    await user.enter();
    server.setEchoHandler();
    await user.tapImage();

    assert.equal(user.body, '{"method":"GET","url":"/foo"}');
  });

  it('tap with extraProps', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'BigImage',
        image_id: '123',
        title: 'картинка!',
        button: { }
      }
    });
    const user = new User();
    await user.enter();
    await user.tapImage('', {request: {markup: {dangerous_context: true}}});

    assert.deepEqual(server.requests[1].request, {
      command: 'картинка',
      original_utterance: 'картинка!',
      type: 'SimpleUtterance',
      nlu: { tokens: [ 'картинка' ], entities: [], intents: {} },
      markup: {
        dangerous_context: true
      }
    });
  });

  it('tap big image in history', async () => {
    server.setResponse({
      text: 'text',
      card: {
        type: 'BigImage',
        image_id: '123',
        title: 'картинка!',
        button: {
          // пустая кнопка: отправляет title
        }
      }
    });
    const user = new User();
    await user.enter();

    server.setResponse({ text: 'text' });
    await user.say('bla bla');

    await user.tapImage('картинка!');

    assert.deepEqual(server.requests[2].request, {
      command: 'картинка',
      original_utterance: 'картинка!',
      type: 'SimpleUtterance',
      nlu: { tokens: [ 'картинка' ], entities: [], intents: {} },
      markup: {
        dangerous_context: false
      },
    });
  });

});

