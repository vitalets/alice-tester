describe('session state', () => {

  it('session state initially empty', async () => {
    const user = new User();

    await user.enter();

    assert.equal(server.requests[0].state, undefined);
    assert.deepEqual(user.state, {});
  });

  it('store session state', async () => {
    const user = new User();

    server.setResponseBody({response: {text: 'привет'}, session_state: {value: 42}});
    await user.enter();

    assert.deepEqual(user.state, {session: {value: 42}});

    server.setResponseBody({response: {text: 'привет'}, session_state: {value: 100}});
    await user.say('hi');

    assert.deepEqual(server.requests[1].state, {session: {value: 42}});
    assert.deepEqual(user.state, {session: {value: 100}});
  });

  it('clear session state if not returned in response', async () => {
    const user = new User();

    server.setResponseBody({response: {text: 'привет'}, session_state: {value: 42}});
    await user.enter();

    server.setResponseBody({response: {text: 'привет'}});
    await user.say('hi');

    assert.deepEqual(user.state, {});
  });

  it('clear session state on new session', async () => {
    const user = new User();

    server.setResponseBody({response: {text: 'привет'}, session_state: {value: 42}});
    await user.enter();

    await user.enter();
    assert.equal(server.requests[1].state, undefined);
  });

});
