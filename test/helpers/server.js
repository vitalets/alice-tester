const {promisify} = require('util');
const micro = require('micro');
const Timeout = require('await-timeout');

const defaultHandler = async req => {
  const {version} = req.body;
  const response = {
    text: 'привет',
    tts: 'привет'
  };
  return {response, version};
};

let handler = defaultHandler;
let delay = 0;

const server = micro(async (req, res) => {
  if (req.method === 'POST') {
    req.body = await micro.json(req);
    server.requests.push(req.body);
  }
  if (delay) {
    await Timeout.set(delay);
  }
  return handler(req, res);
});

server.listen = promisify(server.listen);
server.close = promisify(server.close);
server.requests = [];
server.getUrl = () => `http://localhost:${server.address().port}`;
server.setHandler = newHandler => handler = newHandler;
server.setEchoHandler = () => server.setHandler(req => {
  return {
    method: req.method,
    url: req.url,
  };
});
server.setResponseBody = responseBody => server.setHandler(() => {
  responseBody.version = responseBody.version || '1.0';
  return responseBody;
});
server.setResponse = response => server.setHandler(req => {
  const {version} = req.body;
  return {response, version};
});
server.setDelay = ms => delay = ms;
server.reset = () => {
  server.requests.length = 0;
  delay = 0;
  handler = defaultHandler;
};

Object.defineProperty(server, 'lastRequest', {
  get: () => server.requests[server.requests.length - 1]
});

module.exports = server;
