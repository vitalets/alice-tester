
const {createRequest, createResponse} = require('../protocol');

describe('enter', () => {
  it('without message', async () => {
    const reqBody = createRequest({
      session: {new: true},
      request: {command: '', original_utterance: ''}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost');
    await user.enter();

    scope.done();
    assert.deepEqual(user.body, resBody);
    assert.equal(user.response.text, 'Привет');
  });

  it('with message', async () => {
    const reqBody = createRequest({
      session: {new: true},
      request: {command: 'Здравствуйте', original_utterance: 'Здравствуйте'}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost');
    await user.enter('Здравствуйте');

    scope.done();
    assert.deepEqual(user.body, resBody);
  });

  it('with extraProps + global extraProps', async () => {
    const reqBody = createRequest({
      session: {new: true, user_id: 'custom-user'},
      request: {command: '', original_utterance: 'запусти навык тест'}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost', {session: {user_id: 'custom-user'}});
    await user.enter('', {request: {original_utterance: 'запусти навык тест'}});

    scope.done();
    assert.deepEqual(user.body, resBody);
    assert.equal(user.response.text, 'Привет');
  });

  it('extraProps as a function', async () => {
    const reqBody = createRequest({
      session: {new: true, user_id: 'custom-user'},
      request: {command: '', original_utterance: 'запусти навык тест'}
    });
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost', body => body.session.user_id = 'custom-user');
    await user.enter('', body => body.request.original_utterance = 'запусти навык тест');

    scope.done();
    assert.deepEqual(user.body, resBody);
    assert.equal(user.response.text, 'Привет');
  });
});
