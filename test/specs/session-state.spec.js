describe('session state', () => {

  it('session state initially empty', async () => {
    const user = new User();

    await user.enter();

    assert.equal(server.lastRequest.state, undefined);
    assert.deepEqual(user.state, {});
  });

  it('store session state', async () => {
    const user = new User();
    const response = {text: 'привет'};

    server.setResponseBody({response, session_state: {value: 42}});
    await user.enter();

    assert.deepEqual(user.state, {session: {value: 42}});

    server.setResponseBody({response, session_state: {value: 100}});
    await user.say('hi');

    assert.deepEqual(server.lastRequest.state, {session: {value: 42}});
    assert.deepEqual(user.state, {session: {value: 100}});
  });

  it('clear session state if not returned in response', async () => {
    const user = new User();
    const response = {text: 'привет'};

    server.setResponseBody({response, session_state: {value: 42}});
    await user.enter();

    server.setResponseBody({response});
    await user.say('hi');

    assert.deepEqual(user.state, {});
  });

  it('clear session state on new session', async () => {
    const user = new User();
    const response = {text: 'привет'};

    server.setResponseBody({response, session_state: {value: 42}});
    await user.enter();
    await user.enter();
    
    assert.equal(server.lastRequest.state, undefined);
  });

});
