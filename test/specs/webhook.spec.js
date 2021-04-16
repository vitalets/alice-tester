describe('webhook', () => {

  beforeEach(() => {
    User.config.restore();
  });

  it('webhookUrl as string', async () => {
    const user = new User(server.getUrl());
    await user.enter();

    assert.equal(user.webhookUrl, server.getUrl());
    assert.equal(user.response.text, 'привет');
  });

  it('webhookUrl as function', async () => {
    const webhookFunction = reqBody => {
      const { session, version } = reqBody;
      const response = {
        text: 'привет'
      };
      return { session, version, response };
    };
    const user = new User(webhookFunction);
    await user.enter();

    assert.equal(user.webhookUrl, webhookFunction);
    assert.equal(user.response.text, 'привет');
  });

  it('webhookUrl from config.webhookUrl', async () => {
    User.config.webhookUrl = server.getUrl();

    const user = new User();
    await user.enter();

    assert.equal(user.webhookUrl, server.getUrl());
    assert.equal(user.response.text, 'привет');
  });

  it('webhookUrl from http server instance', async () => {
    const user = new User(server);
    await user.enter();

    assert.equal(user.webhookUrl, server.getUrl());
    assert.equal(user.response.text, 'привет');
  });

  it('throws on empty webhookUrl', async () => {
    assert.throws(() => new User(), /You should provide webhookUrl/);
  });

});
