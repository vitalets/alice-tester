
const http = require('http');
const {promisify} = require('util');
const getPort = require('get-port');
const {createResponse} = require('../protocol');

describe('constructor', () => {

  let server;
  let port;

  before(async () => {
    port = await getPort();
    server = http.createServer((req, res) => res.end(JSON.stringify(createResponse())));
    server.listen = promisify(server.listen);
    server.close = promisify(server.close);
    await server.listen(port);
  });

  after(async () => {
    await server.close();
  });

  it('from string', async () => {
    const user = new User(`http://localhost:${port}`);
    await user.enter();

    assert.equal(user.response.text, '');
  });

  it('from http server instance', async () => {
    const user = new User(server);
    await user.enter();

    assert.equal(user.response.text, '');
  });

});
