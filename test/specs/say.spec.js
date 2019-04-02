
const {createRequest, createEnterRequest, createResponse} = require('../protocol');

describe('say', () => {
  it('regular', async () => {
    const reqBody1 = createEnterRequest();
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });
    const resBody2 = createResponse({response: {text: 'Как дела?'}});

    const scope = nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1)
      .post('/', reqBody2)
      .reply(200, resBody2);

    const user = new User('http://localhost');
    await user.enter();
    const response = await user.say('Что ты умеешь?');

    scope.done();
    assert.deepEqual(user.body, resBody2);
    assert.equal(user.response.text, 'Как дела?');
    assert.deepEqual(user.response, response);
  });

  it('with extraProps', async () => {
    const reqBody1 = createEnterRequest();
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: '2 + 2 равно 4', original_utterance: 'два плюс два равно четыре'}
    });
    const resBody2 = createResponse({response: {text: 'Как дела?'}});

    const scope = nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1)
      .post('/', reqBody2)
      .reply(200, resBody2);

    const user = new User('http://localhost');
    await user.enter();
    await user.say('2 + 2 равно 4', {request: {original_utterance: 'два плюс два равно четыре'}});

    scope.done();
    assert.deepEqual(user.body, resBody2);
  });

  it('with global extraProps', async () => {
    const reqBody1 = createEnterRequest({session: {user_id: 'custom-user'}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2, user_id: 'custom-user'},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });
    const resBody2 = createResponse({response: {text: 'Как дела?'}});

    const scope = nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1)
      .post('/', reqBody2)
      .reply(200, resBody2);

    const user = new User('http://localhost', {session: {user_id: 'custom-user'}});
    await user.enter();
    await user.say('Что ты умеешь?');

    scope.done();
    assert.deepEqual(user.body, resBody2);
  });

  it('with extraProps + global extraProps', async () => {
    const reqBody1 = createEnterRequest({session: {user_id: 'custom-user'}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2, user_id: 'custom-user'},
      request: {command: '2 + 2 равно 4', original_utterance: 'два плюс два равно четыре'}
    });
    const resBody2 = createResponse({response: {text: 'Ага'}});

    const scope = nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1)
      .post('/', reqBody2)
      .reply(200, resBody2);

    const user = new User('http://localhost', {session: {user_id: 'custom-user'}});
    await user.enter();
    await user.say('2 + 2 равно 4', {request: {original_utterance: 'два плюс два равно четыре'}});

    scope.done();
    assert.deepEqual(user.body, resBody2);
  });

  it('extraProps as a function', async () => {
    const reqBody1 = createEnterRequest({session: {user_id: 'custom-user'}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2, user_id: 'custom-user'},
      request: {command: '2 + 2 равно 4', original_utterance: 'два плюс два равно четыре'}
    });
    const resBody2 = createResponse({response: {text: 'Ага'}});

    const scope = nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1)
      .post('/', reqBody2)
      .reply(200, resBody2);

    const user = new User('http://localhost', body => body.session.user_id = 'custom-user');
    await user.enter();
    await user.say('2 + 2 равно 4', body => body.request.original_utterance = 'два плюс два равно четыре');

    scope.done();
    assert.deepEqual(user.body, resBody2);
  });

  it('throws for non-200 response', async () => {
    const reqBody1 = createEnterRequest();
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });

    nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1)
      .post('/', reqBody2)
      .reply(500, 'Skill error');

    const user = new User('http://localhost');
    await user.enter();
    await assert.rejects(user.say('Что ты умеешь?'), /Skill error/);
  });
});

