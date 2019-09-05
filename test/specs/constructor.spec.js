const http = require('http');
const {promisify} = require('util');
const getPort = require('get-port');
const {createResponse, createEnterRequest} = require('../protocol');

describe('constructor', () => {

  it('construct user from string', async () => {
    const reqBody = createEnterRequest();
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost')
      .post('/', reqBody)
      .reply(200, resBody);

    const user = new User('http://localhost');
    await user.enter();

    scope.done();
    assert.equal(user.webhookUrl, 'http://localhost');
    assert.equal(user.response.text, 'Привет');
  });

  it('construct user from config.webhookUrl', async () => {
    User.config.webhookUrl = 'http://localhost';

    const reqBody = createEnterRequest();
    const resBody = createResponse({response: {text: 'Привет'}});

    const scope = nock('http://localhost')
      .post('/', reqBody)
      .reply(200, resBody);

    const user = new User();
    await user.enter();

    scope.done();
    assert.equal(user.webhookUrl, 'http://localhost');
    assert.equal(user.response.text, 'Привет');
  });

  it('throws on empty webhookUrl', async () => {
    assert.throws(() => new User(), /You should provide webhookUrl/);
  });

  describe('construct user from http server instance', () => {
    let server;
    let port;

    before(async () => {
      port = await getPort();
      server = http.createServer((req, res) => res.end(JSON.stringify(createResponse({response: {text: 'Привет'}}))));
      server.listen = promisify(server.listen);
      server.close = promisify(server.close);
      await server.listen(port);
    });

    after(async () => {
      await server.close();
    });

    it('construct from http server instance', async () => {
      const user = new User(server);
      await user.enter();

      assert.equal(user.webhookUrl, `http://localhost:${port}`);
      assert.equal(user.response.text, 'Привет');
    });
  });


});
