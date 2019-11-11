describe('constructor', () => {

  beforeEach(() => {
    User.config.restore();
  });

  it('construct user from string', async () => {
    const user = new User(server.getUrl());
    await user.enter();

    assert.equal(user.webhookUrl, server.getUrl());
    assert.equal(user.response.text, 'привет');
  });

  it('construct user from config.webhookUrl', async () => {
    User.config.webhookUrl = server.getUrl();

    const user = new User();
    await user.enter();

    assert.equal(user.webhookUrl, server.getUrl());
    assert.equal(user.response.text, 'привет');
  });

  it('construct from http server instance', async () => {
    const user = new User(server);
    await user.enter();

    assert.equal(user.webhookUrl, server.getUrl());
    assert.equal(user.response.text, 'привет');
  });

  it('throws on empty webhookUrl', async () => {
    assert.throws(() => new User(), /You should provide webhookUrl/);
  });

});
