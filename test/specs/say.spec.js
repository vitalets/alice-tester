
const {createRequest, createResponse} = require('../protocol');

describe('say', () => {
  it('regular', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });
    const resBody2 = createResponse({response: {text: 'Как дела?'}});

    const scope1 = nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const scope2 = nock('http://localhost').post('/', reqBody2).reply(200, resBody2);

    const user = new User('http://localhost');
    await user.enter();
    await user.say('Что ты умеешь?');

    scope1.done();
    scope2.done();
    assert.deepEqual(user.body, resBody2);
    assert.equal(user.response.text, 'Как дела?');
  });

  it('with extraProps', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?', type: 'ButtonPressed'}
    });
    const resBody2 = createResponse({response: {text: 'Как дела?'}});

    const scope1 = nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const scope2 = nock('http://localhost').post('/', reqBody2).reply(200, resBody2);

    const user = new User('http://localhost');
    await user.enter();
    await user.say('Что ты умеешь?', {request: {type: 'ButtonPressed'}});

    scope1.done();
    scope2.done();
    assert.deepEqual(user.body, resBody2);
  });

  it('with global extraProps', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1, user_id: 'custom-user'}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2, user_id: 'custom-user'},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });
    const resBody2 = createResponse({response: {text: 'Как дела?'}});

    const scope1 = nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const scope2 = nock('http://localhost').post('/', reqBody2).reply(200, resBody2);

    const user = new User('http://localhost', {session: {user_id: 'custom-user'}});
    await user.enter();
    await user.say('Что ты умеешь?');

    scope1.done();
    scope2.done();
    assert.deepEqual(user.body, resBody2);
  });

  it('with extraProps + global extraProps', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1, user_id: 'custom-user'}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2, user_id: 'custom-user'},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?', type: 'ButtonPressed'}
    });
    const resBody2 = createResponse({response: {text: 'Как дела?'}});

    const scope1 = nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    const scope2 = nock('http://localhost').post('/', reqBody2).reply(200, resBody2);

    const user = new User('http://localhost', {session: {user_id: 'custom-user'}});
    await user.enter();
    await user.say('Что ты умеешь?', {request: {type: 'ButtonPressed'}});

    scope1.done();
    scope2.done();
    assert.deepEqual(user.body, resBody2);
  });

  it('throws for non-200 response', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });

    nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    nock('http://localhost').post('/', reqBody2).reply(500, 'Skill error');

    const user = new User('http://localhost');
    await user.enter();
    await assertThrowsAsync(() => user.say('Что ты умеешь?'), /Skill error/);
  });

  it('throws for empty message', async () => {
    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
    const resBody1 = createResponse();

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });

    nock('http://localhost').post('/', reqBody1).reply(200, resBody1);
    nock('http://localhost').post('/', reqBody2).reply(500, 'Skill error');

    const user = new User('http://localhost');
    await user.enter();
    await assertThrowsAsync(() => user.say(''), /User must say something/);
  });
});

