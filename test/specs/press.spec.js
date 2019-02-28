
const {createRequest, createResponse} = require('../protocol');

describe('press', () => {
  it('existing button without payload', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse({
      response: {buttons: [
        {title: 'Да'}
      ]}
    });

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Да', original_utterance: 'Да', type: 'ButtonPressed'}
    });
    const resBody2 = createResponse();

    const scope1 = nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const scope2 = nock('http://localhost').post('/', reqBody2).reply(200, resBody2);

    const user = new User('http://localhost');
    await user.enter();
    await user.press('Да');

    scope1.done();
    scope2.done();
  });

  it('existing button with payload', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse({
      response: {buttons: [
          {title: 'Да', payload: {foo: 1}}
        ]}
    });

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Да', original_utterance: 'Да', type: 'ButtonPressed', payload: {foo: 1}}
    });
    const resBody2 = createResponse();

    const scope1 = nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const scope2 = nock('http://localhost').post('/', reqBody2).reply(200, resBody2);

    const user = new User('http://localhost');
    await user.enter();
    await user.press('Да');

    scope1.done();
    scope2.done();
  });

  it('existing button with extraProps', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse({
      response: {buttons: [
          {title: 'Да'}
        ]}
    });

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Да', original_utterance: 'Да', type: 'ButtonPressed', markup: {dangerous_context: true}}
    });
    const resBody2 = createResponse();

    const scope1 = nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const scope2 = nock('http://localhost').post('/', reqBody2).reply(200, resBody2);

    const user = new User('http://localhost');
    await user.enter();
    await user.press('Да', {request: {markup: {dangerous_context: true}}});

    scope1.done();
    scope2.done();
  });

  it('throws for missing buttons', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse();

    nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const user = new User('http://localhost');
    await user.enter();
    await assertThrowsAsync(() => user.press('Да'), /Предыдущий запрос не вернул ни одной кнопки/);
  });

  it('throws for not matched buttons', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse({
      response: {buttons: [
          {title: 'Да'},
          {title: 'Нет'},
        ]}
    });

    nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const user = new User('http://localhost');
    await user.enter();
    await assertThrowsAsync(() => user.press('Ок'),
      /Кнопка "Ок" не найдена среди возможных кнопок: Да, Нет./
    );
  });
});

