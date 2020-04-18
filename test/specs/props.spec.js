describe('props', () => {

  it('userId should be unique', async () => {
    User.config.restore();

    const user1 = new User(server);
    const user2 = new User(server);
    const user3 = new User(server);

    assert.notEqual(user1.id, user2.id);
    assert.notEqual(user1.id, user3.id);
    assert.notEqual(user2.id, user3.id);
  });

  it('sessionId should be unique', async () => {
    const user = new User();
    await user.enter();
    const sessionId = user.sessionId;
    await user.enter();

    assert.notEqual(user.sessionId, sessionId);
  });

  it('should use userId from extraProps if defined as object', async () => {
    const user = new User(server, {session: {user_id: 'foo'}});
    assert.equal(user.id, 'foo');
  });

  it('should update userId from extraProps after first request if defined as function', async () => {
    const user = new User(server, body => body.session.user_id = 'foo');
    await user.enter();
    assert.equal(user.id, 'foo');
  });

  it('history', async () => {
    const user = new User();

    server.setResponse({ text: 'привет' });
    await user.enter();

    server.setResponse({ text: 'как дела?' });
    await user.say('блабла');

    server.setResponse({ text: 'пока' });
    await user.say('блабла');

    assert.deepEqual(user.history, [
      { text: 'пока' },
      { text: 'как дела?' },
      { text: 'привет' }
    ]);
  });
});
