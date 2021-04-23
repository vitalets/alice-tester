describe('application state', () => {

  it('store application state', async () => {
    const user = new User();
    const response = {text: 'привет'};

    server.setResponseBody({response, application_state: {value: 42}});
    await user.enter();
    assert.deepEqual(user.state, {application: {value: 42}});

    server.setResponseBody({response});
    await user.say('hi');
    assert.deepEqual(server.lastRequest.state, {application: {value: 42}});
    assert.deepEqual(user.state, {application: {value: 42}});

    server.setResponseBody({response, application_state: {value: 100}});
    await user.say('hi');
    assert.deepEqual(server.lastRequest.state, {application: {value: 42}});
    assert.deepEqual(user.state, {application: {value: 100}});
  });

  it('dont clear application state by null', async () => {
    const user = new User();
    const response = {text: 'привет'};

    server.setResponseBody({response, application_state: {value: 42}});
    await user.enter();

    server.setResponseBody({response, application_state: null});
    await user.say('hi');

    assert.deepEqual(user.state, {application: {value: 42}});
  });

});
