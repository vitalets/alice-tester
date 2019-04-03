
const {createRequest, createEnterRequest, createResponse} = require('../protocol');

describe('enter', () => {
  it('without message', async () => {
    const reqBody = createRequest({
      session: {new: true},
      request: {command: '', original_utterance: 'запусти навык тест'}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost')
      .post('/', reqBody)
      .reply(200, resBody);

    const user = new User('http://localhost');
    const response = await user.enter();

    scope.done();
    assert.deepEqual(user.body, resBody);
    assert.equal(user.response.text, 'Привет');
    assert.deepEqual(user.response, response);
  });

  it('with message', async () => {
    const reqBody = createRequest({
      session: {new: true},
      request: {command: 'куку', original_utterance: 'запусти навык тест куку'}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost');
    await user.enter('куку');

    scope.done();
    assert.deepEqual(user.body, resBody);
  });

  it('with extraProps + global extraProps', async () => {
    const reqBody = createRequest({
      session: {new: true, user_id: 'custom-user'},
      request: {command: 'пицца', original_utterance: 'запусти навык тест пицца', nlu: {tokens: ['пицца']}}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost')
      .post('/', reqBody)
      .reply(200, resBody);

    const user = new User('http://localhost', {session: {user_id: 'custom-user'}});
    await user.enter('пицца', {request: {nlu: {tokens: ['пицца']}}});

    scope.done();
    assert.deepEqual(user.body, resBody);
    assert.equal(user.response.text, 'Привет');
  });

  it('extraProps as a function', async () => {
    const reqBody = createRequest({
      session: {new: true, user_id: 'custom-user'},
      request: {command: 'пицца', original_utterance: 'запусти навык тест пицца', nlu: {tokens: ['пицца']}}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost', body => body.session.user_id = 'custom-user');
    await user.enter('пицца', body => body.request.nlu.tokens = ['пицца']);

    scope.done();
    assert.deepEqual(user.body, resBody);
    assert.equal(user.response.text, 'Привет');
  });

  it('throws for timeout', async () => {
    User.config.responseTimeout = 100;
    nock('http://localhost')
      .post('/', createEnterRequest())
      .delay(150)
      .reply(200, createResponse());

    const user = new User('http://localhost');

    await assert.rejects(user.enter(), /Response time \(\d+ ms\) exceeded timeout \(100 ms\)/);
  });
});
