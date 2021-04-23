describe('user state', () => {

  it('store user state', async () => {
    const user = new User();
    const response = {text: 'привет'};

    server.setResponseBody({response, user_state_update: {value: 42}});
    await user.enter();
    assert.deepEqual(user.state, {user: {value: 42}});

    server.setResponseBody({response});
    await user.say('hi');
    assert.deepEqual(server.lastRequest.state, {user: {value: 42}});
    assert.deepEqual(user.state, {user: {value: 42}});

    server.setResponseBody({response, user_state_update: {value: 100}});
    await user.say('hi');
    assert.deepEqual(server.lastRequest.state, {user: {value: 42}});
    assert.deepEqual(user.state, {user: {value: 100}});
  });

  it('clear user state', async () => {
    const user = new User();
    const response = {text: 'привет'};

    server.setResponseBody({response, user_state_update: {value: 42}});
    await user.enter();

    server.setResponseBody({response, user_state_update: null});
    await user.say('hi');

    assert.deepEqual(user.state, {});
  });

});
